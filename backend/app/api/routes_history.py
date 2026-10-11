from fastapi import APIRouter
from app.db.history import history_manager

router = APIRouter(prefix="/api/history", tags=["History"])

@router.get("")
def get_query_history():
    entries = history_manager.get_entries()
    return {
        "status": "success",
        "count": len(entries),
        "history": entries
    }

@router.post("/clear")
def clear_query_history():
    history_manager.clear()
    return {
        "status": "success",
        "message": "Query history cleared."
    }
