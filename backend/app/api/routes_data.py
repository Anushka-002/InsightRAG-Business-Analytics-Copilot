import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.db.schema_inspector import get_tables, inspect_schema, profile_dataset
from app.db.session import init_database_from_csv
from app.config import settings

router = APIRouter(prefix="/api/data", tags=["Data"])

@router.get("/tables")
def list_tables():
    try:
        tables = get_tables()
        return {"tables": tables}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile")
def get_data_profile(table_name: str = "sales_transactions"):
    try:
        profile = profile_dataset(table_name)
        return {"status": "success", "profile": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profiling failed: {str(e)}")

@router.post("/upload")
async def upload_csv_dataset(file: UploadFile = File(...), table_name: str = "sales_transactions"):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported for tabular structured data.")

    dest_path = settings.DATA_DIR / file.filename
    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = init_database_from_csv(dest_path, table_name=table_name)
        return {
            "status": "success",
            "message": f"Successfully ingested {file.filename} into table '{table_name}'.",
            "details": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest CSV: {str(e)}")

@router.post("/load-demo")
def load_demo_dataset():
    try:
        demo_csv = settings.DATA_DIR / "demo_sales.csv"
        if not demo_csv.exists():
            raise FileNotFoundError("Demo dataset demo_sales.csv is missing from data directory.")
            
        result = init_database_from_csv(demo_csv, table_name="sales_transactions")
        return {
            "status": "success",
            "message": "Demo sales dataset successfully reloaded into database.",
            "details": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
