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
logger = logging.getLogger("Medisense.RadiologyAgent")
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(ch)

# -------------------------------------------------------------------------
# 2. Schema Definition
# -------------------------------------------------------------------------
class RadiologyExtraction(BaseModel):
    """Structured data extracted from an unstructured imaging or radiology report."""
    imaging_modality: str = Field(
        description="The type of scan performed (e.g., Contrast CT Chest, MRI Abdomen, PET-CT). Output 'Not Specified' if absent."
    )
    primary_mass_location: str = Field(
        description="The anatomical location of the primary tumor/lesion (e.g., Right Upper Lobe, Pancreatic Head). Output 'Not Specified' if absent."
    )
    lesion_dimensions: str = Field(
        description="The size or dimensions of the primary mass (e.g., '3.2 x 2.8 cm'). Output 'Not Specified' if absent."
    )
    metastasis_sites: List[str] = Field(
        description="A list of anatomical sites where metastatic spread is identified. Output an empty list [] if no metastasis is noted."
    )
    clinical_staging: str = Field(
        description="The clinical stage or TNM staging if mentioned in the impression (e.g., 'cT2N1M0' or 'Stage IIB'). Output 'Not Specified' if absent."
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

RADIOLOGY_SYSTEM_PROMPT = """You are an expert oncology radiologist and automated clinical data extractor.
Analyze the provided radiology/imaging report and extract the specific requested variables.

RULES:
1. Extract the Imaging Modality, Primary Mass Location, Lesion Dimensions, Metastasis Sites, and Clinical Staging.
2. If Metastasis Sites are mentioned, format them as a JSON list of strings. If none are found, return an empty list: [].
3. If any other data point is missing from the text, you MUST output 'Not Specified'.
4. Do NOT invent, infer, or hallucinate clinical values.
5. You must format your output to perfectly match the provided JSON schema.
"""

# -------------------------------------------------------------------------
# 4. Core Agent Node Function
# -------------------------------------------------------------------------
def run_radiology_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function for the Radiology Agent via OpenRouter.
    """
    logger.info("Initializing Radiology Agent extraction via OpenRouter...")
    
    raw_report = state.get("raw_radiology_report", "").strip()
    
    if not raw_report:
        logger.warning("No raw radiology report found in state.")
        fallback_data = RadiologyExtraction(
            imaging_modality="Not Specified",
            primary_mass_location="Not Specified",
            lesion_dimensions="Not Specified",
            metastasis_sites=[],
            clinical_staging="Not Specified",
            extraction_successful=False
        )
        return {"radiology_data": fallback_data.model_dump()}

    try:
        # FIXED: Calling correct openrouter loader instead of missing get_hf_radiology_llm()
        llm = get_openrouter_llm()
        structured_llm = llm.with_structured_output(RadiologyExtraction)
        
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=RADIOLOGY_SYSTEM_PROMPT),
            HumanMessage(content=f"EXTRACT FROM THIS RADIOLOGY REPORT:\n\n{raw_report}")
        ])
        
        radiology_chain = prompt | structured_llm
        
    except Exception as e:
        logger.error(f"Failed to initialize OpenRouter LLM chain: {str(e)}")
        raise

    try:
        logger.info(f"Invoking OpenRouter Model ({settings.model_id}) for structured extraction...")
        extraction_result: RadiologyExtraction = radiology_chain.invoke({})
        logger.info(f"Extraction successful: Mass at {extraction_result.primary_mass_location}, {len(extraction_result.metastasis_sites)} met sites identified.")
        
        return {"radiology_data": extraction_result.model_dump()}

    except ValidationError as ve:
        logger.error(f"Pydantic Validation Error (Model failed strict schema): {str(ve)}")
        fallback_data = RadiologyExtraction(
            imaging_modality="Extraction Error",
            primary_mass_location="Extraction Error",
            lesion_dimensions="Extraction Error",
            metastasis_sites=[],
            clinical_staging="Extraction Error",
            extraction_successful=False
        )
        return {"radiology_data": fallback_data.model_dump()}
        
    except Exception as e:
        logger.error(f"Critical execution error in Radiology Agent: {str(e)}")
        fallback_data = RadiologyExtraction(
            imaging_modality="System Error",
            primary_mass_location="System Error",
            lesion_dimensions="System Error",
            metastasis_sites=[],
            clinical_staging="System Error",
            extraction_successful=False
        )
        return {"radiology_data": fallback_data.model_dump()}