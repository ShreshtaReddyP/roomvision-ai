"""Central configuration. Every setting comes from an environment variable.

Locally, values are read from backend/.env (copy .env.example to create it).
On Render, set the same names in the dashboard under "Environment".
"""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _get_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


def _get_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


def _get_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _build_allowed_origins(environment: str) -> list[str]:
    """FRONTEND_URL may hold one URL or several separated by commas."""
    raw = os.getenv("FRONTEND_URL", "")
    origins = [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]
    if environment != "production":
        origins += ["http://localhost:5173", "http://127.0.0.1:5173"]
    # Remove duplicates while keeping order
    return list(dict.fromkeys(origins))


class Settings:
    APP_NAME = "RoomVision AI API"
    APP_VERSION = "1.0.0"

    ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()
    ALLOWED_ORIGINS = _build_allowed_origins(ENVIRONMENT)

    # --- Gemini ---------------------------------------------------------
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
    # Must be a Gemini model that can OUTPUT images.
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-image").strip()
    GEMINI_TIMEOUT_SECONDS = _get_int("GEMINI_TIMEOUT_SECONDS", 120)

    # --- Uploads --------------------------------------------------------
    MAX_UPLOAD_MB = _get_int("MAX_UPLOAD_MB", 10)
    # Large photos are shrunk to this many pixels on the longest side.
    MAX_IMAGE_SIDE = _get_int("MAX_IMAGE_SIDE", 1536)

    # --- YOLO -----------------------------------------------------------
    YOLO_MODEL = os.getenv("YOLO_MODEL", "yolo11n.pt").strip()
    YOLO_CONFIDENCE = _get_float("YOLO_CONFIDENCE", 0.25)
    PRELOAD_DETECTOR = _get_bool("PRELOAD_DETECTOR", False)
    # Set to false on very small servers: designs are still generated, without furniture detection.
    ENABLE_DETECTION = _get_bool("ENABLE_DETECTION", True)

    # --- Storage / limits ----------------------------------------------
    GENERATED_DIR = BASE_DIR / "generated"
    TEMP_DIR = BASE_DIR / "tmp"
    GENERATED_TTL_MINUTES = _get_int("GENERATED_TTL_MINUTES", 60)
    MAX_CONCURRENT_GENERATIONS = _get_int("MAX_CONCURRENT_GENERATIONS", 2)


settings = Settings()
