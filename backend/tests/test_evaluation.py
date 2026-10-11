import pytest
from app.evaluation.benchmark import run_evaluation_suite

def test_evaluation_benchmark_execution():
    report = run_evaluation_suite()
    assert report["status"] == "completed"
    assert report["sample_size"] >= 8
    assert "metrics" in report
    
    metrics = report["metrics"]
    assert metrics["sql_execution_accuracy_pct"] >= 90.0
    assert metrics["retrieval_recall_at_k_pct"] >= 80.0
    assert metrics["hallucination_rejection_accuracy_pct"] == 100.0
    assert metrics["citation_support_fidelity_pct"] >= 80.0
    assert metrics["average_latency_ms"] > 0
    assert len(report["cases"]) == report["sample_size"]
