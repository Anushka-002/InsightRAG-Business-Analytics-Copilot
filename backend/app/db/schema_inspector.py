import sqlite3
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from app.db.session import get_readonly_connection, get_db_path
from app.config import settings

def get_tables() -> List[str]:
    conn = get_readonly_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = [row["name"] for row in cursor.fetchall()]
        return tables
    finally:
        conn.close()

def inspect_schema(table_name: str = "sales_transactions") -> Dict[str, Any]:
    conn = get_readonly_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns_info = cursor.fetchall()
        
        columns = []
        for col in columns_info:
            columns.append({
                "cid": col["cid"],
                "name": col["name"],
                "type": col["type"],
                "notnull": bool(col["notnull"]),
                "dflt_value": col["dflt_value"],
                "pk": bool(col["pk"])
            })
            
        cursor.execute(f"SELECT COUNT(*) as count FROM {table_name}")
        total_rows = cursor.fetchone()["count"]
        
        return {
            "table_name": table_name,
            "total_rows": total_rows,
            "columns": columns
        }
    finally:
        conn.close()

def profile_dataset(table_name: str = "sales_transactions") -> Dict[str, Any]:
    """
    Computes rigorous profiling metrics:
    - Row and column counts
    - Missing values and percentages
    - Duplicate rows
    - Inferred data types (numeric, date, categorical, text)
    - Descriptive statistics (mean, median, std, min, max, quartiles)
    - Categorical frequency distributions
    """
    conn = get_readonly_connection()
    try:
        df = pd.read_sql_query(f"SELECT * FROM {table_name}", conn)
    finally:
        conn.close()

    total_rows = len(df)
    total_cols = len(df.columns)
    duplicate_rows = int(df.duplicated().sum())

    column_profiles = []
    date_columns = []
    numeric_columns = []
    categorical_columns = []

    for col in df.columns:
        series = df[col]
        missing_count = int(series.isnull().sum())
        missing_pct = round((missing_count / total_rows * 100), 2) if total_rows > 0 else 0.0
        unique_count = int(series.nunique())

        col_type = "string"
        stats: Dict[str, Any] = {}

        # Check date
        is_date = False
        if "date" in col.lower() or "time" in col.lower():
            clean_dates = [str(x) for x in series.dropna() if str(x).strip()]
            if clean_dates:
                col_type = "date"
                date_columns.append(col)
                is_date = True
                stats = {
                    "min_date": min(clean_dates),
                    "max_date": max(clean_dates)
                }

        # Check numeric
        if not is_date and pd.api.types.is_numeric_dtype(series):
            col_type = "numeric"
            numeric_columns.append(col)
            valid_num = series.dropna()
            if len(valid_num) > 0:
                stats = {
                    "mean": round(float(valid_num.mean()), 2),
                    "std": round(float(valid_num.std()), 2) if len(valid_num) > 1 else 0.0,
                    "min": round(float(valid_num.min()), 2),
                    "q25": round(float(valid_num.quantile(0.25)), 2),
                    "median": round(float(valid_num.median()), 2),
                    "q75": round(float(valid_num.quantile(0.75)), 2),
                    "max": round(float(valid_num.max()), 2),
                    "sum": round(float(valid_num.sum()), 2)
                }

        # Check categorical / string
        if col_type == "string":
            if unique_count <= 25 or unique_count < total_rows * 0.1:
                col_type = "categorical"
                categorical_columns.append(col)
                top_counts = series.value_counts().head(5).to_dict()
                stats = {
                    "top_categories": {str(k): int(v) for k, v in top_counts.items()}
                }
            else:
                top_samples = [str(x) for x in series.dropna().unique()[:3]]
                stats = {"sample_values": top_samples}

        column_profiles.append({
            "name": col,
            "inferred_type": col_type,
            "raw_dtype": str(series.dtype),
            "missing_count": missing_count,
            "missing_pct": missing_pct,
            "unique_count": unique_count,
            "stats": stats
        })

    return {
        "table_name": table_name,
        "total_rows": total_rows,
        "total_columns": total_cols,
        "duplicate_rows": duplicate_rows,
        "date_columns": date_columns,
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
        "column_profiles": column_profiles
    }

