import os
import logging
from typing import Dict, Any, List
from pydantic import BaseModel, Field, ValidationError
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openrouter import ChatOpenRouter
# -------------------------------------------------------------------------
# 1. Logging Configuration
# -------------------------------------------------------------------------
logger = logging.getLogger("Medisense.PharmacologyAgent")
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(ch)

# -------------------------------------------------------------------------
# 2. Schema Definition
# -------------------------------------------------------------------------
class PharmacologyEvaluation(BaseModel):
    """Structured safety evaluation of the proposed oncology regimen."""
    is_safe: bool = Field(
        description="True if the regimen is safe for this specific patient. False if critical contraindications, toxicities, or interactions are detected."
    )
    identified_risks: List[str] = Field(
        description="A list of specific safety risks detected (e.g., ['Cisplatin contraindicated due to eGFR < 60', 'High bleed risk with Warfarin']). Empty list if safe."
    )
    pharmacology_notes: str = Field(
        description="A clear clinical explanation of the safety evaluation and any identified physiological bottlenecks."
    )
    recommended_modifications: str = Field(
        description="Actionable advice for the Oncology Agent to adjust the plan (e.g., 'Switch Cisplatin to Carboplatin', 'Hold Warfarin'). Output 'None required' if safe."
    )
    evaluation_successful: bool = Field(
        default=True,
        description="Internal flag. True if evaluation ran successfully, False if API or parsing failed."
    )

# -------------------------------------------------------------------------
# 3. Model & Prompt Configuration (Hugging Face API)
# -------------------------------------------------------------------------
def get_openrouter_llm():
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable is not set in .env")

    return ChatOpenRouter(
        # OpenRouter has excellent free models that natively support JSON formatting
        model="meta-llama/llama-3.3-70b-instruct:free", 
        api_key=api_key,
        temperature=0.0,
        max_retries=3
    )

PHARMACOLOGY_SYSTEM_PROMPT = """You are an expert Oncology Clinical Pharmacologist and the final safety guardrail for a Tumor Board.
Your job is to cross-check the Oncology Agent's proposed treatment regimen against the patient's physiological lab values and active prescriptions.

RULES:
1. Identify RENAL toxicities (e.g., Cisplatin requires eGFR > 60 mL/min).
2. Identify CARDIAC toxicities (e.g., Trastuzumab or Anthracyclines require LVEF > 50%).
3. Identify HEPATIC toxicities (e.g., severe AST/ALT elevation requires dose reduction).
4. Identify DRUG-DRUG INTERACTIONS (e.g., chemotherapies interacting with anticoagulants like Warfarin).
5. If ANY dangerous interaction or threshold violation is found, you MUST set `is_safe` to false and explicitly list the `identified_risks`.
6. Suggest `recommended_modifications` to fix the plan.
7. Format your output strictly as JSON.
"""

# -------------------------------------------------------------------------
# 4. Core Agent Node Function
# -------------------------------------------------------------------------
def run_pharmacology_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function for the Pharmacology Agent.
    """
    logger.info("Initializing Pharmacology Agent (Safety Guardrail)...")
    
    # 1. Retrieve the drafted plan and patient labs from state
    treatment_plan = state.get("treatment_plan", {})
    patient_labs = state.get("patient_labs", {})
    
    # Extract the specific regimen to test
    proposed_regimen = treatment_plan.get("recommended_regimen", "No regimen provided.")
    
    if not proposed_regimen or proposed_regimen == "No regimen provided.":
        logger.warning("No treatment plan found to evaluate.")
        fallback = PharmacologyEvaluation(
            is_safe=False,
            identified_risks=["No treatment plan drafted by Oncology Agent."],
            pharmacology_notes="Cannot perform safety check without a proposed regimen.",
            recommended_modifications="Oncology Agent must provide a regimen.",
            evaluation_successful=False
        )
        return {"pharmacology_data": fallback.model_dump(), "consensus_reached": False}

    # 2. Construct the evaluation context
    eval_context = f"""
    --- PROPOSED ONCOLOGY REGIMEN ---
    {proposed_regimen}
    
    --- PATIENT LABS & VITALS ---
    eGFR (Renal): {patient_labs.get('eGFR', 'Unknown')}
    LVEF (Cardiac): {patient_labs.get('LVEF', 'Unknown')}
    AST/ALT (Hepatic): {patient_labs.get('AST_ALT', 'Unknown')}
    
    --- ACTIVE PRESCRIPTIONS ---
    {', '.join(patient_labs.get('active_medications', [])) if patient_labs.get('active_medications') else 'None'}
    """

    # 3. Setup LLM with structured output binding
    try:
        llm = get_hf_pharmacology_llm()
        structured_llm = llm.with_structured_output(PharmacologyEvaluation)
        
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=PHARMACOLOGY_SYSTEM_PROMPT),
            HumanMessage(content=f"EVALUATE THIS REGIMEN FOR SAFETY ALERTS:\n\n{eval_context}")
        ])
        
        pharmacology_chain = prompt | structured_llm
        
    except Exception as e:
        logger.error(f"Failed to initialize Hugging Face LLM chain: {str(e)}")
        raise

    # 4. Execute safety evaluation
    try:
        logger.info("Running cross-checks against patient labs and active meds...")
        eval_result: PharmacologyEvaluation = pharmacology_chain.invoke({})
        
        logger.info(f"Evaluation complete. Safe: {eval_result.is_safe}")
        if not eval_result.is_safe:
            logger.warning(f"Safety risks identified: {eval_result.identified_risks}")
        
        # Crucial: This node updates BOTH the pharmacology data and the global consensus flag
        # The consensus_reached flag is what graph.py uses for the conditional edge routing
        return {
            "pharmacology_data": eval_result.model_dump(),
            "consensus_reached": eval_result.is_safe
        }

    except ValidationError as ve:
        logger.error(f"Pydantic Validation Error: {str(ve)}")
        fallback = PharmacologyEvaluation(
            is_safe=False, # Default to unsafe if we can't parse the output
            identified_risks=["System Parsing Error - Cannot verify safety."],
            pharmacology_notes="Model output could not be formatted.",
            recommended_modifications="Manual physician review required.",
            evaluation_successful=False
        )
        return {"pharmacology_data": fallback.model_dump(), "consensus_reached": False}
        
    except Exception as e:
        logger.error(f"Critical execution error in Pharmacology Agent: {str(e)}")
        fallback = PharmacologyEvaluation(
            is_safe=False, 
            identified_risks=["API connection failure - Safety unverified."],
            pharmacology_notes="Endpoint timed out.",
            recommended_modifications="Manual physician review required.",
            evaluation_successful=False
        )
        return {"pharmacology_data": fallback.model_dump(), "consensus_reached": False}