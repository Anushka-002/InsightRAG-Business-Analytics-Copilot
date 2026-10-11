import numpy as np
from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
from app.config import settings

class EmbeddingModel:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words='english',
            sublinear_tf=True,
            norm='l2',
            token_pattern=r'(?u)\b\w[\w-]+\b'
        )
        self.is_fitted = False

    def fit(self, corpus: List[str]):
        if not corpus:
            return
        self.vectorizer.fit(corpus)
        self.is_fitted = True

    def embed_documents(self, texts: List[str]) -> np.ndarray:
        if not self.is_fitted:
            self.fit(texts)
        vectors = self.vectorizer.transform(texts).toarray()
        # Ensure L2 normalization
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return vectors / norms

    def embed_query(self, query: str) -> np.ndarray:
        if not self.is_fitted:
            return np.zeros((1, 10))
        vec = self.vectorizer.transform([query]).toarray()
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec[0]

# Singleton embedding model
default_embedding_model = EmbeddingModel()
