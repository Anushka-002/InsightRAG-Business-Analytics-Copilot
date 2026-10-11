import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Database, 
  FileText, 
  Code, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Table as TableIcon,
  BarChart2,
  Quote
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { SynthesisResponse } from '../types';
import { api } from '../api/client';

interface AskInsightRAGViewProps {
  initialQuestion?: string;
}

export const AskInsightRAGView: React.FC<AskInsightRAGViewProps> = ({ initialQuestion = '' }) => {
  const [question, setQuestion] = useState(initialQuestion);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SynthesisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Toggle drawers
  const [showSqlDrawer, setShowSqlDrawer] = useState(true);
  const [showPassagesDrawer, setShowPassagesDrawer] = useState(true);

  const sampleChips = [
    { label: "Total Revenue (SQL)", q: "What was our total revenue last quarter?" },
    { label: "Lowest Profit Margin (SQL)", q: "Which product category has the lowest profit margin?" },
    { label: "Margin Decline Causes (RAG)", q: "What does the quarterly report say about the decline in profitability?" },
    { label: "Compare Numbers & Explanations (Combined)", q: "Compare the sales numbers with the explanations provided in the report." },
    { label: "Regional Decline & Evidence (Combined)", q: "Which regions experienced declining sales, and what evidence supports this observation?" },
    { label: "Stock Option Policy (Unsupported)", q: "What is the employee stock option vesting policy for engineers?" }
  ];

  const handleAsk = async (qToAsk?: string) => {
    const activeQ = qToAsk || question;
    if (!activeQ || !activeQ.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.askQuestion(activeQ.trim());
      setResult(res);
      setQuestion(activeQ);
    } catch (err: any) {
      setError(err.message || 'An error occurred during query execution.');
    } finally {
      setLoading(false);
    }
  };

  const getIntentBadge = (intent: string) => {
    switch (intent) {
      case 'STRUCTURED_SQL':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
            <Database className="w-3 h-3" />
            <span>Structured SQL Analytics</span>
          </span>
        );
      case 'UNSTRUCTURED_RAG':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
            <FileText className="w-3 h-3" />
            <span>Document Retrieval (RAG)</span>
          </span>
        );
      case 'COMBINED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Sparkles className="w-3 h-3" />
            <span>Multi-Source Reconciled (SQL + RAG)</span>
          </span>
        );
      case 'UNSUPPORTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-status-warning/15 text-status-warning border border-status-warning/30">
            <AlertTriangle className="w-3 h-3" />
            <span>Out-of-Scope (Zero Hallucination)</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto overflow-y-auto">
      {/* Search Input Box */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-lg shadow-black/20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="space-y-4"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask an analytical or qualitative question (e.g. 'Compare sales numbers with report explanations')..."
              className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3.5 pr-28 text-sm text-content-main placeholder-content-muted focus:outline-none focus:border-accent-blue transition-colors shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="absolute right-2 px-4 py-2 bg-accent-blue hover:bg-blue-500 text-bg-main font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-bg-main border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>

          {/* Preset Prompts Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[11px] text-content-muted self-center mr-1">Suggested:</span>
            {sampleChips.map((chip, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => handleAsk(chip.q)}
                className="px-2.5 py-1 rounded-md bg-bg-elevated hover:bg-border-subtle border border-border-subtle text-[11px] text-content-muted hover:text-content-main transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-status-error/10 border border-status-error/30 rounded-xl p-4 text-status-error text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Response Display */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Metadata Pill */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-bg-card border border-border-subtle rounded-xl px-5 py-3">
            <div className="flex items-center space-x-3">
              <span className="text-xs text-content-muted">Intent:</span>
              {getIntentBadge(result.intent)}
            </div>
            <div className="flex items-center space-x-4 text-xs text-content-muted">
              <div className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="tabular-nums">{result.latency_ms} ms</span>
              </div>
              {result.sql_results && (
                <div className="flex items-center space-x-1 text-content-main">
                  <Database className="w-3.5 h-3.5 text-accent-blue" />
                  <span>{result.sql_results.row_count} rows calculated</span>
                </div>
              )}
              {result.citations.length > 0 && (
                <div className="flex items-center space-x-1 text-status-success">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{result.citations.length} Verified Citations</span>
                </div>
              )}
            </div>
          </div>

          {/* Warnings Banner if any */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="bg-status-warning/10 border border-status-warning/30 rounded-xl p-4 text-xs text-status-warning space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Evidence Qualification:</span>
              </div>
              {result.warnings.map((w, idx) => (
                <p key={idx} className="pl-5 text-status-warning/90">{w}</p>
              ))}
            </div>
          )}

          {/* Executive Summary Card */}
          <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-4 h-4 text-accent-blue" />
              <h2 className="text-sm font-semibold text-content-main">Executive Synthesis</h2>
            </div>
            <p className="text-sm leading-relaxed text-content-main whitespace-pre-line">
              {result.summary_answer}
            </p>

            {/* Calculated Facts Badges */}
            {result.calculated_facts && result.calculated_facts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border-subtle">
                <span className="text-[11px] font-semibold text-content-muted uppercase tracking-wider block mb-2">
                  Deterministic Calculated Facts:
                </span>
                <div className="flex flex-wrap gap-2">
                  {result.calculated_facts.map((fact, idx) => (
                    <span 
                      key={idx} 
                      className="px-2.5 py-1 rounded bg-bg-elevated border border-border-subtle text-xs font-mono text-accent-cyan tabular-nums"
                    >
                      {fact}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Structured SQL Results Section (if applicable) */}
          {result.generated_sql && result.sql_results && (
            <div className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setShowSqlDrawer(!showSqlDrawer)}
                className="w-full px-6 py-4 flex items-center justify-between bg-bg-card hover:bg-bg-elevated transition-colors border-b border-border-subtle text-left"
              >
                <div className="flex items-center space-x-2">
                  <Code className="w-4 h-4 text-accent-blue" />
                  <span className="text-sm font-semibold text-content-main">Generated SQL & Tabular Execution</span>
                  <span className="text-[11px] text-content-muted">({result.sql_results.row_count} rows)</span>
                </div>
                {showSqlDrawer ? <ChevronUp className="w-4 h-4 text-content-muted" /> : <ChevronDown className="w-4 h-4 text-content-muted text-content-muted" />}
              </button>

              {showSqlDrawer && (
                <div className="p-6 space-y-5">
                  {/* SQL Code Block */}
                  <div>
                    <span className="text-[11px] text-content-muted uppercase tracking-wider font-medium block mb-1.5">
                      Executed Query (Read-Only Mode):
                    </span>
                    <pre className="p-4 rounded-lg bg-bg-elevated border border-border-subtle text-xs font-mono text-accent-blue overflow-x-auto leading-relaxed">
                      {result.generated_sql}
                    </pre>
                  </div>

                  {/* Chart Rendering if Suggested */}
                  {result.suggested_chart && result.sql_results.rows.length > 1 && (
                    <div className="p-4 rounded-lg bg-bg-elevated border border-border-subtle">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <BarChart2 className="w-4 h-4 text-accent-cyan" />
                          <span className="text-xs font-medium text-content-main">Visualized Query Output</span>
                        </div>
                      </div>
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={result.sql_results.rows}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#263449" vertical={false} />
                            <XAxis 
                              dataKey={result.sql_results.columns[0]} 
                              stroke="#94A3B8" 
                              fontSize={11} 
                              tickLine={false} 
                            />
                            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#111C30', borderColor: '#263449', borderRadius: '8px', color: '#E5EDF7' }} 
                            />
                            <Bar 
                              dataKey={result.sql_results.columns[1]} 
                              fill="#60A5FA" 
                              radius={[4, 4, 0, 0]} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Data Table */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <TableIcon className="w-3.5 h-3.5 text-content-muted" />
                      <span className="text-[11px] text-content-muted uppercase tracking-wider font-medium">Result Set</span>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-border-subtle max-h-60">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-bg-elevated text-content-muted font-medium border-b border-border-subtle sticky top-0">
                          <tr>
                            {result.sql_results.columns.map((col, idx) => (
                              <th key={idx} className="px-3 py-2.5">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {result.sql_results.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-bg-elevated/50 transition-colors">
                              {result.sql_results!.columns.map((col, cIdx) => (
                                <td key={cIdx} className="px-3 py-2 text-content-main tabular-nums">
                                  {typeof row[col] === 'number' 
                                    ? row[col].toLocaleString() 
                                    : String(row[col] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Verified Document Citations Section (if applicable) */}
          {result.citations && result.citations.length > 0 && (
            <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <Quote className="w-4 h-4 text-status-success" />
                <h3 className="text-sm font-semibold text-content-main">Verified Evidence & Citations</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.citations.map((cite, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-lg bg-bg-elevated border border-border-subtle space-y-2 hover:border-status-success/40 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-content-main truncate pr-2">{cite.source}</span>
                      <span className="px-1.5 py-0.5 rounded bg-status-success/10 text-status-success text-[10px] font-medium shrink-0">
                        Page {cite.page}
                      </span>
                    </div>
                    <p className="text-xs text-content-muted italic line-clamp-3 leading-relaxed">
                      "{cite.quote_snippet}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Retrieved Passages Drawer */}
          {result.document_evidence && result.document_evidence.length > 0 && (
            <div className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setShowPassagesDrawer(!showPassagesDrawer)}
                className="w-full px-6 py-4 flex items-center justify-between bg-bg-card hover:bg-bg-elevated transition-colors border-b border-border-subtle text-left"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-accent-cyan" />
                  <span className="text-sm font-semibold text-content-main">Raw Vector Passages Retrieved</span>
                  <span className="text-[11px] text-content-muted">({result.document_evidence.length} passages)</span>
                </div>
                {showPassagesDrawer ? <ChevronUp className="w-4 h-4 text-content-muted" /> : <ChevronDown className="w-4 h-4 text-content-muted" />}
              </button>

              {showPassagesDrawer && (
                <div className="p-6 space-y-4">
                  {result.document_evidence.map((pass, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-bg-elevated border border-border-subtle space-y-2">
                      <div className="flex items-center justify-between text-xs text-content-muted">
                        <span className="font-medium text-content-main">{pass.doc_filename} (p.{pass.page_number})</span>
                        <span className="text-accent-cyan font-mono text-[11px]">Score: {pass.similarity_score}</span>
                      </div>
                      <p className="text-xs text-content-muted font-mono leading-relaxed bg-bg-main/60 p-3 rounded">
                        {pass.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
