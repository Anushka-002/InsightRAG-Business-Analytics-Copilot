from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.engine.synthesizer import synthesize_business_answer
from app.db.history import history_manager

router = APIRouter(prefix="/api/chat", tags=["Chat"])

class QuestionRequest(BaseModel):
    question: str
    table_name: Optional[str] = "sales_transactions"

@router.post("/ask")
def ask_insightrag(req: QuestionRequest):
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        response = synthesize_business_answer(req.question.strip(), table_name=req.table_name)
        
        # Save to history
        history_entry = {
            "question": req.question.strip(),
            "intent": response["intent"],
            "summary_answer": response["summary_answer"],
            "generated_sql": response["generated_sql"],
            "row_count": response["sql_results"]["row_count"] if response["sql_results"] else 0,
            "citations_count": len(response["citations"]),
            "latency_ms": response["latency_ms"],
            "warnings_count": len(response["warnings"]),
            "status": "Success" if not response["warnings"] else "Partial"
        }
        history_manager.add_entry(history_entry)

        return {
            "status": "success",
            "data": response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Answer synthesis failed: {str(e)}")
