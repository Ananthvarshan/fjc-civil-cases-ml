"""
FastAPI application entry-point.

Responsibilities:
  1. Register API routers under /api
  2. Serve the built React frontend from ./static (or ../frontend/dist in dev)
  3. Catch-all route returns index.html so React Router deep links work
  4. Load ML artifacts into the in-memory registry at startup
"""
from __future__ import annotations
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.config import CORS_ORIGINS, DEBUG
from backend.core.loader import load_all
from backend.routers import meta, models, predict, compare, cluster

logging.basicConfig(level=logging.DEBUG if DEBUG else logging.INFO)
log = logging.getLogger(__name__)

STATIC_DIR = Path(__file__).parent.parent / "static"   # populated by Docker build-stage


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load artifacts once on startup; nothing to clean up."""
    load_all()
    yield


app = FastAPI(
    title="FJC Civil Cases — ML Explainer API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ── CORS (dev only; in prod the frontend is served from the same origin) ────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routers ──────────────────────────────────────────────────────────────
app.include_router(meta.router)
app.include_router(models.router)
app.include_router(predict.router)
app.include_router(compare.router)
app.include_router(cluster.router)

# ── Static frontend (only when the build exists) ─────────────────────────────
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(request: Request, full_path: str):
        # Serve existing static files; fall back to index.html for SPA routes
        candidate = STATIC_DIR / full_path
        if candidate.exists() and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(STATIC_DIR / "index.html")
else:
    log.info("No static/ dir found — serving API only (dev mode). Run `npm run build` to add the frontend.")
