import time
from typing import Dict, Any
from app.sql.safety import sanitize_and_prepare_sql, SQLSecurityError
from app.db.session import execute_safe_query

def execute_analytical_query(query: str, max_rows: int = 500) -> Dict[str, Any]:
    """
    Validates, sanitizes, and executes a user or model generated SQL query.
    Measures execution time and returns formatted analytical data.
    """
    start_time = time.perf_counter()
    
    # 1. AST-based safety validation
    try:
        sanitized_sql = sanitize_and_prepare_sql(query, max_rows=max_rows)
    except SQLSecurityError as e:
        return {
            "success": False,
            "error_type": "SecurityViolation",
            "error_message": str(e),
            "executed_sql": query,
            "execution_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
            "columns": [],
            "rows": [],
            "row_count": 0
        }

    # 2. Execution against read-only database
    try:
        result = execute_safe_query(sanitized_sql, max_rows=max_rows)
        execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        
        return {
            "success": True,
            "executed_sql": result["executed_sql"],
            "columns": result["columns"],
            "rows": result["rows"],
            "row_count": result["row_count"],
            "execution_time_ms": execution_time_ms,
            "error_type": None,
            "error_message": None
        }
    except Exception as e:
        return {
            "success": False,
            "error_type": "ExecutionError",
            "error_message": str(e),
            "executed_sql": sanitized_sql,
            "execution_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
            "columns": [],
            "rows": [],
            "row_count": 0
        }
