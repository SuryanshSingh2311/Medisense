import os
import logging
import sys
from typing import List, Dict, Any
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# FastMCP creates the microservice endpoints
from fastmcp import FastMCP

# Import the deterministic clinical math from our local tools
from tools.calculators import (
    calculate_bsa,
    calculate_crcl,
    calculate_egfr_ckd_epi,
    calculate_carboplatin_dose
)

# -------------------------------------------------------------------------
# 1. Logging Configuration
# -------------------------------------------------------------------------
logger = logging.getLogger("Medisense.SafetyServer")
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(ch)

# -------------------------------------------------------------------------
# 2. FastMCP Server Initialization
# -------------------------------------------------------------------------
# This initializes the MCP server for the safety calculators
mcp = FastMCP("Medisense Safety & Pharmacology Microservice")

# -------------------------------------------------------------------------
# 3. Expose FastMCP Tools (@mcp.tool)
# -------------------------------------------------------------------------

@mcp.tool()
def get_bsa(height_cm: float, weight_kg: float) -> float:
    """
    Calculate Body Surface Area (BSA) for chemotherapy dosing.
    """
    logger.info(f"Calculating BSA for H:{height_cm}cm, W:{weight_kg}kg")
    try:
        return calculate_bsa(height_cm, weight_kg)
    except Exception as e:
        logger.error(f"BSA Calculation error: {str(e)}")
        return -1.0

@mcp.tool()
def get_egfr(age: int, serum_creatinine: float, is_female: bool) -> float:
    """
    Calculate estimated Glomerular Filtration Rate (eGFR) to check renal function.
    """
    logger.info(f"Calculating eGFR for Age:{age}, SCr:{serum_creatinine}, Female:{is_female}")
    try:
        return calculate_egfr_ckd_epi(age, serum_creatinine, is_female)
    except Exception as e:
        logger.error(f"eGFR Calculation error: {str(e)}")
        return -1.0

@mcp.tool()
def get_carboplatin_dose(target_auc: float, age: int, weight_kg: float, serum_creatinine: float, is_female: bool) -> float:
    """
    Calculate Carboplatin dose using Calvert Formula based on Target AUC and patient CrCl.
    Automatically applies the 125 mL/min GFR safety cap.
    """
    logger.info(f"Calculating Carboplatin dose for Target AUC: {target_auc}")
    try:
        crcl = calculate_crcl(age, weight_kg, serum_creatinine, is_female)
        return calculate_carboplatin_dose(target_auc, crcl)
    except Exception as e:
        logger.error(f"Carboplatin Calculation error: {str(e)}")
        return -1.0

@mcp.tool()
def check_contraindications(proposed_drugs: List[str], active_medications: List[str], egfr: float, lvef_percentage: float) -> Dict[str, Any]:
    """
    Rule-based database checker for hard contraindications (simulating Lexicomp/Micromedex).
    
    Args:
        proposed_drugs: List of chemotherapy/targeted agents proposed by Oncology Agent.
        active_medications: The patient's current daily prescriptions.
        egfr: The patient's renal function (mL/min).
        lvef_percentage: The patient's cardiac ejection fraction.
    """
    logger.info(f"Running safety cross-checks for proposed drugs: {proposed_drugs}")
    
    warnings = []
    is_safe = True
    
    # Normalize strings for easier matching
    drugs_lower = [d.lower() for d in proposed_drugs]
    meds_lower = [m.lower() for m in active_medications]
    
    # 1. Renal Toxicity Checks
    if any(drug in "cisplatin" for drug in drugs_lower):
        if egfr < 60:
            warnings.append(f"CRITICAL: Cisplatin is contraindicated for eGFR < 60 (Patient eGFR: {egfr}). Suggest switching to Carboplatin.")
            is_safe = False
            
    # 2. Cardiac Toxicity Checks
    if any(drug in ["trastuzumab", "doxorubicin", "epirubicin"] for drug in drugs_lower):
        if lvef_percentage < 50:
            warnings.append(f"CRITICAL: Cardiotoxic agents contraindicated for LVEF < 50% (Patient LVEF: {lvef_percentage}%). High risk of heart failure.")
            is_safe = False

    # 3. Drug-Drug Interactions (DDI)
    if "warfarin" in meds_lower and any(drug in "capecitabine" for drug in drugs_lower):
        warnings.append("WARNING: Capecitabine significantly increases Warfarin levels. Major bleed risk. Monitor INR closely or switch anticoagulant.")
        is_safe = False

    return {
        "is_safe": is_safe,
        "warnings": warnings,
        "checked_drugs": proposed_drugs
    }

# -------------------------------------------------------------------------
# 4. Server Execution
# -------------------------------------------------------------------------
if __name__ == "__main__":
    logger.info("Starting FastMCP Safety & Pharmacology Server on SSE transport (Port 8001)...")
    
    try:
        # Runs on port 8001 to avoid conflicting with the RAG server on 8000
        mcp.run(transport="sse", host="0.0.0.0", port=8001)
    except Exception as e:
        logger.error(f"Safety Server execution failed: {str(e)}")