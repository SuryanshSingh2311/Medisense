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
logger = logging.getLogger("Medisense.GenomicsAgent")
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(ch)

# -------------------------------------------------------------------------
# 2. Schema Definition
# -------------------------------------------------------------------------
class GenomicsExtraction(BaseModel):
    """Structured data extracted from genomic/molecular biomarker reports."""
    egfr_status: str = Field(
        description="EGFR mutation status (e.g., 'Positive - Exon 19 Deletion', 'Negative', 'Not Specified')."
    )
    alk_status: str = Field(
        description="ALK rearrangement status (e.g., 'Positive', 'Negative', 'Not Specified')."
    )
    kras_status: str = Field(
        description="KRAS mutation status, specifically noting variants like G12C if present (e.g., 'Positive - G12C', 'Negative'). Output 'Not Specified' if absent."
    )
    pd_l1_expression: str = Field(
        description="PD-L1 Tumor Proportion Score (TPS) percentage (e.g., '<1%', '1-49%', '>=50%'). Output 'Not Specified' if absent."
    )
    other_biomarkers: List[str] = Field(
        description="List of any other detected actionable mutations or fusions (e.g., ['ROS1', 'BRAF V600E', 'MET', 'HER2', 'RET']). Empty list [] if none."
    )
    extraction_successful: bool = Field(
        default=True,
        description="Internal flag. True if data was successfully extracted, False if fallback was triggered."
    )

# -------------------------------------------------------------------------
# 3. Model & Prompt Configuration (OpenRouter)
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

GENOMICS_SYSTEM_PROMPT = """You are an expert molecular oncologist and clinical data extractor.
Analyze the provided Next-Generation Sequencing (NGS) or molecular biomarker report and extract the specific genetic variants.

RULES:
1. Extract the status for EGFR, ALK, KRAS, and the PD-L1 expression score.
2. If other clinically actionable mutations (e.g., ROS1, BRAF, MET, RET, HER2) are found, add them to the 'other_biomarkers' list as strings. If none, return [].
3. If a requested biomarker is not tested or mentioned in the text, you MUST output 'Not Specified'.
4. Do NOT invent, infer, or hallucinate clinical values.
5. You must format your output to perfectly match the provided JSON schema.
"""

# -------------------------------------------------------------------------
# 4. Core Agent Node Function
# -------------------------------------------------------------------------
def run_genomics_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function for the Genomics Agent via OpenRouter.
    """
    logger.info("Initializing Genomics Agent extraction via OpenRouter...")
    
    raw_report = state.get("raw_genomics_report", "").strip()
    
    if not raw_report:
        logger.warning("No raw genomics report found in state.")
        fallback_data = GenomicsExtraction(
            egfr_status="Not Specified",
            alk_status="Not Specified",
            kras_status="Not Specified",
            pd_l1_expression="Not Specified",
            other_biomarkers=[],
            extraction_successful=False
        )
        return {"genomics_data": fallback_data.model_dump()}

    try:
        llm = get_openrouter_llm()
        structured_llm = llm.with_structured_output(GenomicsExtraction)
        
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=GENOMICS_SYSTEM_PROMPT),
            HumanMessage(content=f"EXTRACT FROM THIS MOLECULAR REPORT:\n\n{raw_report}")
        ])
        
        genomics_chain = prompt | structured_llm
        
    except Exception as e:
        logger.error(f"Failed to initialize OpenRouter LLM chain: {str(e)}")
        raise

    try:
        logger.info(f"Invoking OpenRouter Model ({settings.model_id}) for genomics extraction...")
        # FIXED: Pass raw_report implicitly through the message prompt above
        extraction_result: GenomicsExtraction = genomics_chain.invoke({})
        logger.info(f"Extraction successful: EGFR: {extraction_result.egfr_status}, PD-L1: {extraction_result.pd_l1_expression}")
        
        return {"genomics_data": extraction_result.model_dump()}

    except ValidationError as ve:
        logger.error(f"Pydantic Validation Error (Model failed strict schema): {str(ve)}")
        fallback_data = GenomicsExtraction(
            egfr_status="Extraction Error",
            alk_status="Extraction Error",
            kras_status="Extraction Error",
            pd_l1_expression="Extraction Error",
            other_biomarkers=[],
            extraction_successful=False
        )
        return {"genomics_data": fallback_data.model_dump()}
        
    except Exception as e:
        logger.error(f"Critical execution error in Genomics Agent: {str(e)}")
        fallback_data = GenomicsExtraction(
            egfr_status="System Error",
            alk_status="System Error",
            kras_status="System Error",
            pd_l1_expression="System Error",
            other_biomarkers=[],
            extraction_successful=False
        )
        return {"genomics_data": fallback_data.model_dump()}