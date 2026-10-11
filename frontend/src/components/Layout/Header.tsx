import React from 'react';
import { Database, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { ViewType } from '../../types';

interface HeaderProps {
  currentView: ViewType;
  dbStatus: boolean;
  totalDocs: number;
  onResetDemo: () => void;
  isLoadingDemo: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentView, 
  dbStatus, 
  totalDocs, 
  onResetDemo, 
  isLoadingDemo 
}) => {
  const viewTitles: Record<ViewType, { title: string; subtitle: string }> = {
    overview: { title: 'Executive Overview', subtitle: 'Computed business health metrics & revenue trends' },
    chat: { title: 'Ask InsightRAG Copilot', subtitle: 'Evidence-grounded SQL analytics and document synthesis' },
    explorer: { title: 'Data Explorer', subtitle: 'Relational schema inspection, distributions & profiling' },
    documents: { title: 'Documents & Knowledge', subtitle: 'Manage corporate reports, chunking & vector indexing' },
    history: { title: 'Query History', subtitle: 'Verifiable execution audit log & citation inspector' },
    evaluation: { title: 'Evaluation Lab', subtitle: 'Quantitative benchmarks for SQL correctness, Recall@K & citations' },
    settings: { title: 'System Settings', subtitle: 'LLM providers, similarity thresholds & RAG hyper-parameters' },
  };

  const { title, subtitle } = viewTitles[currentView] || { title: 'InsightRAG', subtitle: '' };

  return (
    <header className="h-16 bg-bg-main border-b border-border-subtle px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-base font-semibold text-content-main leading-tight">{title}</h1>
        <p className="text-xs text-content-muted">{subtitle}</p>
      </div>

      <div className="flex items-center space-x-3">
        {/* Reset Demo Quick Action */}
        <button
          onClick={onResetDemo}
          disabled={isLoadingDemo}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-bg-card border border-border-subtle text-xs text-content-muted hover:text-content-main hover:border-accent-blue transition-colors disabled:opacity-50"
          title="Reload the clean demo sales dataset into SQLite"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDemo ? 'animate-spin text-accent-blue' : ''}`} />
          <span>Reset Demo Data</span>
        </button>

        {/* Database Status Badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-bg-card border border-border-subtle text-xs">
          <Database className="w-3.5 h-3.5 text-accent-blue" />
          <span className="text-content-muted">DB:</span>
          <span className="text-content-main font-medium">sales_transactions</span>
          {dbStatus ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-status-success/10 text-status-success border border-status-success/20">
              Read-Only
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-status-error/10 text-status-error border border-status-error/20">
              Offline
            </span>
          )}
        </div>

        {/* Vector Knowledge Base Badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-bg-card border border-border-subtle text-xs">
          <FileText className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="text-content-muted">Reports:</span>
          <span className="text-content-main font-medium">{totalDocs} Indexed</span>
        </div>
      </div>
    </header>
  );
};
