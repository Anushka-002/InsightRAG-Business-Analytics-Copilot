from fastapi import APIRouter, HTTPException
from app.db.schema_inspector import compute_overview_kpis, inspect_schema

router = APIRouter(prefix="/api/overview", tags=["Overview"])

@router.get("")
def get_overview_metrics():
    try:
        kpis = compute_overview_kpis()
        schema = inspect_schema()
        return {
            "status": "success",
            "kpis": kpis,
            "schema_summary": {
                "table_name": schema["table_name"],
                "total_rows": schema["total_rows"],
                "column_count": len(schema["columns"])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute overview metrics: {str(e)}")
