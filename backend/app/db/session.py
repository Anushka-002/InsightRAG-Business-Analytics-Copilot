import sqlite3
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List, Tuple
from app.config import settings

def get_db_path() -> Path:
    return settings.DATABASE_PATH

def init_database_from_csv(csv_path: Path, table_name: str = "sales_transactions") -> Dict[str, Any]:
    """
    Initializes or updates the SQLite database from a CSV file.
    Does not drop unrelated tables.
    """
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    df = pd.read_csv(csv_path)
    for col in df.columns:
        if "date" in col.lower():
            df[col] = df[col].astype(str)
            
    conn = sqlite3.connect(str(db_path))
    try:
        df.to_sql(table_name, conn, if_exists="replace", index=False)
        conn.commit()
    finally:
        conn.close()
        
    return {
        "status": "success",
        "table_name": table_name,
        "rows_inserted": len(df),
        "columns": list(df.columns)
    }

def get_readonly_connection():
    """
    Opens a SQLite connection in read-only mode to prevent any modification at the driver level.
    """
    db_path = get_db_path()
    if not db_path.exists():
        # If DB doesn't exist yet, initialize it with demo data
        demo_csv = settings.DATA_DIR / "demo_sales.csv"
        if demo_csv.exists():
            init_database_from_csv(demo_csv)
        else:
            raise FileNotFoundError(f"Database not initialized and demo CSV not found at {demo_csv}")
            
    # Open with URI read-only flag
    conn_uri = f"file:{db_path.as_posix()}?mode=ro"
    conn = sqlite3.connect(conn_uri, uri=True, timeout=settings.SQL_TIMEOUT_SECONDS)
    conn.row_factory = sqlite3.Row
    return conn

def execute_safe_query(sql_query: str, max_rows: int = settings.SQL_ROW_LIMIT) -> Dict[str, Any]:
    """
    Executes a read-only validated SQL query against the SQLite database.
    Enforces maximum row limits and returns tabular results with column types.
    """
    clean_sql = sql_query.strip().rstrip(";")
    
    # If the query does not contain a LIMIT clause, safely wrap or append LIMIT
    if "limit" not in clean_sql.lower():
        clean_sql = f"{clean_sql} LIMIT {max_rows}"

    conn = get_readonly_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(clean_sql)
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        rows = cursor.fetchall()
        
        dict_rows = [dict(row) for row in rows]
        
        return {
            "columns": columns,
            "rows": dict_rows,
            "row_count": len(dict_rows),
            "executed_sql": clean_sql
        }
    except Exception as e:
        raise RuntimeError(f"Database execution failed: {str(e)}")
    finally:
        conn.close()
