import shutil
from pathlib import Path
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional
from app.rag.vector_store import vector_store
from app.config import settings

router = APIRouter(prefix="/api/documents", tags=["Documents"])

class SearchPreviewRequest(BaseModel):
    query: str
    top_k: Optional[int] = 4
    threshold: Optional[float] = 0.20

class ReindexRequest(BaseModel):
    chunk_size: int = 600
    chunk_overlap: int = 100

@router.get("")
def list_documents():
    docs = vector_store.get_all_documents()
    return {
        "status": "success",
        "total_documents": len(docs),
        "total_chunks": len(vector_store.chunks),
        "documents": docs
    }

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    ext = Path(file.filename).suffix.lower()
    if ext not in (".pdf", ".txt", ".md"):
        raise HTTPException(status_code=400, detail="Only .pdf, .txt, and .md files are supported for document indexing.")

    dest_path = settings.REPORTS_DIR / file.filename
    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        num_chunks = vector_store.index_document(dest_path)
        return {
            "status": "success",
            "message": f"Successfully indexed '{file.filename}' into {num_chunks} vector passages.",
            "filename": file.filename,
            "chunks_count": num_chunks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@router.delete("/{filename}")
def delete_document(filename: str):
    success = vector_store.delete_document(filename)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found in vector index.")
    return {"status": "success", "message": f"Document '{filename}' removed from index."}

@router.post("/search-preview")
def preview_retrieval(req: SearchPreviewRequest):
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")
        
    passages = vector_store.similarity_search(req.query.strip(), top_k=req.top_k or 4, threshold=req.threshold or 0.15)
    return {
        "status": "success",
        "query": req.query,
        "count": len(passages),
        "passages": passages
    }

@router.post("/reindex")
def reindex_all_documents(req: ReindexRequest):
    try:
        vector_store.reindex_all(chunk_size=req.chunk_size, chunk_overlap=req.chunk_overlap)
        return {
            "status": "success",
            "message": f"Re-indexed all documents with chunk_size={req.chunk_size}, chunk_overlap={req.chunk_overlap}.",
            "total_chunks": len(vector_store.chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
