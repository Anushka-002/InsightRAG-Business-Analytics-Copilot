import re
import sqlparse
from sqlparse.sql import Statement, Token, TokenList
from sqlparse.tokens import DML, DDL, Keyword, Punctuation
from typing import Tuple, List, Optional

PROHIBITED_COMMANDS = {
    "insert", "update", "delete", "drop", "create", "alter", "truncate",
    "replace", "attach", "detach", "vacuum", "reindex", "pragma",
    "grant", "revoke", "commit", "rollback", "savepoint", "exec", "execute"
}

ALLOWED_STATEMENTS = {"SELECT"}

PROHIBITED_FUNCTIONS = {
    "load_extension", "writefile", "readfile", "edit"
}

class SQLSecurityError(Exception):
    pass

def validate_sql_safety(query: str, allowed_tables: Optional[List[str]] = None) -> Tuple[bool, str]:
    """
    Validates that a SQL statement is strictly read-only and free of SQL injection or dangerous operations.
    Uses AST token parsing (via sqlparse) rather than a naive regex.
    
    Returns (is_valid, error_or_cleaned_sql)
    """
    if not query or not query.strip():
        return False, "Query cannot be empty."

    # Parse using sqlparse AST
    parsed = sqlparse.parse(query)
    
    # 1. Disallow multiple statements
    non_empty_stmts = [s for s in parsed if str(s).strip().rstrip(";")]
    if len(non_empty_stmts) == 0:
        return False, "No valid SQL statement found."
    if len(non_empty_stmts) > 1:
        return False, "Multiple SQL statements are strictly prohibited for security."

    statement = non_empty_stmts[0]
    
    # 2. Check statement type
    stmt_type = statement.get_type()
    if stmt_type not in ALLOWED_STATEMENTS and not stmt_type.startswith("SELECT") and stmt_type != "UNKNOWN":
        return False, f"Prohibited statement type: '{stmt_type}'. Only SELECT queries are permitted."

    # 3. Check for CTE (WITH ... SELECT) or SELECT
    flattened_tokens = list(statement.flatten())
    
    first_keyword = None
    for token in flattened_tokens:
        if token.is_whitespace or token.ttype in (Punctuation,):
            continue
        first_keyword = token.value.upper()
        break
        
    if first_keyword not in ("SELECT", "WITH"):
        return False, f"Query must begin with SELECT or WITH (Common Table Expression). Found: '{first_keyword}'"

    # 4. Deep token inspection for prohibited keywords, DDL, DML
    raw_query_lower = query.lower()
    for token in flattened_tokens:
        val_lower = token.value.lower().strip()
        
        # Check against prohibited DDL/DML
        if val_lower in PROHIBITED_COMMANDS:
            return False, f"Prohibited SQL keyword detected: '{val_lower}'."
            
        # Check against dangerous SQLite internal functions
        for func in PROHIBITED_FUNCTIONS:
            if func in val_lower:
                return False, f"Prohibited function call: '{func}'."

        # Check token types
        if token.ttype in DDL:
            return False, f"DDL command detected: '{token.value}'."
        if token.ttype in DML and val_lower not in ("select",):
            return False, f"Disallowed DML command detected: '{token.value}'."

    # 5. Check for dangerous SQLite attachments or path traversal
    if "attach" in raw_query_lower or "sqlite_master" in raw_query_lower or "sqlite_schema" in raw_query_lower:
        # Check if querying sqlite_master directly
        if "sqlite_master" in raw_query_lower or "sqlite_schema" in raw_query_lower:
            return False, "Direct queries on SQLite internal catalog tables are restricted."

    # Query passed AST verification
    cleaned_sql = str(statement).strip().rstrip(";")
    return True, cleaned_sql

def sanitize_and_prepare_sql(query: str, max_rows: int = 500) -> str:
    """
    Validates and ensures query has a safe LIMIT clause.
    Raises SQLSecurityError if unsafe.
    """
    is_valid, result = validate_sql_safety(query)
    if not is_valid:
        raise SQLSecurityError(result)
        
    cleaned = result
    if "limit" not in cleaned.lower():
        cleaned = f"{cleaned} LIMIT {max_rows}"
        
    return cleaned