def compute_overview_kpis(table_name: str = "sales_transactions") -> Dict[str, Any]:
    """
    Computes verified business KPIs strictly from the underlying dataset.
    Never invents uncalculable metrics. Explains missing metrics honestly.
    """
    conn = get_readonly_connection()
    try:
        df = pd.read_sql_query(f"SELECT * FROM {table_name}", conn)
    finally:
        conn.close()

    total_records = len(df)
    cols = {c.lower(): c for c in df.columns}
    
    kpis = {
        "total_records": total_records,
        "total_revenue": None,
        "total_profit": None,
        "gross_margin_pct": None,
        "total_units_sold": None,
        "date_range": None,
        "data_quality_warnings": [],
        "revenue_by_quarter": [],
        "revenue_by_category": [],
        "margin_by_quarter": [],
        "regional_breakdown": []
    }

    # Revenue
    if "revenue" in cols:
        rev_col = cols["revenue"]
        total_rev = float(df[rev_col].sum())
        kpis["total_revenue"] = round(total_rev, 2)
    else:
        kpis["data_quality_warnings"].append("Revenue field not present in dataset; cannot calculate total revenue.")

    # Profit & Gross Margin
    if "profit" in cols:
        prof_col = cols["profit"]
        total_prof = float(df[prof_col].sum())
        kpis["total_profit"] = round(total_prof, 2)
        if kpis["total_revenue"] and kpis["total_revenue"] > 0:
            kpis["gross_margin_pct"] = round((total_prof / kpis["total_revenue"]) * 100, 2)
    else:
        kpis["data_quality_warnings"].append("Profit field not present in dataset; cannot calculate net profit or margins.")

    # Units sold
    if "units_sold" in cols:
        kpis["total_units_sold"] = int(df[cols["units_sold"]].sum())

    # Date range
    date_col = next((cols[c] for c in cols if "date" in c), None)
    if date_col:
        valid_dates = [str(x) for x in df[date_col].dropna() if str(x).strip()]
        if valid_dates:
            kpis["date_range"] = {
                "start": min(valid_dates),
                "end": max(valid_dates)
            }

    # Aggregations for verified visual charts
    # Revenue & Margin by Quarter
    q_col = next((cols[c] for c in cols if "quarter" in c), None)
    if q_col and "revenue" in cols:
        rev_col = cols["revenue"]
        prof_col = cols.get("profit")
        
        q_grouped = df.groupby(q_col)
        q_rev = q_grouped[rev_col].sum()
        
        q_order = ["Q1", "Q2", "Q3", "Q4"]
        for q in q_order:
            if q in q_rev.index:
                r_val = round(float(q_rev[q]), 2)
                p_val = round(float(q_grouped[prof_col].sum()[q]), 2) if prof_col else None
                margin = round((p_val / r_val * 100), 2) if (p_val is not None and r_val > 0) else None
                kpis["revenue_by_quarter"].append({
                    "quarter": q,
                    "revenue": r_val,
                    "profit": p_val,
                    "margin_pct": margin
                })

    # Revenue by Product Category
    cat_col = next((cols[c] for c in cols if "category" in c or "product" in c), None)
    if cat_col and "revenue" in cols:
        rev_col = cols["revenue"]
        cat_agg = df.groupby(cat_col)[rev_col].sum().sort_values(ascending=False).head(6)
        kpis["revenue_by_category"] = [
            {"category": str(cat), "revenue": round(float(val), 2)}
            for cat, val in cat_agg.items()
        ]

    # Regional breakdown
    reg_col = next((cols[c] for c in cols if "region" in c), None)
    if reg_col and "revenue" in cols:
        rev_col = cols["revenue"]
        reg_agg = df.groupby(reg_col)[rev_col].sum().sort_values(ascending=False)
        kpis["regional_breakdown"] = [
            {"region": str(reg), "revenue": round(float(val), 2)}
            for reg, val in reg_agg.items()
        ]

    return kpis

def get_schema_for_llm(table_name: str = "sales_transactions") -> str:
    """
    Returns a schema summary string for LLM prompting.
    """
    schema = inspect_schema(table_name)
    col_lines = []
    for c in schema["columns"]:
        col_lines.append(f"  - {c['name']} ({c['type']})")
    
    schema_str = f"Table: {table_name} (Total rows: {schema['total_rows']})\nColumns:\n" + "\n".join(col_lines)
    return schema_str
