# Stage 1: Build the React + TypeScript frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend runtime
FROM python:3.12-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend \
    PORT=7860

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code & sample data
COPY backend/ ./backend/

# Copy built frontend assets from stage 1
COPY --from=frontend-builder /build/dist ./frontend/dist

# Initialize demo dataset and vector index
RUN python -c "from app.config import settings; from app.db.session import init_database_from_csv; from app.rag.vector_store import vector_store; init_database_from_csv(settings.DATA_DIR / 'demo_sales.csv'); [vector_store.index_document(f) for f in settings.REPORTS_DIR.iterdir() if f.suffix in ('.txt', '.pdf')]"

# Create and grant permissions on storage directory for Hugging Face non-root user (UID 1000)
RUN mkdir -p /app/backend/storage && chmod -R 777 /app/backend/storage

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:7860/api/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
