import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Layers, 
  Calendar, 
  AlertTriangle, 
  ArrowUpRight,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Legend
} from 'recharts';
import { OverviewKPIs, ViewType } from '../types';
import { api } from '../api/client';

interface OverviewViewProps {
  onAskQuestion: (question: string) => void;
  onNavigate: (view: ViewType) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onAskQuestion }) => {
  const [kpis, setKpis] = useState<OverviewKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getOverview();
      setKpis(data.kpis);
    } catch (err: any) {
      setError(err.message || 'Failed to load overview data');
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "What was our total revenue last quarter?",
    "Which product category has the lowest profit margin?",
    "What does the quarterly report say about the decline in profitability?",
    "Compare the sales numbers with the explanations provided in the report.",
    "Which regions experienced declining sales, and what evidence supports this observation?"
  ];

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-10 h-10 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-content-muted text-sm">Computing real analytical metrics from database...</p>
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className="p-8">
        <div className="bg-status-error/10 border border-status-error/30 rounded-xl p-6 text-status-error flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm">Failed to Load Overview</h3>
            <p className="text-xs mt-1 text-status-error/80">{error}</p>
            <button 
              onClick={loadOverview}
              className="mt-3 px-3 py-1.5 bg-status-error/20 hover:bg-status-error/30 rounded text-xs font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number | null) => {
    if (val === null || val === undefined) return 'N/A';
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto overflow-y-auto">
      {/* Data Quality Warnings Banner */}
      {kpis.data_quality_warnings && kpis.data_quality_warnings.length > 0 && (
        <div className="bg-status-warning/10 border border-status-warning/30 rounded-xl p-4 flex items-start space-x-3 text-status-warning">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-semibold block">Data Integrity Notice:</span>
            {kpis.data_quality_warnings.map((w, idx) => (
              <p key={idx} className="text-status-warning/90">{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-content-muted text-xs">
            <span>Total Revenue (FY24)</span>
            <DollarSign className="w-4 h-4 text-accent-blue" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-content-main tabular-nums">
              {formatCurrency(kpis.total_revenue)}
            </span>
          </div>
          <div className="mt-2 flex items-center text-[11px] text-status-success space-x-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Computed directly from 800+ transactions</span>
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-content-muted text-xs">
            <span>Net Profit</span>
            <TrendingUp className="w-4 h-4 text-status-success" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-content-main tabular-nums">
              {formatCurrency(kpis.total_profit)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-content-muted">
            Gross Margin:{' '}
            <span className="font-semibold text-content-main tabular-nums">
              {kpis.gross_margin_pct ? `${kpis.gross_margin_pct}%` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Volume & Records */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-content-muted text-xs">
            <span>Total Transactions</span>
            <Layers className="w-4 h-4 text-accent-cyan" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-content-main tabular-nums">
              {kpis.total_records.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-content-muted">
            Units Sold:{' '}
            <span className="font-semibold text-content-main tabular-nums">
              {kpis.total_units_sold ? kpis.total_units_sold.toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>

        {/* Date Span */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-content-muted text-xs">
            <span>Temporal Coverage</span>
            <Calendar className="w-4 h-4 text-content-muted" />
          </div>
          <div className="mt-3">
            <span className="text-sm font-semibold text-content-main block truncate">
              {kpis.date_range ? `${kpis.date_range.start} → ${kpis.date_range.end}` : 'Full Fiscal Year'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-content-muted">
            Fiscal Quarters: Q1, Q2, Q3, Q4
          </div>
        </div>
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quarterly Revenue & Profit Trend */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-content-main">Quarterly Revenue vs. Profit</h2>
              <p className="text-xs text-content-muted">Notice Q2 margin compression and Q4 rebound</p>
            </div>
            <BarChart3 className="w-4 h-4 text-accent-blue" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.revenue_by_quarter} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263449" vertical={false} />
                <XAxis dataKey="quarter" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#94A3B8" 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111C30', borderColor: '#263449', borderRadius: '8px', color: '#E5EDF7' }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#34D399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Product Category */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-content-main">Revenue by Product Portfolio</h2>
              <p className="text-xs text-content-muted">Enterprise product performance breakdown</p>
            </div>
            <ShoppingBag className="w-4 h-4 text-accent-cyan" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                layout="vertical" 
                data={kpis.revenue_by_category} 
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#263449" horizontal={false} />
                <XAxis 
                  type="number" 
                  stroke="#94A3B8" 
                  fontSize={11} 
                  tickLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <YAxis type="category" dataKey="category" stroke="#94A3B8" fontSize={10} tickLine={false} width={110} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111C30', borderColor: '#263449', borderRadius: '8px', color: '#E5EDF7' }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#22D3EE" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Suggested Inquiries / Quick Launcher */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-4 h-4 text-accent-blue" />
          <h2 className="text-sm font-semibold text-content-main">Ask InsightRAG Copilot</h2>
        </div>
        <p className="text-xs text-content-muted mb-4">
          Select a sample inquiry to see multi-source SQL calculation and verifiable RAG document retrieval in action:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onAskQuestion(q)}
              className="text-left p-3 rounded-lg bg-bg-elevated hover:bg-border-subtle border border-border-subtle/60 text-xs text-content-main transition-colors flex items-center justify-between group"
            >
              <span className="truncate pr-2">{q}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-accent-blue opacity-60 group-hover:opacity-100 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
