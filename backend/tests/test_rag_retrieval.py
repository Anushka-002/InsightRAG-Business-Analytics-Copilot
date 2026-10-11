import pytest
from pathlib import Path
from app.rag.extractor import extract_text_from_file
from app.rag.chunker import chunk_document
from app.rag.vector_store import vector_store
from app.config import settings

def test_extract_txt_file():
    txt_file = settings.REPORTS_DIR / "Q1_FY2024_Executive_Business_Review.txt"
    assert txt_file.exists()
    doc = extract_text_from_file(txt_file)
    assert doc.total_pages >= 1
    assert doc.total_characters > 200
    assert "CloudScale Prime" in doc.pages[0].text

def test_extract_pdf_file():
    pdf_file = settings.REPORTS_DIR / "Q1_FY2024_Executive_Business_Review.pdf"
    assert pdf_file.exists()
    doc = extract_text_from_file(pdf_file)
    assert doc.total_pages >= 1
    assert doc.file_type == "pdf"
    assert "Apex Enterprise" in doc.pages[0].text or "Cloud" in doc.pages[0].text

def test_chunking_metadata():
    txt_file = settings.REPORTS_DIR / "Corporate_Discount_and_Pricing_Policy.txt"
    doc = extract_text_from_file(txt_file)
    chunks = chunk_document(doc, chunk_size=400, chunk_overlap=50)
    assert len(chunks) >= 2
    for c in chunks:
        assert c.page_number >= 1
        assert c.doc_filename == "Corporate_Discount_and_Pricing_Policy.txt"
        assert len(c.content) > 30

def test_vector_search_relevance():
    # Ensure reports are indexed
    policy_txt = settings.REPORTS_DIR / "Corporate_Discount_and_Pricing_Policy.txt"
    vector_store.index_document(policy_txt)
    
    q2_txt = settings.REPORTS_DIR / "Q2_FY2024_Financial_Performance_and_Margin_Analysis.txt"
    vector_store.index_document(q2_txt)

    results = vector_store.similarity_search("discount authorization tiers approval", top_k=3, threshold=0.10)
    assert len(results) > 0
    assert any("Pricing_Policy" in r["doc_filename"] for r in results)

    results_q2 = vector_store.similarity_search("profitability margin decline mid-market", top_k=3, threshold=0.10)
    assert len(results_q2) > 0
    assert any("Q2" in r["doc_filename"] for r in results_q2)
