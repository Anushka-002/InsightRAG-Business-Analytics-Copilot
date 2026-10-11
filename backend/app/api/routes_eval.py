import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from app.evaluation.benchmark import run_evaluation_suite

router = APIRouter(prefix="/api/eval", tags=["Evaluation Lab"])

@router.get("/run")
def execute_evaluation():
    try:
        report = run_evaluation_suite()
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@router.get("/cases")
def get_benchmark_cases():
    cases_path = Path(__file__).resolve().parent.parent / "evaluation" / "benchmark_cases.json"
    if not cases_path.exists():
        raise HTTPException(status_code=404, detail="Benchmark test cases file not found.")
    with open(cases_path, "r", encoding="utf-8") as f:
        cases = json.load(f)
    return {"status": "success", "total_cases": len(cases), "cases": cases}
