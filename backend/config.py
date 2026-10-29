import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

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
    cors_origins: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"] 

    # --- OpenRouter Configuration ---
    openrouter_api_key: str = ""
    model_id: str = "openrouter/free"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

settings = Settings()