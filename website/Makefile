# FJC ML Explainer — Website Makefile
# Usage: make dev | build | run | test | artifacts

.PHONY: dev build run test artifacts clean

## ── Development (hot reload) ──────────────────────────────────────────────
dev:
	docker compose --profile dev up --build

## ── Production build + run (single container) ────────────────────────────
build:
	docker compose build

run:
	docker compose up --build

## ── Frontend only (no Docker) ────────────────────────────────────────────
frontend-dev:
	npm run dev

frontend-build:
	npm run build

## ── Backend only (no Docker) ─────────────────────────────────────────────
backend-dev:
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

## ── Tests ────────────────────────────────────────────────────────────────
test:
	cd backend && python -m pytest tests/ -v

## ── Generate ML artifacts (run after notebooks are finished) ─────────────
## Requires the trained models and processed data to exist.
artifacts:
	@echo "Run scripts/export_artifacts.py from the repo root to generate backend/artifacts/"
	@echo "Then rebuild with: make build"

## ── Cleanup ──────────────────────────────────────────────────────────────
clean:
	-docker compose down --volumes --remove-orphans
	-Remove-Item -Recurse -Force dist, node_modules/.vite 2>NUL || true
