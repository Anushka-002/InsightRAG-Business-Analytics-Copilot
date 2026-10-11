import re
from enum import Enum
from typing import Dict, Any

class QuestionIntent(str, Enum):
    STRUCTURED_SQL = "STRUCTURED_SQL"
    UNSTRUCTURED_RAG = "UNSTRUCTURED_RAG"
    COMBINED = "COMBINED"
    UNSUPPORTED = "UNSUPPORTED"

def classify_question(question: str) -> Dict[str, Any]:
    """
    Intelligently classifies user questions into structured, document, combined, or unsupported categories.
    Does not assume every question requires both sources.
    """
    q_lower = question.lower().strip()

    # Unsupported indicators (unrelated corporate topics not in our data or reports)
    unsupported_keywords = [
        "stock option", "vesting", "cafeteria", "parking", "patent", "competitor balance sheet",
        "weather", "sports", "recipe", "password", "crypto", "bitcoin"
    ]
    if any(k in q_lower for k in unsupported_keywords):
        return {
            "intent": QuestionIntent.UNSUPPORTED,
            "reason": "The question requests information outside the loaded sales data and business reports.",
            "requires_sql": False,
            "requires_rag": False
        }

    # Combined indicators (explicitly requests comparing numbers/metrics with narrative reports/explanations)
    combined_indicators = [
        "compare the sales numbers with the explanations",
        "compare sales with report",
        "what evidence supports this",
        "does the uploaded documentation explain",
        "explain the observed",
        "why did sales decline and what do the numbers say",
        "combine", "reconcile", "explain why profitability dropped"
    ]
    if any(k in q_lower for k in combined_indicators):
        return {
            "intent": QuestionIntent.COMBINED,
            "reason": "Question requires both quantitative SQL computation and qualitative document evidence.",
            "requires_sql": True,
            "requires_rag": True
        }

    # Document-only indicators
    doc_indicators = [
        "what does the report say", "according to the report", "according to the quarterly report",
        "what does the quarterly report say", "policy", "discount authorization", "governance",
        "who approved", "tier 1", "tier 2", "tier 3", "tier 4", "memorandum", "cfo", "ceo", "board"
    ]
    if any(k in q_lower for k in doc_indicators):
        # Unless it specifically asks for raw summation of numbers
        if not any(k in q_lower for k in ["total revenue", "sum of", "average discount across all"]):
            return {
                "intent": QuestionIntent.UNSTRUCTURED_RAG,
                "reason": "Question targets qualitative statements, policies, or management discussions in reports.",
                "requires_sql": False,
                "requires_rag": True
            }

    # Structured SQL indicators
    sql_indicators = [
        "total revenue", "total profit", "margin", "how much", "how many", "which region",
        "which product", "lowest", "highest", "top 5", "rank", "units sold", "transactions",
        "by quarter", "monthly", "last quarter", "sales numbers", "average price"
    ]
    if any(k in q_lower for k in sql_indicators):
        return {
            "intent": QuestionIntent.STRUCTURED_SQL,
            "reason": "Question asks for deterministic quantitative metrics computable via SQL.",
            "requires_sql": True,
            "requires_rag": False
        }

    # Default fallback: check if documents have relevant hits or treat as general business query
    return {
        "intent": QuestionIntent.COMBINED,
        "reason": "Question may benefit from both structured data exploration and document search.",
        "requires_sql": True,
        "requires_rag": True
    }
