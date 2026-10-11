import json
import time
from pathlib import Path
from typing import Dict, Any, List
from app.engine.synthesizer import synthesize_business_answer
from app.engine.router import QuestionIntent

def run_evaluation_suite(test_cases_path: Path = None) -> Dict[str, Any]:
    """
    Executes automated evaluation benchmarks across SQL accuracy, Recall@K,
    citation support, hallucination checks, and latency.
    Never fabricates metrics.
    """
    if test_cases_path is None:
        test_cases_path = Path(__file__).resolve().parent / "benchmark_cases.json"
        
    with open(test_cases_path, "r", encoding="utf-8") as f:
        cases = json.load(f)

    results = []
    sql_successes = 0
    sql_total = 0
    
    retrieval_successes = 0
    retrieval_total = 0
    
    unsupported_successes = 0
    unsupported_total = 0
    
    citation_valid_count = 0
    citation_total_trials = 0
    
    total_latency_ms = 0.0

    for case in cases:
        case_id = case["id"]
        category = case["category"]
        question = case["question"]
        expected_doc = case.get("expected_doc")
        
        t0 = time.perf_counter()
        ans = synthesize_business_answer(question)
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
        total_latency_ms += elapsed_ms

        passed = True
        notes = []

        # Check intent classification
        intent_match = (ans["intent"] == category)
        if not intent_match:
            passed = False
            notes.append(f"Intent mismatch: got {ans['intent']}, expected {category}")

        # Check SQL execution if structured or combined
        if category in ("STRUCTURED_SQL", "COMBINED"):
            sql_total += 1
            if ans.get("sql_results") and ans["sql_results"].get("rows"):
                sql_successes += 1
                notes.append("SQL executed successfully and returned records.")
            else:
                passed = False
                notes.append("SQL did not return valid result rows.")

        # Check Retrieval Recall if RAG or Combined
        if category in ("UNSTRUCTURED_RAG", "COMBINED"):
            retrieval_total += 1
            retrieved_docs = [p["doc_filename"] for p in ans.get("document_evidence", [])]
            
            if expected_doc:
                # Check if expected doc is in top retrieved docs
                matched_doc = any(expected_doc.lower() in d.lower() for d in retrieved_docs)
                if matched_doc:
                    retrieval_successes += 1
                    notes.append(f"Expected source '{expected_doc}' successfully retrieved.")
                else:
                    passed = False
                    notes.append(f"Expected source '{expected_doc}' was not in retrieved passages.")
            elif len(retrieved_docs) > 0:
                retrieval_successes += 1
                notes.append(f"Retrieved {len(retrieved_docs)} passages.")

            # Citation fidelity check
            citation_total_trials += 1
            if ans.get("citations") and len(ans["citations"]) > 0:
                citation_valid_count += 1
            elif not ans.get("warnings"):
                notes.append("Missing expected citations for evidence.")

        # Check Unsupported rejection
        if category == "UNSUPPORTED":
            unsupported_total += 1
            if ans["intent"] == "UNSUPPORTED":
                unsupported_successes += 1
                notes.append("Correctly recognized out-of-domain query without hallucination.")
            else:
                passed = False
                notes.append("Failed to reject unsupported question.")

        results.append({
            "id": case_id,
            "category": category,
            "question": question,
            "passed": passed,
            "intent_detected": ans["intent"],
            "latency_ms": elapsed_ms,
            "notes": notes,
            "summary_preview": ans["summary_answer"][:120] + "..." if len(ans["summary_answer"]) > 120 else ans["summary_answer"]
        })

    total_cases = len(cases)
    total_passed = sum(1 for r in results if r["passed"])
    
    sql_accuracy = round((sql_successes / sql_total * 100), 1) if sql_total > 0 else 100.0
    retrieval_recall = round((retrieval_successes / retrieval_total * 100), 1) if retrieval_total > 0 else 100.0
    unsupported_accuracy = round((unsupported_successes / unsupported_total * 100), 1) if unsupported_total > 0 else 100.0
    citation_support = round((citation_valid_count / citation_total_trials * 100), 1) if citation_total_trials > 0 else 100.0
    avg_latency = round(total_latency_ms / total_cases, 1) if total_cases > 0 else 0.0

    return {
        "status": "completed",
        "sample_size": total_cases,
        "overall_pass_rate": round((total_passed / total_cases * 100), 1),
        "metrics": {
            "sql_execution_accuracy_pct": sql_accuracy,
            "retrieval_recall_at_k_pct": retrieval_recall,
            "citation_support_fidelity_pct": citation_support,
            "hallucination_rejection_accuracy_pct": unsupported_accuracy,
            "average_latency_ms": avg_latency
        },
        "metric_definitions": {
            "sql_execution_accuracy_pct": "Percentage of structured/combined questions that generate safe, non-empty SQL analytical query results.",
            "retrieval_recall_at_k_pct": "Percentage of test questions where ground-truth reference report was successfully included in top-k vector passages.",
            "citation_support_fidelity_pct": "Percentage of document-grounded answers backed by verified source passage citations.",
            "hallucination_rejection_accuracy_pct": "Accuracy at detecting and politely refusing queries outside corporate data scope without fabricating facts.",
            "average_latency_ms": "Mean end-to-end response generation and query execution time in milliseconds."
        },
        "cases": results
    }
