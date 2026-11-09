"""RoomVision AI - FastAPI backend entry point.

Run locally:   uvicorn main:app --reload --port 8000
Run on Render: uvicorn main:app --host 0.0.0.0 --port $PORT
"""
import logging
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

import detector
from config import settings
from services import gemini_service
from services.file_utils import (
    GENERATED_FILENAME_RE,
    cleanup_old_files,
    inspect_generated_image,
    normalize_image,
    read_and_validate_upload,
    save_generated_image,
    temporary_image_file,
)
from services.gemini_service import GeminiError
from services.prompt_builder import (
    BUDGETS,
    COLOR_PALETTES,
    DESIGN_STYLES,
    MAX_CUSTOM_PALETTE_LENGTH,
    MAX_INSTRUCTIONS_LENGTH,
    ROOM_TYPES,
    build_prompt,
    clean_text,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger("roomvision.api")

settings.GENERATED_DIR.mkdir(parents=True, exist_ok=True)
settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)

# Limits how many AI jobs run at once so a small server does not run out of memory.
_generation_slots = threading.BoundedSemaphore(settings.MAX_CONCURRENT_GENERATIONS)


def _cleanup_storage() -> None:
    removed = cleanup_old_files(settings.GENERATED_DIR, settings.GENERATED_TTL_MINUTES * 60)
    removed += cleanup_old_files(settings.TEMP_DIR, 3600)
    if removed:
        logger.info("Cleaned up %d old file(s)", removed)


@asynccontextmanager
async def lifespan(app: FastAPI):
    _cleanup_storage()
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is not set. /generate-redesign will return an error until it is.")
    logger.info("Allowed CORS origins: %s", settings.ALLOWED_ORIGINS)
    if settings.PRELOAD_DETECTOR and settings.ENABLE_DETECTION:
        threading.Thread(target=detector.preload, daemon=True).start()
    yield


app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Generated images are served at /generated/<uuid>.<ext>
app.mount("/generated", StaticFiles(directory=str(settings.GENERATED_DIR)), name="generated")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _validate_options(
    design_style: str,
    room_type: str,
    color_palette: str,
    custom_palette: str,
    budget: str,
    additional_instructions: str,
) -> dict:
    """Check every option against the allowed lists and clean the free-text fields."""
    problems = []
    if design_style not in DESIGN_STYLES:
        problems.append(f"design_style must be one of: {', '.join(DESIGN_STYLES)}")
    if room_type not in ROOM_TYPES:
        problems.append(f"room_type must be one of: {', '.join(ROOM_TYPES)}")
    if color_palette not in COLOR_PALETTES:
        problems.append(f"color_palette must be one of: {', '.join(COLOR_PALETTES)}")
    if budget not in BUDGETS:
        problems.append(f"budget must be one of: {', '.join(BUDGETS)}")

    custom = clean_text(custom_palette, MAX_CUSTOM_PALETTE_LENGTH)
    if color_palette == "custom" and not custom:
        problems.append("Please describe your custom colour palette.")

    if problems:
        raise HTTPException(status_code=422, detail=" ".join(problems))

    return {
        "design_style": design_style,
        "room_type": room_type,
        "color_palette": color_palette,
        "custom_palette": custom if color_palette == "custom" else "",
        "budget": budget,
        "additional_instructions": clean_text(additional_instructions, MAX_INSTRUCTIONS_LENGTH),
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "Backend for RoomVision AI: YOLO furniture detection and Gemini room redesigns.",
        "docs": "/docs",
        "endpoints": {
            "GET /health": "Service status",
            "POST /analyze-room": "Detect furniture and objects in a room photo",
            "POST /generate-redesign": "Generate an AI redesign of a room photo",
            "GET /download/{filename}": "Download a generated image",
        },
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "gemini_configured": gemini_service.is_configured(),
        "gemini_model": settings.GEMINI_MODEL,
        "detection_enabled": settings.ENABLE_DETECTION,
        "detector_loaded": detector.is_loaded(),
    }


@app.post("/analyze-room")
def analyze_room(file: UploadFile = File(...)):
    """Run YOLO on the uploaded photo and return detected furniture."""
    try:
        raw = read_and_validate_upload(file)
        jpeg_bytes, _, _ = normalize_image(raw)
        try:
            with temporary_image_file(jpeg_bytes) as path:
                result = detector.detect_objects(path)
        except detector.DetectorUnavailable:
            raise HTTPException(status_code=503, detail="Furniture detection is currently unavailable on the server.")
        return {"success": True, **result}
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error in /analyze-room")
        raise HTTPException(status_code=500, detail="Something went wrong while analysing the room.")


@app.post("/generate-redesign")
def generate_redesign(
    file: UploadFile = File(...),
    design_style: str = Form(...),
    room_type: str = Form(...),
    color_palette: str = Form(...),
    budget: str = Form(...),
    custom_palette: str = Form(""),
    additional_instructions: str = Form(""),
    preserve_layout: bool = Form(True),
):
    """Detect objects, build a design prompt, ask Gemini for a redesigned image and return it."""
    options = _validate_options(
        design_style, room_type, color_palette, custom_palette, budget, additional_instructions
    )

    if not _generation_slots.acquire(blocking=False):
        raise HTTPException(
            status_code=429, detail="The server is busy with other designs. Please try again in a minute."
        )

    try:
        raw = read_and_validate_upload(file)
        jpeg_bytes, _, _ = normalize_image(raw)

        # Detection is optional: if YOLO fails we still generate the redesign.
        detection = {"available": False, "count": 0, "objects": [], "image_width": None, "image_height": None}
        try:
            with temporary_image_file(jpeg_bytes) as path:
                found = detector.detect_objects(path)
            detection = {"available": True, **found}
        except detector.DetectorUnavailable:
            logger.warning("Continuing without furniture detection")

        prompt = build_prompt(
            **options,
            preserve_layout=preserve_layout,
            detections=detection["objects"],
        )

        generated = gemini_service.generate_redesign(jpeg_bytes, "image/jpeg", prompt)

        try:
            extension, _mime = inspect_generated_image(generated.data)
        except ValueError:
            logger.error("Model returned data that is not a valid image")
            raise GeminiError("The AI returned an unreadable image. Please try again.", 502)

        _cleanup_storage()
        filename = save_generated_image(generated.data, extension)
        logger.info("Saved redesign %s (%d bytes)", filename, len(generated.data))

        return {
            "success": True,
            "image_url": f"/generated/{filename}",
            "download_url": f"/download/{filename}",
            "filename": filename,
            "metadata": {
                **options,
                "preserve_layout": preserve_layout,
                "model": settings.GEMINI_MODEL,
            },
            "detection": detection,
            "ai_notes": generated.text,
        }
    except GeminiError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error in /generate-redesign")
        raise HTTPException(status_code=500, detail="Something went wrong while creating your redesign.")
    finally:
        _generation_slots.release()


@app.get("/download/{filename}")
def download_image(filename: str):
    """Serve a generated image as a file download."""
    if not GENERATED_FILENAME_RE.match(filename):
        raise HTTPException(status_code=404, detail="Image not found.")
    path = settings.GENERATED_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="This image has expired. Please generate a new design.")
    extension = filename.rsplit(".", 1)[1]
    media_type = {"png": "image/png", "jpg": "image/jpeg", "webp": "image/webp"}[extension]
    return FileResponse(path, media_type=media_type, filename=f"roomvision-redesign-{filename[:8]}.{extension}")
