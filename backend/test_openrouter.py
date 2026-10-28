import os
from dotenv import load_dotenv
from langchain_openrouter import ChatOpenRouter
from pydantic import BaseModel, Field

load_dotenv()

class MedicalSample(BaseModel):
    diagnosis: str = Field(description="Primary clinical diagnosis")
    confidence_score: float = Field(description="Confidence score between 0.0 and 1.0")
    recommended_action: str = Field(description="Next step in clinical care")

def test_openrouter():
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("❌ ERROR: OPENROUTER_API_KEY is missing from your .env file.")
        return

    print("🔌 Connecting to OpenRouter Auto-Router...")
    
    try:
        # 'openrouter/free' automatically picks an available free model
        llm = ChatOpenRouter(
            model="openrouter/free",
            api_key=api_key,
            temperature=0.0
        )
        
        structured_llm = llm.with_structured_output(MedicalSample)
        
        sample_prompt = (
            "Patient presents with a 4.2cm right lower lobe lung mass. "
            "Biopsy confirms invasive adenocarcinoma."
        )
        
        print("🚀 Sending request...")
        result: MedicalSample = structured_llm.invoke(sample_prompt)
        
        print("\n✅ OpenRouter test SUCCESSFUL!")
        print("----------------------------------------")
        print(f"Diagnosis          : {result.diagnosis}")
        print(f"Confidence Score   : {result.confidence_score}")
        print(f"Recommended Action : {result.recommended_action}")
        print("----------------------------------------")
        
    except Exception as e:
        print(f"\n❌ OpenRouter test FAILED: {str(e)}")

if __name__ == "__main__":
    test_openrouter()