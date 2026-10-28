import math
import logging
from typing import Dict, Any, Union

logger = logging.getLogger("Medisense.Calculators")
logger.setLevel(logging.INFO)

# -------------------------------------------------------------------------
# 1. Body Surface Area (BSA) - Mosteller Formula
# -------------------------------------------------------------------------
def calculate_bsa(height_cm: float, weight_kg: float) -> float:
    """
    Calculates Body Surface Area (BSA) using the Mosteller formula.
    Used for chemotherapy dosing (mg/m2).
    
    Formula: sqrt((height_cm * weight_kg) / 3600)
    """
    if height_cm <= 0 or weight_kg <= 0:
        raise ValueError("Height and weight must be positive values.")
    
    bsa = math.sqrt((height_cm * weight_kg) / 3600)
    return round(bsa, 2)

# -------------------------------------------------------------------------
# 2. Creatinine Clearance (CrCl) - Cockcroft-Gault Formula
# -------------------------------------------------------------------------
def calculate_crcl(age: int, weight_kg: float, serum_creatinine: float, is_female: bool) -> float:
    """
    Calculates Creatinine Clearance (CrCl) using the Cockcroft-Gault equation.
    Crucial for assessing renal function for nephrotoxic drugs like Cisplatin.
    
    Formula: ((140 - age) * weight_kg) / (72 * serum_creatinine)
             Multiply by 0.85 if female.
    """
    if age <= 0 or weight_kg <= 0 or serum_creatinine <= 0:
        raise ValueError("Age, weight, and serum creatinine must be positive values.")
        
    crcl = ((140 - age) * weight_kg) / (72 * serum_creatinine)
    
    if is_female:
        crcl *= 0.85
        
    return round(crcl, 1)

# -------------------------------------------------------------------------
# 3. Estimated Glomerular Filtration Rate (eGFR) - CKD-EPI 2021 (Race-Free)
# -------------------------------------------------------------------------
def calculate_egfr_ckd_epi(age: int, serum_creatinine: float, is_female: bool) -> float:
    """
    Calculates eGFR using the 2021 CKD-EPI equation (race-independent).
    Used as the modern standard for renal staging.
    """
    kappa = 0.7 if is_female else 0.9
    alpha = -0.241 if is_female else -0.302
    
    scr_kappa = serum_creatinine / kappa
    min_scr = min(scr_kappa, 1)
    max_scr = max(scr_kappa, 1)
    
    egfr = 142 * (min_scr ** alpha) * (max_scr ** -1.200) * (0.9938 ** age)
    
    if is_female:
        egfr *= 1.012
        
    return round(egfr, 1)

# -------------------------------------------------------------------------
# 4. Carboplatin Dosing - Calvert Formula
# -------------------------------------------------------------------------
def calculate_carboplatin_dose(target_auc: float, crcl: float) -> float:
    """
    Calculates the total dose (in mg) for Carboplatin using the Calvert formula.
    
    Safety Guardrail: GFR (CrCl) is capped at 125 mL/min to prevent lethal toxicity 
    in patients with hyper-filtering kidneys.
    
    Formula: Target_AUC * (CrCl + 25)
    """
    if target_auc <= 0 or crcl <= 0:
        raise ValueError("AUC and CrCl must be positive.")
        
    # Strictly cap CrCl at 125 mL/min (FDA safety standard for Calvert formula)
    capped_crcl = min(crcl, 125.0)
    
    dose_mg = target_auc * (capped_crcl + 25)
    return round(dose_mg, 0)

# -------------------------------------------------------------------------
# 5. General Utility Wrapper
# -------------------------------------------------------------------------
def run_clinical_calculator(calculator_type: str, params: Dict[str, Any]) -> Union[float, Dict[str, str]]:
    """
    Wrapper function to execute the required calculator. 
    Useful if exposing these calculators via the FastAPI/FastMCP server.
    """
    try:
        if calculator_type == "bsa":
            return calculate_bsa(params["height_cm"], params["weight_kg"])
            
        elif calculator_type == "crcl":
            return calculate_crcl(params["age"], params["weight_kg"], params["serum_creatinine"], params["is_female"])
            
        elif calculator_type == "egfr":
            return calculate_egfr_ckd_epi(params["age"], params["serum_creatinine"], params["is_female"])
            
        elif calculator_type == "carboplatin_dose":
            crcl = calculate_crcl(params["age"], params["weight_kg"], params["serum_creatinine"], params["is_female"])
            return calculate_carboplatin_dose(params["target_auc"], crcl)
            
        else:
            return {"error": f"Unknown calculator type: {calculator_type}"}
            
    except KeyError as e:
        logger.error(f"Missing required parameter for {calculator_type}: {str(e)}")
        return {"error": f"Missing parameter: {str(e)}"}
    except Exception as e:
        logger.error(f"Calculation failed: {str(e)}")
        return {"error": str(e)}