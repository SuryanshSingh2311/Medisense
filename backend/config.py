from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    """
    Centralized configuration management for the Medisense Backend.
    Reads from environment variables or a local .env file.
    """
    
    
    
    # --- FastMCP Microservice Endpoints ---
    fastmcp_rag_server: str = "http://localhost:8000/mcp"
    fastmcp_safety_server: str = "http://localhost:8001/mcp"
    
    # --- LangGraph Checkpointer Database ---
    database_url: str = "sqlite:///./medisense_state.db"
    
    # --- FastAPI Server Settings ---
    api_host: str = "0.0.0.0"
    api_port: int = 5000
    
    # --- Security & CORS ---
    # Updated to point to your Vite React frontend port (5173)
    cors_origins: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"] 

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
    # Use the working model string you just verified
    model_id: str = "openrouter/free" 

    class Config:
        env_file = ".env"


settings = Settings()

import os
# This forces the token into the system environment where LangChain can see it
os.environ["HF_TOKEN"] = settings.hf_token