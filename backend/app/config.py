import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = ConfigDict(extra="ignore")

    APP_NAME: str = "InsightRAG — Business Analytics Copilot"
    APP_VERSION: str = "1.0.0"
    
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    REPORTS_DIR: Path = DATA_DIR / "sample_reports"
    STORAGE_DIR: Path = BASE_DIR / "storage"
    
    # Database
    DATABASE_PATH: Path = STORAGE_DIR / "insightrag.db"
    
    # Vector store
    VECTOR_INDEX_PATH: Path = STORAGE_DIR / "vector_index.json"
    
    # RAG Settings
    CHUNK_SIZE: int = 600
    CHUNK_OVERLAP: int = 100
    TOP_K: int = 4
    SIMILARITY_THRESHOLD: float = 0.10
    
    # LLM Settings
    # Supports: "demo", "openai", "gemini", "anthropic"
    LLM_PROVIDER: str = "demo"
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # SQL Execution limits
    SQL_ROW_LIMIT: int = 500
    SQL_TIMEOUT_SECONDS: float = 5.0

settings = Settings()

# Ensure storage directories exist
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
