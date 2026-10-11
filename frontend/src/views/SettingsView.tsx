import React, { useEffect, useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  ShieldCheck, 
  Key, 
  Sliders, 
  Database, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { AppSettings } from '../types';
import { api } from '../api/client';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [provider, setProvider] = useState('demo');
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [chunkSize, setChunkSize] = useState(600);
  const [chunkOverlap, setChunkOverlap] = useState(100);
  const [topK, setTopK] = useState(4);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.10);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSettings();
      setSettings(data);
      setProvider(data.llm_provider);
      setChunkSize(data.chunk_size);
      setChunkOverlap(data.chunk_overlap);
      setTopK(data.top_k);
      setSimilarityThreshold(data.similarity_threshold);
    } catch (err: any) {
      setError(err.message || 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setStatusMsg(null);
      setError(null);
      const updated = await api.updateSettings({
        llm_provider: provider,
        openai_api_key: openaiKey || undefined,
        gemini_api_key: geminiKey || undefined,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
        top_k: topK,
        similarity_threshold: similarityThreshold
      });
      setSettings(updated);
      setStatusMsg('Configuration saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-10 h-10 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-content-muted text-sm">Loading system settings...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto overflow-y-auto">
      <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <SettingsIcon className="w-5 h-5 text-accent-blue" />
          <h2 className="text-base font-semibold text-content-main">System & Model Configuration</h2>
        </div>
        <p className="text-xs text-content-muted mt-1">
          InsightRAG operates in offline deterministic demo mode by default, and optionally connects to live API keys.
        </p>
      </div>

      {statusMsg && (
        <div className="bg-status-success/10 border border-status-success/30 rounded-xl p-4 text-xs text-status-success flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-status-error/10 border border-status-error/30 rounded-xl p-4 text-xs text-status-error flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Model Provider Choice */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-accent-blue" />
            <h3 className="text-sm font-semibold text-content-main">Synthesis & LLM Provider</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: 'demo', label: 'Deterministic Demo', sub: 'Zero-cost, offline, AST verified rules' },
              { id: 'openai', label: 'OpenAI (GPT-4o mini)', sub: 'OpenAI API key required' },
              { id: 'gemini', label: 'Google Gemini', sub: 'Google Gemini API key required' },
            ].map((p) => (
              <label
                key={p.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                  provider === p.id 
                    ? 'bg-bg-elevated border-accent-blue text-content-main shadow-sm' 
                    : 'bg-bg-main border-border-subtle text-content-muted hover:border-border-subtle/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{p.label}</span>
                  <input
                    type="radio"
                    name="provider"
                    value={p.id}
                    checked={provider === p.id}
                    onChange={(e) => setProvider(e.target.value)}
                    className="accent-accent-blue"
                  />
                </div>
                <span className="text-[11px] text-content-muted mt-2 block">{p.sub}</span>
              </label>
            ))}
          </div>

          {/* Conditional API Keys */}
          {provider === 'openai' && (
            <div className="pt-2">
              <label className="text-xs text-content-muted block mb-1.5 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5 text-accent-blue" />
                <span>OpenAI API Key:</span>
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs text-content-main focus:outline-none focus:border-accent-blue font-mono"
              />
            </div>
          )}

          {provider === 'gemini' && (
            <div className="pt-2">
              <label className="text-xs text-content-muted block mb-1.5 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5 text-accent-cyan" />
                <span>Google Gemini API Key:</span>
              </label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs text-content-main focus:outline-none focus:border-accent-cyan font-mono"
              />
            </div>
          )}
        </div>

        {/* Vector Retrieval Parameters */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-accent-cyan" />
            <h3 className="text-sm font-semibold text-content-main">Vector Retrieval Hyperparameters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-content-muted block mb-1">Top-K Passages: {topK}</label>
              <input
                type="range"
                min="1"
                max="8"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-full accent-accent-cyan"
              />
            </div>

            <div>
              <label className="text-content-muted block mb-1">Similarity Threshold: {similarityThreshold}</label>
              <input
                type="range"
                min="0.01"
                max="0.50"
                step="0.01"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                className="w-full accent-accent-cyan"
              />
            </div>
          </div>
        </div>

        {/* Storage Paths Info */}
        {settings && (
          <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm space-y-2 text-xs">
            <div className="flex items-center space-x-2 mb-2">
              <Database className="w-4 h-4 text-content-muted" />
              <h3 className="font-semibold text-content-main">Storage Locations</h3>
            </div>
            <div className="p-3 bg-bg-elevated rounded-lg space-y-1 font-mono text-[11px] text-content-muted">
              <p><span className="text-content-main">Database:</span> {settings.database_path}</p>
              <p><span className="text-content-main">Vector Index:</span> {settings.vector_index_path}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-accent-blue hover:bg-blue-500 text-bg-main text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
