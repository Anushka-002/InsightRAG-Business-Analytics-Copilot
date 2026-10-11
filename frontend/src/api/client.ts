import { 
  OverviewKPIs, 
  SynthesisResponse, 
  DatasetProfile, 
  DocumentMetadata, 
  HistoryEntry, 
  EvaluationReport, 
  AppSettings 
} from '../types';

const API_BASE = '/api';

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // Overview
  async getOverview(): Promise<{ kpis: OverviewKPIs; schema_summary: any }> {
    const res = await fetch(`${API_BASE}/overview`);
    if (!res.ok) throw new Error('Failed to load overview data');
    const json = await res.json();
    return json;
  },

  // Ask InsightRAG
  async askQuestion(question: string, tableName = 'sales_transactions'): Promise<SynthesisResponse> {
    const res = await fetch(`${API_BASE}/chat/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, table_name: tableName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to process question' }));
      throw new Error(err.detail || 'Failed to process question');
    }
    const json = await res.json();
    return json.data;
  },

  // Data Explorer
  async getDataProfile(tableName = 'sales_transactions'): Promise<DatasetProfile> {
    const res = await fetch(`${API_BASE}/data/profile?table_name=${tableName}`);
    if (!res.ok) throw new Error('Failed to load dataset profile');
    const json = await res.json();
    return json.profile;
  },

  async uploadCsv(file: File, tableName = 'sales_transactions') {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/data/upload?table_name=${tableName}`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload CSV dataset');
    return res.json();
  },

  async loadDemoDataset() {
    const res = await fetch(`${API_BASE}/data/load-demo`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to load demo dataset');
    return res.json();
  },

  // Documents
  async getDocuments(): Promise<{ total_documents: number; total_chunks: number; documents: DocumentMetadata[] }> {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error('Failed to load documents');
    return res.json();
  },

  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload document');
    return res.json();
  },

  async deleteDocument(filename: string) {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(filename)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  async searchPreview(query: string, top_k = 4, threshold = 0.10) {
    const res = await fetch(`${API_BASE}/documents/search-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k, threshold })
    });
    if (!res.ok) throw new Error('Search preview failed');
    return res.json();
  },

  async reindexDocuments(chunkSize: number, chunkOverlap: number) {
    const res = await fetch(`${API_BASE}/documents/reindex`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chunk_size: chunkSize, chunk_overlap: chunkOverlap })
    });
    if (!res.ok) throw new Error('Reindex failed');
    return res.json();
  },

  // History
  async getHistory(): Promise<HistoryEntry[]> {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) throw new Error('Failed to load query history');
    const json = await res.json();
    return json.history;
  },

  async clearHistory() {
    const res = await fetch(`${API_BASE}/history/clear`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to clear history');
    return res.json();
  },

  // Evaluation
  async runEvaluation(): Promise<EvaluationReport> {
    const res = await fetch(`${API_BASE}/eval/run`);
    if (!res.ok) throw new Error('Evaluation run failed');
    return res.json();
  },

  async getBenchmarkCases() {
    const res = await fetch(`${API_BASE}/eval/cases`);
    if (!res.ok) throw new Error('Failed to load benchmark cases');
    return res.json();
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    const json = await res.json();
    return json.settings;
  }
};
