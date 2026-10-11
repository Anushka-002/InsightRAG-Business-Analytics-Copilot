import React, { useEffect, useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Search, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Sparkles,
  FileCheck
} from 'lucide-react';
import { DocumentMetadata } from '../types';
import { api } from '../api/client';

export const DocumentsView: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Upload
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Search Preview
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Re-indexing parameters
  const [chunkSize, setChunkSize] = useState(600);
  const [chunkOverlap, setChunkOverlap] = useState(100);
  const [isReindexing, setIsReindexing] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDocuments();
      setDocuments(res.documents);
      setTotalChunks(res.total_chunks);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setStatusMsg(null);
      const res = await api.uploadDocument(file);
      setStatusMsg(res.message);
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Are you sure you want to remove '${filename}' from the knowledge base?`)) return;
    try {
      await api.deleteDocument(filename);
      setStatusMsg(`Document '${filename}' deleted.`);
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
    }
  };

  const handleSearchPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const res = await api.searchPreview(searchQuery.trim(), 4, 0.05);
      setSearchResults(res.passages);
    } catch (err: any) {
      setError(err.message || 'Search preview failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleReindex = async () => {
    try {
      setIsReindexing(true);
      setStatusMsg(null);
      const res = await api.reindexDocuments(chunkSize, chunkOverlap);
      setStatusMsg(res.message);
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Re-indexing failed');
    } finally {
      setIsReindexing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-10 h-10 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
        <p className="text-content-muted text-sm">Loading vector knowledge base...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto overflow-y-auto">
      {/* Top Banner & Upload */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-content-main">Corporate Knowledge Base & Documents</h2>
          <p className="text-xs text-content-muted mt-1">
            {documents.length} verified documents indexed across {totalChunks} vector passages
          </p>
        </div>

        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            accept=".pdf,.txt,.md" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3.5 py-2 rounded-lg bg-accent-cyan hover:bg-cyan-400 text-bg-main text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Indexing...' : 'Upload PDF / Report'}</span>
          </button>
        </div>
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

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc, idx) => (
          <div 
            key={idx}
            className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-sm space-y-3 relative group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded bg-bg-elevated border border-border-subtle flex items-center justify-center text-accent-cyan">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-content-main line-clamp-1" title={doc.filename}>
                    {doc.filename}
                  </h3>
                  <span className="text-[10px] text-content-muted uppercase font-mono">
                    {doc.file_type} • {doc.total_pages} {doc.total_pages === 1 ? 'page' : 'pages'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDelete(doc.filename)}
                className="opacity-40 group-hover:opacity-100 hover:text-status-error transition-opacity p-1 text-content-muted"
                title="Remove document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-content-muted">
              <span>{doc.chunks_count} vector chunks</span>
              <span>{(doc.total_characters / 1000).toFixed(1)}k chars</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout: Search Preview & Chunking Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Search Preview Drawer */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-accent-cyan" />
            <h3 className="text-sm font-semibold text-content-main">Retrieval Preview Inspector</h3>
          </div>
          <p className="text-xs text-content-muted">
            Inspect which passages the vector index selects before asking a full question.
          </p>

          <form onSubmit={handleSearchPreview} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. discount policy approval or Q2 margin decline..."
              className="flex-1 bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs text-content-main placeholder-content-muted focus:outline-none focus:border-accent-cyan"
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-3.5 py-2 bg-accent-cyan hover:bg-cyan-400 text-bg-main text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Preview'}
            </button>
          </form>

          {/* Results list */}
          <div className="space-y-3 pt-2 max-h-80 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map((pass, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-bg-elevated border border-border-subtle space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-content-main truncate pr-2">
                      {pass.doc_filename} (p.{pass.page_number})
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan font-mono text-[10px]">
                      Score: {pass.similarity_score}
                    </span>
                  </div>
                  <p className="text-xs text-content-muted font-mono line-clamp-3 leading-relaxed">
                    {pass.content}
                  </p>
                </div>
              ))
            ) : searchQuery && !isSearching ? (
              <p className="text-xs text-content-muted text-center py-4">No passages above threshold found.</p>
            ) : null}
          </div>
        </div>

        {/* Chunking & Indexing Tuning Controls */}
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-accent-blue" />
            <h3 className="text-sm font-semibold text-content-main">RAG Chunking & Index Tuning</h3>
          </div>
          <p className="text-xs text-content-muted">
            Configure sliding-window chunk size and overlap parameters for the vector embedding engine.
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-content-main mb-1.5">
                <span>Target Chunk Size</span>
                <span className="font-mono text-accent-blue">{chunkSize} chars</span>
              </div>
              <input
                type="range"
                min="200"
                max="1200"
                step="50"
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                className="w-full accent-accent-blue cursor-pointer"
              />
              <span className="text-[10px] text-content-muted block mt-1">Smaller chunks improve citation precision; larger chunks preserve narrative context.</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-content-main mb-1.5">
                <span>Chunk Overlap</span>
                <span className="font-mono text-accent-blue">{chunkOverlap} chars</span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="25"
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(Number(e.target.value))}
                className="w-full accent-accent-blue cursor-pointer"
              />
              <span className="text-[10px] text-content-muted block mt-1">Prevents sentence fragmentation across passage boundaries.</span>
            </div>

            <div className="pt-2">
              <button
                onClick={handleReindex}
                disabled={isReindexing}
                className="w-full py-2.5 bg-bg-elevated hover:bg-border-subtle border border-border-subtle text-xs font-semibold text-content-main rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Layers className="w-3.5 h-3.5 text-accent-blue" />
                <span>{isReindexing ? 'Rebuilding Index...' : 'Re-index All Documents'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
