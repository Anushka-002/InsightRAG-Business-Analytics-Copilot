import pytest
from pathlib import Path
from app.db.session import init_database_from_csv
from app.db.schema_inspector import inspect_schema, profile_dataset, compute_overview_kpis
from app.config import settings

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    demo_csv = settings.DATA_DIR / "demo_sales.csv"
    assert demo_csv.exists()
    init_database_from_csv(demo_csv, table_name="sales_transactions")

def test_inspect_schema():
    schema = inspect_schema("sales_transactions")
    assert schema["table_name"] == "sales_transactions"
    assert schema["total_rows"] > 500
    col_names = [c["name"] for c in schema["columns"]]
    assert "revenue" in col_names
    assert "profit" in col_names
    assert "order_date" in col_names
    assert "region" in col_names

def test_profile_dataset():
    profile = profile_dataset("sales_transactions")
    assert profile["total_rows"] > 500
    assert profile["total_columns"] >= 10
    assert "order_date" in profile["date_columns"]
    assert "revenue" in profile["numeric_columns"]
    assert "profit" in profile["numeric_columns"]
    
    # Check stats presence for numeric columns
    rev_profile = next(c for c in profile["column_profiles"] if c["name"] == "revenue")
    assert rev_profile["stats"]["min"] > 0
    assert rev_profile["stats"]["sum"] > 10000

def test_compute_overview_kpis():
    kpis = compute_overview_kpis("sales_transactions")
    assert kpis["total_revenue"] is not None
    assert kpis["total_revenue"] > 100000
    assert kpis["total_profit"] is not None
    assert kpis["gross_margin_pct"] is not None
    assert len(kpis["revenue_by_quarter"]) == 4
    assert len(kpis["regional_breakdown"]) > 0
    assert kpis["date_range"]["start"].startswith("2024")
