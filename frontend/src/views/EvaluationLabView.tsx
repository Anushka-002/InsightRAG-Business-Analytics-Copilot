import React, { useState } from 'react';
import { 
  FlaskConical, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Database, 
  FileText, 
  Info,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { EvaluationReport } from '../types';
import { api } from '../api/client';

export const EvaluationLabView: React.FC = () => {
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunEvaluation = async () => {
    try {
      setRunning(true);
      setError(null);
      const res = await api.runEvaluation();
      setReport(res);
    } catch (err: any) {
      setError(err.message || 'Evaluation run failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto overflow-y-auto">
      {/* Top Banner & Trigger */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <FlaskConical className="w-5 h-5 text-accent-blue" />
            <h2 className="text-base font-semibold text-content-main">Evaluation Lab & Benchmarking</h2>
          </div>
          <p className="text-xs text-content-muted mt-1 max-w-2xl">
            Execute automated quantitative evaluation benchmarks across SQL execution accuracy, Retrieval Recall@K, citation support, out-of-domain hallucination rejection, and latency.
          </p>
        </div>

        <div>
          <button
            onClick={handleRunEvaluation}
            disabled={running}
            className="px-4 py-2.5 rounded-lg bg-accent-blue hover:bg-blue-500 text-bg-main text-xs font-semibold flex items-center space-x-2 transition-colors shadow-sm disabled:opacity-50"
          >
            {running ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-bg-main border-t-transparent rounded-full animate-spin" />
                <span>Running Test Suite...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Evaluation Suite</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-status-error/10 border border-status-error/30 rounded-xl p-4 text-xs text-status-error flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* When evaluation hasn't been run yet */}
      {!report && !running && (
        <div className="bg-bg-card border border-border-subtle rounded-xl p-12 text-center space-y-3">
          <FlaskConical className="w-10 h-10 text-content-muted mx-auto opacity-40" />
          <h3 className="text-sm font-semibold text-content-main">Evaluation Benchmark Not Yet Run</h3>
          <p className="text-xs text-content-muted max-w-md mx-auto">
            Click "Run Evaluation Suite" above to execute the standardized test dataset against the active SQLite database and vector index.
          </p>
        </div>
      )}

      {/* Benchmark Report */}
      {report && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Overall Pass Rate */}
            <div className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-content-muted text-xs">
                <span>Overall Pass Rate</span>
                <CheckCircle2 className="w-4 h-4 text-status-success" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-status-success tabular-nums">
                  {report.overall_pass_rate}%
                </span>
              </div>
              <span className="text-[11px] text-content-muted mt-1 block">
                {report.sample_size} test scenarios
              </span>
            </div>

            {/* SQL Execution Accuracy */}
            <div className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-content-muted text-xs">
                <span>SQL Accuracy</span>
                <Database className="w-4 h-4 text-accent-blue" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-accent-blue tabular-nums">
                  {report.metrics.sql_execution_accuracy_pct}%
                </span>
              </div>
              <span className="text-[11px] text-content-muted mt-1 block">
                Deterministic queries
              </span>
            </div>

            {/* Retrieval Recall@K */}
            <div className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-content-muted text-xs">
                <span>Recall@K</span>
                <FileText className="w-4 h-4 text-accent-cyan" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-accent-cyan tabular-nums">
                  {report.metrics.retrieval_recall_at_k_pct}%
                </span>
              </div>
              <span className="text-[11px] text-content-muted mt-1 block">
                Vector document hits
              </span>
            </div>

            {/* Citation Support Fidelity */}
            <div className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-content-muted text-xs">
                <span>Citation Support</span>
                <ShieldCheck className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-purple-400 tabular-nums">
                  {report.metrics.citation_support_fidelity_pct}%
                </span>
              </div>
              <span className="text-[11px] text-content-muted mt-1 block">
                Passage attribution
              </span>
            </div>

            {/* Hallucination Rejection */}
            <div className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-content-muted text-xs">
                <span>Rejection Accuracy</span>
                <AlertTriangle className="w-4 h-4 text-status-warning" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-status-warning tabular-nums">
                  {report.metrics.hallucination_rejection_accuracy_pct}%
                </span>
              </div>
              <span className="text-[11px] text-content-muted mt-1 block">
                Out-of-scope refusal
              </span>
            </div>
          </div>

          {/* Metric Definitions & Methodology Info */}
          <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <Info className="w-4 h-4 text-accent-blue" />
              <h3 className="text-xs font-semibold text-content-main uppercase tracking-wider">
                Evaluation Methodology & Metric Definitions
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-content-muted">
              {Object.entries(report.metric_definitions).map(([key, def], idx) => (
                <div key={idx} className="p-3 rounded-lg bg-bg-elevated border border-border-subtle/50 space-y-1">
                  <span className="font-mono text-content-main font-medium block">{key}</span>
                  <p className="leading-relaxed">{def}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Benchmark Cases Table */}
          <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-content-main">Individual Test Case Breakdown</h3>
                <p className="text-xs text-content-muted">Granular execution verification across query categories</p>
              </div>
              <span className="text-xs text-content-muted font-mono">
                Avg Latency: {report.metrics.average_latency_ms} ms
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border-subtle">
              <table className="w-full text-xs text-left">
                <thead className="bg-bg-elevated text-content-muted font-medium border-b border-border-subtle">
                  <tr>
                    <th className="px-4 py-3">Case ID</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Question</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Latency</th>
                    <th className="px-4 py-3">Diagnostics & Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {report.cases.map((c) => (
                    <tr key={c.id} className="hover:bg-bg-elevated/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-content-main">{c.id}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-bg-elevated border border-border-subtle text-content-muted">
                          {c.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-content-main max-w-xs">{c.question}</td>
                      <td className="px-4 py-3">
                        {c.passed ? (
                          <span className="inline-flex items-center space-x-1 text-status-success font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Passed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-status-error font-medium">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-content-muted">{c.latency_ms} ms</td>
                      <td className="px-4 py-3 text-content-muted">
                        <ul className="list-disc pl-4 space-y-0.5">
                          {c.notes.map((n, nIdx) => (
                            <li key={nIdx}>{n}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
