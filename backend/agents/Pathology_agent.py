import os
import logging
from typing import Dict, Any
from pydantic import BaseModel, Field, ValidationError
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_openrouter import ChatOpenRouter
# -------------------------------------------------------------------------
# 1. Logging Configuration
# -------------------------------------------------------------------------
logger = logging.getLogger("Medisense.PathologyAgent")
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(ch)

# -------------------------------------------------------------------------
# 2. Schema Definition 
# -------------------------------------------------------------------------
class PathologyExtraction(BaseModel):
    """Structured data extracted from an unstructured pathology report."""
    histology_type: str = Field(
        description="The histological classification of the tumor (e.g., Adenocarcinoma, Squamous Cell Carcinoma). Output 'Not Specified' if absent."
    )
    tumor_grade: str = Field(
        description="The differentiation grade of the tumor (e.g., G1, G2, G3, High Grade). Output 'Not Specified' if absent."
    )
    biopsy_findings: str = Field(
        description="Concise summary of critical biopsy findings, surgical margins, and lymph node involvement."
    )
    extraction_successful: bool = Field(
        default=True,
        description="Internal flag. True if data was successfully extracted, False if fallback was triggered."
    )

# -------------------------------------------------------------------------
# 3. Model Configuration (Raw Hugging Face Endpoint)
# -------------------------------------------------------------------------
# -------------------------------------------------------------------------
# 3. Model Configuration (Raw Hugging Face Endpoint)
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

# -------------------------------------------------------------------------
# 4. Prompt Configuration
# -------------------------------------------------------------------------
PATHOLOGY_SYSTEM_PROMPT = """You are an expert oncological pathologist and an automated clinical data extractor.
Your sole purpose is to analyze unstructured pathology reports and extract specific variables.

RULES:
1. Extract the Histology Type, Tumor Grade, and Biopsy Findings.
2. If a specific data point is missing from the text, you MUST output 'Not Specified'.
3. Do NOT invent, infer, or hallucinate clinical values.
4. You must format your output to perfectly match the provided JSON schema.

{format_instructions}

EXTRACT FROM THIS PATHOLOGY REPORT:
{raw_report}
"""

# -------------------------------------------------------------------------
# 5. Core Agent Node Function
# -------------------------------------------------------------------------
def run_pathology_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function for the Pathology Agent using Hugging Face API.
    """
    logger.info("Initializing Pathology Agent extraction via Hugging Face Endpoint...")
    
    # 1. Retrieve the raw report from the global state
    raw_report = state.get("raw_pathology_report", "").strip()
    
    if not raw_report:
        logger.warning("No raw pathology report found in state.")
        fallback_data = PathologyExtraction(
            histology_type="Not Specified",
            tumor_grade="Not Specified",
            biopsy_findings="No pathology report provided to the system.",
            extraction_successful=False
        )
        return {"pathology_data": fallback_data.model_dump()}

    # 2. Setup LLM, Parser, and Prompt Pipeline
    try:
        llm = get_hf_llm()
        parser = JsonOutputParser(pydantic_object=PathologyExtraction)
        
        prompt = PromptTemplate(
            template=PATHOLOGY_SYSTEM_PROMPT,
            input_variables=["raw_report"],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )
        
        # Chain them together
        pathology_chain = prompt | llm | parser
        
    except Exception as e:
        logger.error(f"Failed to initialize Hugging Face LLM chain: {str(e)}")
        raise

    # 3. Execute extraction with error boundaries
    try:
        logger.info(f"Invoking HF Endpoint (Mistral-7B) for structured extraction...")
        extraction_result = pathology_chain.invoke({"raw_report": raw_report})
        
        logger.info(f"Extraction successful: {extraction_result.get('histology_type')}, {extraction_result.get('tumor_grade')}")
        
        # Because JsonOutputParser returns a dict directly, we ensure the 'extraction_successful' flag is present
        extraction_result["extraction_successful"] = True
        return {"pathology_data": extraction_result}

    except ValidationError as ve:
        logger.error(f"Pydantic Validation Error (HF Model failed strict schema): {str(ve)}")
        fallback_data = PathologyExtraction(
            histology_type="Extraction Error",
            tumor_grade="Extraction Error",
            biopsy_findings="Model failed to parse data into required format. Raw report exists but could not be structured.",
            extraction_successful=False
        )
        return {"pathology_data": fallback_data.model_dump()}
        
    except Exception as e:
        logger.error(f"Critical execution error in Pathology Agent: {str(e)}")
        fallback_data = PathologyExtraction(
            histology_type="System Error",
            tumor_grade="System Error",
            biopsy_findings="Hugging Face API endpoint failed, timed out, or rate limit exceeded.",
            extraction_successful=False
        )
        return {"pathology_data": fallback_data.model_dump()}