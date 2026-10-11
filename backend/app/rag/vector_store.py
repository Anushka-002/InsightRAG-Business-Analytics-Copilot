import os
import json
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.rag.extractor import extract_text_from_file, ExtractedDocument
from app.rag.chunker import chunk_document, DocumentChunk
from app.rag.embeddings import default_embedding_model
from app.config import settings

class VectorStore:
    def __init__(self, storage_path: Optional[Path] = None):
        self.storage_path = storage_path or settings.VECTOR_INDEX_PATH
        self.chunks: List[Dict[str, Any]] = []
        self.vectors: Optional[np.ndarray] = None
        self.documents_metadata: Dict[str, Dict[str, Any]] = {}
        self.load_index()

    def load_index(self):
        if self.storage_path and self.storage_path.exists():
            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.chunks = data.get("chunks", [])
                self.documents_metadata = data.get("documents", {})
                raw_vectors = data.get("vectors")
                if raw_vectors:
                    self.vectors = np.array(raw_vectors, dtype=np.float32)
                    # Re-fit vectorizer with existing corpus
                    corpus = [c["content"] for c in self.chunks]
                    default_embedding_model.fit(corpus)
            except Exception as e:
                print(f"Error loading index: {e}, resetting vector store")
                self.chunks = []
                self.documents_metadata = {}
                self.vectors = None

    def save_index(self):
        if not self.storage_path:
            return
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "documents": self.documents_metadata,
            "chunks": self.chunks,
            "vectors": self.vectors.tolist() if self.vectors is not None else []
        }
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(data, f)

    def index_document(self, file_path: Path, chunk_size: int = settings.CHUNK_SIZE, chunk_overlap: int = settings.CHUNK_OVERLAP) -> int:
        """
        Extracts, chunks, and indexes a single document into the vector store.
        """
        extracted = extract_text_from_file(file_path)
        chunks = chunk_document(extracted, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        
        # Remove any previous chunks from this document
        self.chunks = [c for c in self.chunks if c["doc_filename"] != extracted.filename]
        
        # Add new chunks
        for c in chunks:
            self.chunks.append(c.to_dict())

        self.documents_metadata[extracted.filename] = {
            "filename": extracted.filename,
            "filepath": str(file_path),
            "file_type": extracted.file_type,
            "total_pages": extracted.total_pages,
            "total_characters": extracted.total_characters,
            "chunks_count": len(chunks)
        }

        # Re-index all chunks
        self._rebuild_vectors()
        self.save_index()
        return len(chunks)

    def _rebuild_vectors(self):
        if not self.chunks:
            self.vectors = None
            return
            
        corpus = [c["content"] for c in self.chunks]
        default_embedding_model.fit(corpus)
        self.vectors = default_embedding_model.embed_documents(corpus)

    def similarity_search(
        self,
        query: str,
        top_k: int = settings.TOP_K,
        threshold: float = settings.SIMILARITY_THRESHOLD
    ) -> List[Dict[str, Any]]:
        """
        Retrieves the top-k most similar passages to the query.
        Filters out passages below the similarity threshold.
        """
        if not self.chunks:
            return []

        if self.vectors is None or self.vectors.shape[0] != len(self.chunks):
            self._rebuild_vectors()

        query_vec = default_embedding_model.embed_query(query)
        if self.vectors is None or query_vec.shape[0] != self.vectors.shape[1]:
            self._rebuild_vectors()
            query_vec = default_embedding_model.embed_query(query)

        cosine_scores = np.dot(self.vectors, query_vec)

        # Lexical keyword overlap bonus
        q_tokens = [w.lower().strip(".,?!:;\"'()") for w in query.split() if len(w) > 3]
        final_scores = np.copy(cosine_scores)
        
        for idx, chunk in enumerate(self.chunks):
            content_lower = chunk["content"].lower()
            doc_lower = chunk["doc_filename"].lower()
            overlap_count = sum(1 for t in q_tokens if t in content_lower or t in doc_lower)
            if q_tokens:
                lexical_bonus = (overlap_count / len(q_tokens)) * 0.25
                final_scores[idx] += lexical_bonus

        sorted_indices = np.argsort(final_scores)[::-1]

        results = []
        for idx in sorted_indices[:top_k]:
            score = float(final_scores[idx])
            if score >= threshold:
                chunk = dict(self.chunks[idx])
                chunk["similarity_score"] = round(score, 4)
                results.append(chunk)

        # Fallback if no chunk strictly met threshold: return top 2 if score > 0.02
        if not results and len(sorted_indices) > 0 and float(final_scores[sorted_indices[0]]) > 0.02:
            for idx in sorted_indices[:2]:
                c = dict(self.chunks[idx])
                c["similarity_score"] = round(float(final_scores[idx]), 4)
                results.append(c)

        return results

    def get_all_documents(self) -> List[Dict[str, Any]]:
        return list(self.documents_metadata.values())

    def delete_document(self, filename: str) -> bool:
        if filename in self.documents_metadata:
            del self.documents_metadata[filename]
            self.chunks = [c for c in self.chunks if c["doc_filename"] != filename]
            self._rebuild_vectors()
            self.save_index()
            return True
        return False

    def reindex_all(self, chunk_size: int, chunk_overlap: int):
        all_files = [Path(meta["filepath"]) for meta in self.documents_metadata.values() if Path(meta["filepath"]).exists()]
        self.chunks = []
        self.documents_metadata = {}
        for f in all_files:
            self.index_document(f, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

vector_store = VectorStore()
