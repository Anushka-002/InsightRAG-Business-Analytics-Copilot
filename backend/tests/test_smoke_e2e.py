import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_e2e_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["database_ready"] is True

def test_e2e_overview_metrics(client):
    res = client.get("/api/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["kpis"]["total_revenue"] > 0
    assert len(data["kpis"]["revenue_by_quarter"]) == 4

def test_e2e_data_profile(client):
    res = client.get("/api/data/profile")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["profile"]["total_rows"] > 500

def test_e2e_documents_listing(client):
    res = client.get("/api/documents")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["total_documents"] > 0

def test_e2e_structured_question(client):
    res = client.post("/api/chat/ask", json={"question": "What was our total revenue?"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["intent"] == "STRUCTURED_SQL"
    assert data["generated_sql"] is not None
    assert len(data["calculated_facts"]) > 0

def test_e2e_document_question(client):
    res = client.post("/api/chat/ask", json={"question": "What does the quarterly report say about the decline in profitability?"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["intent"] == "UNSTRUCTURED_RAG"
    assert len(data["citations"]) > 0

def test_e2e_combined_question(client):
    res = client.post("/api/chat/ask", json={"question": "Which regions experienced declining sales, and what evidence supports this observation?"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["intent"] == "COMBINED"
    assert data["generated_sql"] is not None
    assert len(data["citations"]) > 0

def test_e2e_unsupported_question(client):
    res = client.post("/api/chat/ask", json={"question": "What is the employee stock option vesting policy?"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["intent"] == "UNSUPPORTED"
    assert "cannot be answered" in data["summary_answer"]
