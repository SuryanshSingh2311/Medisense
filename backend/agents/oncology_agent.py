import os
import logging
from typing import Dict, Any, List
from pydantic import BaseModel, Field, ValidationError
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openrouter import ChatOpenRouter
from config import settings

# -------------------------------------------------------------------------
# 1. Logging Configuration
# -------------------------------------------------------------------------
logger = logging.getLogger("Medisense.OncologyAgent")
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(ch)

# -------------------------------------------------------------------------
# 2. Schema Definition
# -------------------------------------------------------------------------
class OncologyDraft(BaseModel):
    """Structured oncology treatment plan drafted by the LLM."""
    primary_diagnosis_summary: str = Field(
        description="A comprehensive summary of the patient's cancer profile (e.g., 'Stage IV NSCLC, KRAS G12C positive')."
    )
    recommended_regimen: str = Field(
        description="The primary recommended treatment protocol (drugs, dosing, and schedule) based on guidelines."
    )
    alternative_regimen: str = Field(
        description="A secondary alternative treatment regimen in case of contraindications or patient intolerance."
    )
    clinical_rationale: str = Field(
        description="A clear medical justification for the chosen regimen, directly referencing the patient's biomarkers and staging."
    )
    guideline_citations: List[str] = Field(
        description="Specific snippets or references from the retrieved NCCN/ESMO guidelines supporting this decision."
    )
    drafting_successful: bool = Field(
        default=True,
        description="Internal flag. True if plan was successfully drafted, False if fallback was triggered."
    )

# -------------------------------------------------------------------------
# 3. Model Configuration (OpenRouter)
# -------------------------------------------------------------------------
def get_openrouter_llm():
    api_key = settings.openrouter_api_key or os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable is not set in .env")

    return ChatOpenRouter(
        model=settings.model_id, 
        api_key=api_key,
        temperature=0.0,
        max_retries=3
    )

ONCOLOGY_SYSTEM_PROMPT = """You are an expert Medical Oncologist leading a Multidisciplinary Tumor Board.
Your task is to synthesize the provided diagnostic data (Pathology, Radiology, Genomics) and retrieved medical protocols (NCCN/ESMO) to draft an evidence-based treatment plan.

RULES:
1. Base your recommendation STRICTLY on the retrieved guidelines and patient biomarkers.
2. Formulate a primary `recommended_regimen` and an `alternative_regimen`.
3. Provide a clear `clinical_rationale` explaining why this regimen was chosen over others.
4. Extract explicit guideline quotes into the `guideline_citations` list.
5. Format your output as strict JSON matching the provided schema. Do not include markdown formatting or conversational filler outside the JSON.
"""

# -------------------------------------------------------------------------
# 4. Core Agent Node Function
# -------------------------------------------------------------------------
def run_oncology_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    logger.info("Initializing Oncology Agent (Treatment Synthesis)...")
    
    pathology = state.get("pathology_data", {})
    radiology = state.get("radiology_data", {})
    genomics = state.get("genomics_data", {})
    guidelines = state.get("guidelines_data", {})
    moderator = state.get("moderator_data", {})
    
    clinical_context = f"""
    --- PATIENT DIAGNOSTICS ---
    Pathology: {pathology.get('histology_type', 'N/A')}, Grade: {pathology.get('tumor_grade', 'N/A')}
    Radiology: {radiology.get('clinical_staging', 'N/A')}, Location: {radiology.get('primary_mass_location', 'N/A')}
    Genomics: EGFR: {genomics.get('egfr_status', 'N/A')}, KRAS: {genomics.get('kras_status', 'N/A')}, PD-L1: {genomics.get('pd_l1_expression', 'N/A')}
    Other Biomarkers: {', '.join(genomics.get('other_biomarkers', [])) if genomics.get('other_biomarkers') else 'None'}
    
    --- RETRIEVED GUIDELINES ---
    NCCN Protocols: {guidelines.get('nccn_retrieval', 'No NCCN data available.')}
    ESMO Protocols: {guidelines.get('esmo_retrieval', 'No ESMO data available.')}
    """

    # Inject Moderator constraints if this is a retry cycle
    if state.get("retry_count", 0) > 0 and moderator:
        logger.warning("Renegotiation Cycle detected. Injecting Moderator constraints.")
        clinical_context += f"""
        --- CRITICAL MODERATOR DIRECTIVE (PREVIOUS DRAFT REJECTED) ---
        Reason for rejection: {moderator.get('conflict_summary')}
        Mandatory Adjustments: {moderator.get('mandatory_adjustments')}
        YOU MUST FOLLOW THESE ADJUSTMENTS IN YOUR NEW DRAFT.
        """

    try:
        # FIXED: Use correct openrouter loader function
        llm = get_openrouter_llm()
        structured_llm = llm.with_structured_output(OncologyDraft)
        
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=ONCOLOGY_SYSTEM_PROMPT),
            HumanMessage(content=f"SYNTHESIZE THE FOLLOWING DATA INTO A TREATMENT PLAN:\n\n{clinical_context}")
        ])
        
        oncology_chain = prompt | structured_llm
        
    except Exception as e:
        logger.error(f"Failed to initialize OpenRouter LLM chain: {str(e)}")
        raise

    try:
        logger.info(f"Invoking OpenRouter Model ({settings.model_id}) for plan drafting...")
        draft_result: OncologyDraft = oncology_chain.invoke({})
        logger.info(f"Draft successful. Recommended Regimen: {draft_result.recommended_regimen}")
        
        return {"treatment_plan": draft_result.model_dump()}

    except ValidationError as ve:
        logger.error(f"Pydantic Validation Error: {str(ve)}")
        fallback_data = OncologyDraft(
            primary_diagnosis_summary="Synthesis Error",
            recommended_regimen="Requires Human Review - Schema parsing failed.",
            alternative_regimen="Requires Human Review",
            clinical_rationale="The model failed to format the synthesized plan into the required schema.",
            guideline_citations=[],
            drafting_successful=False
        )
        return {"treatment_plan": fallback_data.model_dump()}
        
    except Exception as e:
        logger.error(f"Critical execution error in Oncology Agent: {str(e)}")
        fallback_data = OncologyDraft(
            primary_diagnosis_summary="System Error",
            recommended_regimen="System Failure",
            alternative_regimen="System Failure",
            clinical_rationale="Inference API endpoint failed or timed out during synthesis.",
            guideline_citations=[],
            drafting_successful=False
        )
        return {"treatment_plan": fallback_data.model_dump()}