import pytest
from app.sql.safety import validate_sql_safety, sanitize_and_prepare_sql, SQLSecurityError

def test_safe_select_query():
    valid, res = validate_sql_safety("SELECT order_id, revenue FROM sales_transactions WHERE region = 'North';")
    assert valid is True
    assert "SELECT" in res

def test_safe_cte_query():
    valid, res = validate_sql_safety("""
        WITH regional_summary AS (
            SELECT region, SUM(revenue) as total_rev FROM sales_transactions GROUP BY region
        )
        SELECT * FROM regional_summary ORDER BY total_rev DESC;
    """)
    assert valid is True
    assert "WITH" in res

def test_reject_drop_table():
    valid, err = validate_sql_safety("DROP TABLE sales_transactions;")
    assert valid is False
    assert "Prohibited" in err or "SELECT" in err

def test_reject_delete_statement():
    valid, err = validate_sql_safety("DELETE FROM sales_transactions WHERE revenue < 1000;")
    assert valid is False
    assert "Prohibited" in err or "SELECT" in err

def test_reject_insert_statement():
    valid, err = validate_sql_safety("INSERT INTO sales_transactions VALUES ('1', '2024-01-01');")
    assert valid is False

def test_reject_update_statement():
    valid, err = validate_sql_safety("UPDATE sales_transactions SET revenue = 9999;")
    assert valid is False

def test_reject_multiple_chained_statements():
    valid, err = validate_sql_safety("SELECT * FROM sales_transactions; DROP TABLE users;")
    assert valid is False
    assert "Multiple SQL statements" in err

def test_reject_sqlite_internal_catalog():
    valid, err = validate_sql_safety("SELECT * FROM sqlite_master;")
    assert valid is False
    assert "restricted" in err

def test_sanitize_and_prepare_adds_limit():
    sanitized = sanitize_and_prepare_sql("SELECT order_id FROM sales_transactions", max_rows=100)
    assert "LIMIT 100" in sanitized

def test_sanitize_unsafe_raises_exception():
    with pytest.raises(SQLSecurityError):
        sanitize_and_prepare_sql("DROP TABLE test;")
