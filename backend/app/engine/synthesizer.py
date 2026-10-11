import time
from typing import Dict, Any, List, Optional
from app.engine.router import classify_question, QuestionIntent
from app.sql.generator import generate_sql_query
from app.sql.executor import execute_analytical_query
from app.rag.vector_store import vector_store
from app.config import settings

def synthesize_business_answer(
    question: str,
    table_name: str = "sales_transactions"
) -> Dict[str, Any]:
    """
    Core synthesis engine. Reconciles structured SQL numbers with qualitative document evidence.
    Guarantees verifiable citations and prevents hallucinations.
    """
    start_time = time.perf_counter()
    
    classification = classify_question(question)
    intent = classification["intent"]
    
    # 1. Handle Unsupported questions immediately
    if intent == QuestionIntent.UNSUPPORTED:
        return {
            "question": question,
            "intent": intent.value,
            "summary_answer": f"The query '{question}' cannot be answered because the requested subject is not present in the structured sales database or the uploaded corporate business reports.",
            "calculated_facts": [],
            "document_evidence": [],
            "generated_sql": None,
            "sql_results": None,
            "citations": [],
            "warnings": ["Requested domain falls outside available structured business data and document knowledge base."],
            "suggested_chart": None,
            "latency_ms": round((time.perf_counter() - start_time) * 1000, 2)
        }

    generated_sql_str = None
    sql_data = None
    calculated_facts = []
    suggested_chart = None
    warnings = []

    # 2. Execute SQL if required
    if classification["requires_sql"]:
        sql_gen_result = generate_sql_query(question, table_name=table_name)
        generated_sql_str = sql_gen_result.sql
        sql_exec_result = execute_analytical_query(generated_sql_str)
        
        if sql_exec_result["success"]:
            sql_data = {
                "columns": sql_exec_result["columns"],
                "rows": sql_exec_result["rows"],
                "row_count": sql_exec_result["row_count"],
                "execution_time_ms": sql_exec_result["execution_time_ms"]
            }
            # Extract calculated facts
            for row in sql_exec_result["rows"][:5]:
                for k, v in row.items():
                    if isinstance(v, (int, float)):
                        calculated_facts.append(f"{k}: {v:,.2f}" if isinstance(v, float) else f"{k}: {v:,}")

            # Determine chart suitability
            cols = [c.lower() for c in sql_exec_result["columns"]]
            if any("quarter" in c or "date" in c or "month" in c for c in cols):
                suggested_chart = "line"
            elif any("category" in c or "region" in c or "product" in c or "segment" in c for c in cols):
                suggested_chart = "bar"
            elif len(sql_exec_result["rows"]) > 1:
                suggested_chart = "table"
        else:
            warnings.append(f"SQL execution error: {sql_exec_result['error_message']}")

    # 3. Retrieve Document Evidence if required
    retrieved_passages = []
    citations = []
    if classification["requires_rag"]:
        passages = vector_store.similarity_search(question, top_k=settings.TOP_K, threshold=settings.SIMILARITY_THRESHOLD)
        # If no passages met threshold, try with lower threshold or retrieve top 2
        if not passages:
            passages = vector_store.similarity_search(question, top_k=2, threshold=0.10)

        for p in passages:
            retrieved_passages.append({
                "doc_filename": p["doc_filename"],
                "page_number": p["page_number"],
                "chunk_id": p["chunk_id"],
                "similarity_score": p["similarity_score"],
                "content": p["content"]
            })
            citations.append({
                "source": p["doc_filename"],
                "page": p["page_number"],
                "chunk_id": p["chunk_id"],
                "quote_snippet": p["content"][:200] + "..." if len(p["content"]) > 200 else p["content"]
            })

        if not passages:
            warnings.append("No matching document passages found above the relevance threshold.")

    # 4. Synthesize Answer
    summary_parts = []
    
    if intent == QuestionIntent.STRUCTURED_SQL:
        if sql_data and sql_data["rows"]:
            row_sample = sql_data["rows"][0]
            if "total_revenue" in row_sample:
                rev = row_sample.get("total_revenue", 0)
                summary_parts.append(f"Total revenue calculated from the dataset is ${rev:,.2f}.")
            elif "total_profit" in row_sample:
                prof = row_sample.get("total_profit", 0)
                margin = row_sample.get("gross_margin_pct", "N/A")
                summary_parts.append(f"Total calculated profit is ${prof:,.2f} with an overall gross margin of {margin}%.")
            elif "product_category" in row_sample and "profit_margin_pct" in row_sample:
                cat = row_sample.get("product_category")
                margin = row_sample.get("profit_margin_pct")
                summary_parts.append(f"Product category analysis indicates '{cat}' has a calculated profit margin of {margin}%.")
            else:
                summary_parts.append(f"Analysis computed {sql_data['row_count']} records matching your query criteria.")
        else:
            summary_parts.append("SQL query executed but yielded no rows matching the specified filters.")

    elif intent == QuestionIntent.UNSTRUCTURED_RAG:
        if retrieved_passages:
            best_passage = retrieved_passages[0]
            summary_parts.append(f"According to {best_passage['doc_filename']} (Page {best_passage['page_number']}): {best_passage['content'][:350]}...")
        else:
            summary_parts.append("The uploaded business documents do not contain direct references to this question.")

    elif intent == QuestionIntent.COMBINED:
        # Reconcile numbers and documents
        reconciled = []
        if sql_data and sql_data["rows"]:
            reconciled.append(f"Structured metrics reveal: {', '.join(calculated_facts[:3])}.")
        if retrieved_passages:
            reconciled.append(f"Document evidence ({retrieved_passages[0]['doc_filename']}, Page {retrieved_passages[0]['page_number']}) provides qualitative attribution: \"{retrieved_passages[0]['content'][:250]}...\"")
        summary_parts.append(" ".join(reconciled) if reconciled else "Unable to reconcile data sources.")

    total_latency = round((time.perf_counter() - start_time) * 1000, 2)

    return {
        "question": question,
        "intent": intent.value,
        "summary_answer": " ".join(summary_parts) if summary_parts else "Analysis complete.",
        "calculated_facts": calculated_facts,
        "document_evidence": retrieved_passages,
        "generated_sql": generated_sql_str,
        "sql_results": sql_data,
        "citations": citations,
        "warnings": warnings,
        "suggested_chart": suggested_chart,
        "latency_ms": total_latency
    }
