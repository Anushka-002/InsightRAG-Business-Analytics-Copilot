import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.session import init_database_from_csv, get_db_path
from app.rag.vector_store import vector_store
from app.api.routes_overview import router as overview_router
from app.api.routes_chat import router as chat_router
from app.api.routes_data import router as data_router
from app.api.routes_documents import router as documents_router
from app.api.routes_history import router as history_router
from app.api.routes_eval import router as eval_router
from app.api.routes_settings import router as settings_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence: initialize database and index if not present
    print(f"Starting {settings.APP_NAME}...")
    
    # 1. Database initialization
    db_path = get_db_path()
    demo_csv = settings.DATA_DIR / "demo_sales.csv"
    if not db_path.exists() and demo_csv.exists():
        print(f"Initializing database from {demo_csv}")
        init_database_from_csv(demo_csv)

    # 2. Vector Store initialization
    if len(vector_store.chunks) == 0:
        reports_dir = settings.REPORTS_DIR
        if reports_dir.exists():
            print(f"Indexing initial reports from {reports_dir}")
            for doc_file in reports_dir.iterdir():
                if doc_file.suffix.lower() in (".txt", ".pdf"):
                    try:
                        vector_store.index_document(doc_file)
                    except Exception as e:
                        print(f"Warning: could not index {doc_file.name}: {e}")

    yield
    print("Shutting down InsightRAG.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(overview_router)
app.include_router(chat_router)
app.include_router(data_router)
app.include_router(documents_router)
app.include_router(history_router)
app.include_router(eval_router)
app.include_router(settings_router)

@app.get("/api/health")
def health_check():
    db_ready = get_db_path().exists()
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database_ready": db_ready,
        "documents_indexed": len(vector_store.documents_metadata),
        "total_chunks": len(vector_store.chunks),
        "demo_mode": (settings.LLM_PROVIDER == "demo" or not bool(settings.OPENAI_API_KEY))
    }

# Mount static frontend build if available
frontend_dist = settings.BASE_DIR.parent / "frontend" / "dist"
if frontend_dist.exists():
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
