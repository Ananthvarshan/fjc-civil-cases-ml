"""
Backend configuration — driven by environment variables so the same image
works locally, on Docker Compose, Render, and Hugging Face Spaces.
"""
import os
from pathlib import Path

# ── Serving ────────────────────────────────────────────────────────────────
PORT: int = int(os.getenv("PORT", "7860"))

# ── Artifacts ──────────────────────────────────────────────────────────────
# Default: ./artifacts/ relative to this file (works in Docker where we
# copy the whole backend/ dir to /srv/backend/).
ARTIFACT_DIR: Path = Path(
    os.getenv("ARTIFACT_DIR", Path(__file__).parent / "artifacts")
)

# ── CORS ───────────────────────────────────────────────────────────────────
# Comma-separated origins, e.g. "http://localhost:5173,https://my-app.vercel.app"
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174")
CORS_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]

# ── Misc ───────────────────────────────────────────────────────────────────
DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
