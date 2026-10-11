export type ViewType = 
  | 'overview' 
  | 'chat' 
  | 'explorer' 
  | 'documents' 
  | 'history' 
  | 'evaluation' 
  | 'settings';

export interface OverviewKPIs {
  total_records: number;
  total_revenue: number | null;
  total_profit: number | null;
  gross_margin_pct: number | null;
  total_units_sold: number | null;
  date_range: { start: string; end: string } | null;
  data_quality_warnings: string[];
  revenue_by_quarter: Array<{
    quarter: string;
    revenue: number;
    profit: number | null;
    margin_pct: number | null;
  }>;
  revenue_by_category: Array<{
    category: string;
    revenue: number;
  }>;
  regional_breakdown: Array<{
    region: string;
    revenue: number;
  }>;
}

export interface Citation {
  source: string;
  page: number;
  chunk_id: string;
  quote_snippet: string;
}

export interface DocumentEvidence {
  doc_filename: string;
  page_number: number;
  chunk_id: string;
  similarity_score: number;
  content: string;
}

export interface SQLResultData {
  columns: string[];
  rows: Record<string, any>[];
  row_count: number;
  execution_time_ms: number;
}

export interface SynthesisResponse {
  question: string;
  intent: 'STRUCTURED_SQL' | 'UNSTRUCTURED_RAG' | 'COMBINED' | 'UNSUPPORTED';
  summary_answer: string;
  calculated_facts: string[];
  document_evidence: DocumentEvidence[];
  generated_sql: string | null;
  sql_results: SQLResultData | null;
  citations: Citation[];
  warnings: string[];
  suggested_chart: 'line' | 'bar' | 'pie' | 'table' | null;
  latency_ms: number;
}

export interface ColumnProfile {
  name: string;
  inferred_type: string;
  raw_dtype: string;
  missing_count: number;
  missing_pct: number;
  unique_count: number;
  stats: Record<string, any>;
}

export interface DatasetProfile {
  table_name: string;
  total_rows: number;
  total_columns: number;
  duplicate_rows: number;
  date_columns: string[];
  numeric_columns: string[];
  categorical_columns: string[];
  column_profiles: ColumnProfile[];
}

export interface DocumentMetadata {
  filename: string;
  filepath: string;
  file_type: string;
  total_pages: number;
  total_characters: number;
  chunks_count: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  question: string;
  intent: string;
  summary_answer: string;
  generated_sql: string | null;
  row_count: number;
  citations_count: number;
  latency_ms: number;
  warnings_count: number;
  status: string;
}

export interface BenchmarkCase {
  id: string;
  category: string;
  question: string;
  passed: boolean;
  intent_detected: string;
  latency_ms: number;
  notes: string[];
  summary_preview: string;
}

export interface EvaluationReport {
  status: string;
  sample_size: number;
  overall_pass_rate: number;
  metrics: {
    sql_execution_accuracy_pct: number;
    retrieval_recall_at_k_pct: number;
    citation_support_fidelity_pct: number;
    hallucination_rejection_accuracy_pct: number;
    average_latency_ms: number;
  };
  metric_definitions: Record<string, string>;
  cases: BenchmarkCase[];
}

export interface AppSettings {
  app_name: string;
  app_version: string;
  llm_provider: string;
  openai_api_key?: string;
  gemini_api_key?: string;
  is_demo_mode: boolean;
  has_openai_key: boolean;
  has_gemini_key: boolean;
  chunk_size: number;
  chunk_overlap: number;
  top_k: number;
  similarity_threshold: number;
  database_path: string;
  vector_index_path: string;
}
