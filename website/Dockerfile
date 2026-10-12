# ---- Stage 1: build the React frontend ----
FROM node:20-alpine AS frontend-build
WORKDIR /fe
COPY package*.json ./
RUN npm ci --prefer-offline
COPY . .
ENV VITE_API_BASE=/api
RUN npm run build

# ---- Stage 2: Python runtime ----
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860

WORKDIR /srv

# Install Python deps
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source + prebuilt artifacts
COPY backend/ ./backend/

# Copy built frontend from stage 1
COPY --from=frontend-build /fe/dist ./static

# Non-root user (required by HuggingFace Spaces)
RUN useradd -m appuser && chown -R appuser /srv
USER appuser

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s \
  CMD python -c "import os,urllib.request as u; u.urlopen('http://localhost:%s/api/health' % os.environ.get('PORT','7860'))"

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
