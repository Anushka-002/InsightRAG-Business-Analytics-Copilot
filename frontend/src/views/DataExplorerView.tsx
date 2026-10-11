import React, { useEffect, useState, useRef } from 'react';
import { 
  Database, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Hash, 
  Calendar, 
  Tag, 
  Copy 
} from 'lucide-react';
import { DatasetProfile } from '../types';
import { api } from '../api/client';

export const DataExplorerView: React.FC = () => {
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDataProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dataset profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadStatus(null);
      const res = await api.uploadCsv(file);
      setUploadStatus(res.message);
      await loadProfile();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetDemo = async () => {
    try {
      setLoading(true);
      await api.loadDemoDataset();
      await loadProfile();
      setUploadStatus('Demo dataset restored successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to reset demo dataset');
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'numeric':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono bg-accent-blue/15 text-accent-blue border border-accent-blue/20">
            <Hash className="w-3 h-3" />
            <span>numeric</span>
          </span>
        );
      case 'date':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20">
            <Calendar className="w-3 h-3" />
            <span>date</span>
          </span>
        );
      case 'categorical':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/20">
            <Tag className="w-3 h-3" />
            <span>category</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono bg-bg-elevated text-content-muted border border-border-subtle">
            <span>text</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-10 h-10 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-content-muted text-sm">Profiling dataset schemas and distributions...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto overflow-y-auto">
      {/* Upload & Actions Bar */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-content-main">Dataset Ingestion & Management</h2>
          <p className="text-xs text-content-muted mt-1">
            Current active table: <span className="font-mono text-accent-cyan font-medium">{profile?.table_name || 'sales_transactions'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3.5 py-2 rounded-lg bg-accent-blue hover:bg-blue-500 text-bg-main text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Uploading...' : 'Import Custom CSV'}</span>
          </button>

          <button
            onClick={handleResetDemo}
            className="px-3.5 py-2 rounded-lg bg-bg-elevated hover:bg-border-subtle border border-border-subtle text-xs text-content-main font-medium flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Restore Demo Dataset</span>
          </button>
        </div>
      </div>

      {/* Status or Error Notifications */}
      {uploadStatus && (
        <div className="bg-status-success/10 border border-status-success/30 rounded-xl p-4 text-xs text-status-success flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{uploadStatus}</span>
        </div>
      )}

      {error && (
        <div className="bg-status-error/10 border border-status-error/30 rounded-xl p-4 text-xs text-status-error flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dataset Profiling Metrics Grid */}
      {profile && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
              <span className="text-xs text-content-muted block">Total Records</span>
              <span className="text-2xl font-bold text-content-main tabular-nums mt-2 block">
                {profile.total_rows.toLocaleString()}
              </span>
              <span className="text-[11px] text-content-muted mt-1 block">Full analytical sample</span>
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
              <span className="text-xs text-content-muted block">Columns</span>
              <span className="text-2xl font-bold text-content-main tabular-nums mt-2 block">
                {profile.total_columns}
              </span>
              <span className="text-[11px] text-content-muted mt-1 block">
                {profile.numeric_columns.length} numeric, {profile.categorical_columns.length} categorical
              </span>
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
              <span className="text-xs text-content-muted block">Duplicate Rows</span>
              <span className="text-2xl font-bold text-content-main tabular-nums mt-2 block">
                {profile.duplicate_rows}
              </span>
              <span className="text-[11px] text-status-success mt-1 block">0% duplication redundancy</span>
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
              <span className="text-xs text-content-muted block">Temporal Dimensions</span>
              <span className="text-2xl font-bold text-accent-cyan tabular-nums mt-2 block">
                {profile.date_columns.length}
              </span>
              <span className="text-[11px] text-content-muted mt-1 block truncate">
                {profile.date_columns.join(', ') || 'No date field'}
              </span>
            </div>
          </div>

          {/* Column Profile Table */}
          <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-content-main">Column Profiling & Descriptive Statistics</h3>
                <p className="text-xs text-content-muted">Comprehensive schema inspection, missingness checks, and distributions</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border-subtle">
              <table className="w-full text-xs text-left">
                <thead className="bg-bg-elevated text-content-muted font-medium border-b border-border-subtle">
                  <tr>
                    <th className="px-4 py-3">Column Name</th>
                    <th className="px-4 py-3">Inferred Type</th>
                    <th className="px-4 py-3">Missingness</th>
                    <th className="px-4 py-3">Uniques</th>
                    <th className="px-4 py-3">Distribution / Summary Statistics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {profile.column_profiles.map((col, idx) => (
                    <tr key={idx} className="hover:bg-bg-elevated/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-content-main">
                        {col.name}
                      </td>
                      <td className="px-4 py-3">
                        {getTypeBadge(col.inferred_type)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-content-muted">
                        {col.missing_count === 0 ? (
                          <span className="text-status-success font-medium">0 (0%)</span>
                        ) : (
                          <span className="text-status-warning font-medium">{col.missing_count} ({col.missing_pct}%)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-content-main">
                        {col.unique_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-content-muted">
                        {col.inferred_type === 'numeric' && col.stats && (
                          <div className="flex flex-wrap gap-2 text-[11px] font-mono text-content-main">
                            <span>min: {col.stats.min}</span>
                            <span className="text-border-subtle">|</span>
                            <span>mean: {col.stats.mean}</span>
                            <span className="text-border-subtle">|</span>
                            <span>median: {col.stats.median}</span>
                            <span className="text-border-subtle">|</span>
                            <span>max: {col.stats.max}</span>
                          </div>
                        )}
                        {col.inferred_type === 'date' && col.stats && (
                          <span className="text-[11px] font-mono text-accent-cyan">
                            {col.stats.min_date} → {col.stats.max_date}
                          </span>
                        )}
                        {col.inferred_type === 'categorical' && col.stats?.top_categories && (
                          <div className="flex flex-wrap gap-1 text-[11px]">
                            {Object.entries(col.stats.top_categories).map(([cat, cnt]: any, cIdx) => (
                              <span key={cIdx} className="px-1.5 py-0.5 rounded bg-bg-elevated text-content-muted">
                                {cat} ({cnt})
                              </span>
                            ))}
                          </div>
                        )}
                        {col.inferred_type === 'string' && col.stats?.sample_values && (
                          <span className="text-[11px] text-content-muted truncate block max-w-xs">
                            {col.stats.sample_values.join(', ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
