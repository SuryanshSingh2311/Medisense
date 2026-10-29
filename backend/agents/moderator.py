import os
import logging
from typing import Dict, Any
from pydantic import BaseModel, Field, ValidationError
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openrouter import ChatOpenRouter
from config import settings

# -------------------------------------------------------------------------
# 1. Logging Configuration
# -------------------------------------------------------------------------
logger = logging.getLogger("Medisense.ModeratorAgent")
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(ch)

# -------------------------------------------------------------------------
# 2. Schema Definition
# -------------------------------------------------------------------------
class ModeratorDirective(BaseModel):
    """Structured directives issued to the Oncology Agent for plan renegotiation."""
    conflict_summary: str = Field(
        description="A concise summary of why the previous plan was rejected by the Pharmacology Agent."
    )
    mandatory_adjustments: str = Field(
        description="Strict clinical instructions for the Oncology Agent on how to revise the regimen (e.g., 'Substitute Cisplatin with Carboplatin')."
    )
    moderation_successful: bool = Field(
        default=True,
        description="Internal flag. True if directive was successfully generated."
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

MODERATOR_SYSTEM_PROMPT = """You are the Lead Clinical Moderator of a Multidisciplinary Tumor Board.
The Oncology Agent proposed a treatment regimen, but the Pharmacology Agent REJECTED it due to safety risks/toxicities.

RULES:
1. Analyze the rejected treatment plan and the specific safety risks identified by Pharmacology.
2. Issue a strict, actionable directive (`mandatory_adjustments`) to the Oncology Agent on exactly how to fix the plan.
3. DO NOT draft the new treatment plan yourself. You are only providing constraints for the next draft.
4. Format your output strictly as JSON.
"""

# -------------------------------------------------------------------------
# 4. Core Agent Node Function
# -------------------------------------------------------------------------
def run_moderator_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    logger.warning("Initializing Moderator Agent (Conflict Resolution Triggered)...")
    
    treatment_plan = state.get("treatment_plan", {})
    pharmacology = state.get("pharmacology_data", {})
    current_retries = state.get("retry_count", 0)
    
    rejected_regimen = treatment_plan.get("recommended_regimen", "Unknown")
    identified_risks = pharmacology.get("identified_risks", [])
    suggested_mods = pharmacology.get("recommended_modifications", "None provided.")

    conflict_context = f"""
    --- REJECTED REGIMEN ---
    {rejected_regimen}
    
    --- PHARMACOLOGY REJECTION REASONS ---
    Risks Identified: {', '.join(identified_risks)}
    Pharmacologist Suggestions: {suggested_mods}
    """

    try:
        # FIXED: Use correct openrouter loader function
        llm = get_openrouter_llm()
        structured_llm = llm.with_structured_output(ModeratorDirective)
        
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=MODERATOR_SYSTEM_PROMPT),
            HumanMessage(content=f"RESOLVE THIS CLINICAL CONFLICT:\n\n{conflict_context}")
        ])
        
        moderator_chain = prompt | structured_llm
        
    except Exception as e:
        logger.error(f"Failed to initialize OpenRouter LLM chain: {str(e)}")
        raise

    try:
        logger.info(f"Generating strict revision directives via OpenRouter (Attempt {current_retries + 1})...")
        moderator_result: ModeratorDirective = moderator_chain.invoke({})
        logger.info(f"Directive issued: {moderator_result.mandatory_adjustments}")
        
        return {
            "moderator_data": moderator_result.model_dump(),
            "retry_count": current_retries + 1
        }

    except ValidationError as ve:
        logger.error(f"Pydantic Validation Error: {str(ve)}")
        fallback = ModeratorDirective(
            conflict_summary="Parsing failed.",
            mandatory_adjustments="Remove the toxic agents identified by Pharmacology and try again.",
            moderation_successful=False
        )
        return {"moderator_data": fallback.model_dump(), "retry_count": current_retries + 1}
        
    except Exception as e:
        logger.error(f"Critical execution error in Moderator Agent: {str(e)}")
        fallback = ModeratorDirective(
            conflict_summary="System failed to generate summary.",
            mandatory_adjustments="Select alternative regimen avoiding identified contraindications.",
            moderation_successful=False
        )
        return {"moderator_data": fallback.model_dump(), "retry_count": current_retries + 1}