import pytest
from app.engine.router import classify_question, QuestionIntent
from app.engine.synthesizer import synthesize_business_answer

def test_intent_classification():
    c_sql = classify_question("What was our total revenue last quarter?")
    assert c_sql["intent"] == QuestionIntent.STRUCTURED_SQL

    c_rag = classify_question("What does the quarterly report say about the decline in profitability?")
    assert c_rag["intent"] == QuestionIntent.UNSTRUCTURED_RAG

    c_comb = classify_question("Compare the sales numbers with the explanations provided in the report.")
    assert c_comb["intent"] == QuestionIntent.COMBINED

    c_unsup = classify_question("What is the employee stock option vesting policy for engineers?")
    assert c_unsup["intent"] == QuestionIntent.UNSUPPORTED

def test_unsupported_question_rejection():
    ans = synthesize_business_answer("What is the company stock option vesting policy?")
    assert ans["intent"] == "UNSUPPORTED"
    assert "cannot be answered" in ans["summary_answer"]
    assert len(ans["citations"]) == 0
    assert ans["generated_sql"] is None

def test_structured_question_answer():
    ans = synthesize_business_answer("What was our total revenue?")
    assert ans["intent"] == "STRUCTURED_SQL"
    assert ans["generated_sql"] is not None
    assert "SELECT" in ans["generated_sql"]
    assert ans["sql_results"]["row_count"] > 0
    assert "$" in ans["summary_answer"]

def test_rag_question_answer():
    ans = synthesize_business_answer("What does the quarterly report say about the decline in profitability?")
    assert ans["intent"] == "UNSTRUCTURED_RAG"
    assert len(ans["document_evidence"]) > 0
    assert len(ans["citations"]) > 0
    # Verifies citation contains valid source document
    assert any("Q2" in c["source"] for c in ans["citations"])

def test_combined_question_answer():
    ans = synthesize_business_answer("Which regions experienced declining sales, and what evidence supports this observation?")
    assert ans["intent"] == "COMBINED"
    assert ans["generated_sql"] is not None
    assert ans["sql_results"] is not None
    assert len(ans["citations"]) > 0
