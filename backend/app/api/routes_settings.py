from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.config import settings

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class UpdateSettingsRequest(BaseModel):
    llm_provider: Optional[str] = None
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    top_k: Optional[int] = None
    similarity_threshold: Optional[float] = None

@router.get("")
def get_current_settings():
    return {
        "status": "success",
        "app_name": settings.APP_NAME,
        "app_version": settings.APP_VERSION,
        "llm_provider": settings.LLM_PROVIDER,
        "is_demo_mode": (settings.LLM_PROVIDER == "demo" or not bool(settings.OPENAI_API_KEY or settings.GEMINI_API_KEY)),
        "has_openai_key": bool(settings.OPENAI_API_KEY),
        "has_gemini_key": bool(settings.GEMINI_API_KEY),
        "chunk_size": settings.CHUNK_SIZE,
        "chunk_overlap": settings.CHUNK_OVERLAP,
        "top_k": settings.TOP_K,
        "similarity_threshold": settings.SIMILARITY_THRESHOLD,
        "database_path": str(settings.DATABASE_PATH),
        "vector_index_path": str(settings.VECTOR_INDEX_PATH)
    }

@router.post("")
def update_settings(req: UpdateSettingsRequest):
    if req.llm_provider is not None:
        settings.LLM_PROVIDER = req.llm_provider
    if req.openai_api_key is not None:
        settings.OPENAI_API_KEY = req.openai_api_key
    if req.gemini_api_key is not None:
        settings.GEMINI_API_KEY = req.gemini_api_key
    if req.chunk_size is not None:
        settings.CHUNK_SIZE = req.chunk_size
    if req.chunk_overlap is not None:
        settings.CHUNK_OVERLAP = req.chunk_overlap
    if req.top_k is not None:
        settings.TOP_K = req.top_k
    if req.similarity_threshold is not None:
        settings.SIMILARITY_THRESHOLD = req.similarity_threshold

    return {
        "status": "success",
        "message": "Settings updated successfully.",
        "settings": get_current_settings()
    }
