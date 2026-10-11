import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  Trash2, 
  Database, 
  FileText, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';
import { HistoryEntry } from '../types';
import { api } from '../api/client';

interface HistoryViewProps {
  onReplayQuestion: (question: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onReplayQuestion }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterIntent, setFilterIntent] = useState<string>('ALL');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear all query history?')) return;
    await api.clearHistory();
    setHistory([]);
  };

  const filteredHistory = filterIntent === 'ALL' 
    ? history 
    : history.filter(h => h.intent === filterIntent);

  const getIntentBadge = (intent: string) => {
    switch (intent) {
      case 'STRUCTURED_SQL':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-accent-blue/15 text-accent-blue border border-accent-blue/20">
            <Database className="w-2.5 h-2.5" />
            <span>SQL</span>
          </span>
        );
      case 'UNSTRUCTURED_RAG':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20">
            <FileText className="w-2.5 h-2.5" />
            <span>RAG</span>
          </span>
        );
      case 'COMBINED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/20">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Combined</span>
          </span>
        );
      case 'UNSUPPORTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-status-warning/15 text-status-warning border border-status-warning/20">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>Out-of-Scope</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-10 h-10 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-content-muted text-sm">Loading historical analyses...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Top Bar with Filter & Clear */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-3">
          <Clock className="w-4 h-4 text-accent-blue" />
          <div>
            <h2 className="text-sm font-semibold text-content-main">Audit Log & Query History</h2>
            <p className="text-xs text-content-muted">{history.length} logged queries</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Intent Filter */}
          <div className="flex items-center space-x-1 bg-bg-elevated p-1 rounded-lg border border-border-subtle text-xs">
            {['ALL', 'STRUCTURED_SQL', 'UNSTRUCTURED_RAG', 'COMBINED', 'UNSUPPORTED'].map((intKey) => (
              <button
                key={intKey}
                onClick={() => setFilterIntent(intKey)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  filterIntent === intKey 
                    ? 'bg-accent-blue text-bg-main' 
                    : 'text-content-muted hover:text-content-main'
                }`}
              >
                {intKey === 'ALL' ? 'All' : intKey.replace('STRUCTURED_', '').replace('UNSTRUCTURED_', '')}
              </button>
            ))}
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-status-error/10 text-xs text-content-muted hover:text-status-error border border-border-subtle transition-colors flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* History Items List */}
      {filteredHistory.length === 0 ? (
        <div className="bg-bg-card border border-border-subtle rounded-xl p-12 text-center text-content-muted space-y-2">
          <Clock className="w-8 h-8 mx-auto opacity-40" />
          <p className="text-sm">No analysis history found matching the filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-bg-card border border-border-subtle rounded-xl p-5 hover:border-border-subtle/80 transition-all shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {getIntentBadge(item.intent)}
                    <span className="text-[11px] text-content-muted font-mono">{item.timestamp}</span>
                    <span className="text-[11px] text-accent-cyan font-mono">{item.latency_ms} ms</span>
                  </div>
                  <h3 className="text-sm font-semibold text-content-main">{item.question}</h3>
                </div>

                <button
                  onClick={() => onReplayQuestion(item.question)}
                  className="px-2.5 py-1 rounded bg-bg-elevated hover:bg-border-subtle text-xs text-accent-blue font-medium flex items-center space-x-1 transition-colors shrink-0"
                >
                  <span>Re-run Analysis</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              {/* Answer snippet */}
              <p className="text-xs text-content-muted line-clamp-2 leading-relaxed bg-bg-elevated/40 p-3 rounded-lg border border-border-subtle/40">
                {item.summary_answer}
              </p>

              {/* Meta stats */}
              <div className="flex items-center space-x-4 text-[11px] text-content-muted pt-1">
                {item.generated_sql && (
                  <span className="font-mono text-accent-blue">SQL: {item.row_count} rows</span>
                )}
                {item.citations_count > 0 && (
                  <span className="text-status-success font-medium">{item.citations_count} citations</span>
                )}
                {item.warnings_count > 0 && (
                  <span className="text-status-warning font-medium">{item.warnings_count} caveats</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
