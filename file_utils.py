"""Image validation, temporary files and cleanup helpers."""
import io
import logging
import re
import time
import uuid
from contextlib import contextmanager
from pathlib import Path

from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

from config import settings

logger = logging.getLogger("roomvision.files")

ALLOWED_UPLOAD_FORMATS = {"JPEG", "PNG", "WEBP"}
# Maps the format Pillow detects -> (file extension, MIME type)
FORMAT_INFO = {
    "JPEG": ("jpg", "image/jpeg"),
    "PNG": ("png", "image/png"),
    "WEBP": ("webp", "image/webp"),
}
# Generated files are always <32 hex characters>.<ext>; anything else is rejected.
GENERATED_FILENAME_RE = re.compile(r"^[0-9a-f]{32}\.(png|jpg|webp)$")


def read_and_validate_upload(upload: UploadFile) -> bytes:
    """Read the uploaded file, enforce the size limit and confirm it is a real image."""
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    raw = upload.file.read(max_bytes + 1)  # read one extra byte to detect oversize

    if not raw:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(raw) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"The image is too large. The maximum size is {settings.MAX_UPLOAD_MB} MB.",
        )

    try:
        with Image.open(io.BytesIO(raw)) as img:
            image_format = img.format
            img.verify()  # checks the file is not corrupt
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError, Image.DecompressionBombError):
        raise HTTPException(
            status_code=415,
            detail="That file is not a valid image. Please upload a JPG, PNG or WEBP photo.",
        )

    if image_format not in ALLOWED_UPLOAD_FORMATS:
        raise HTTPException(
            status_code=415,
            detail="Unsupported image format. Please upload a JPG, PNG or WEBP photo.",
        )
    return raw


def normalize_image(raw: bytes) -> tuple[bytes, int, int]:
    """Fix phone-camera rotation, convert to RGB JPEG and shrink very large photos.

    Returns (jpeg_bytes, width, height). Smaller images keep memory use and
    Gemini upload time low.
    """
    try:
        with Image.open(io.BytesIO(raw)) as img:
            img = ImageOps.exif_transpose(img)
            img = img.convert("RGB")
            img.thumbnail((settings.MAX_IMAGE_SIDE, settings.MAX_IMAGE_SIDE), Image.Resampling.LANCZOS)
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=92)
            return buffer.getvalue(), img.width, img.height
    except (OSError, ValueError, Image.DecompressionBombError):
        raise HTTPException(status_code=415, detail="We could not read that image. Please try a different photo.")


@contextmanager
def temporary_image_file(data: bytes, suffix: str = ".jpg"):
    """Write bytes to a uniquely named temp file and always delete it afterwards."""
    settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)
    path = settings.TEMP_DIR / f"{uuid.uuid4().hex}{suffix}"
    try:
        path.write_bytes(data)
        yield path
    finally:
        try:
            path.unlink(missing_ok=True)
        except OSError:
            logger.warning("Could not delete temporary file %s", path.name)


def inspect_generated_image(data: bytes) -> tuple[str, str]:
    """Confirm Gemini's output really is an image. Returns (extension, mime_type)."""
    try:
        with Image.open(io.BytesIO(data)) as img:
            image_format = img.format
            img.verify()
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError):
        raise ValueError("The data returned by the model is not a valid image.")
    if image_format not in FORMAT_INFO:
        raise ValueError(f"Unsupported generated image format: {image_format}")
    return FORMAT_INFO[image_format]


def save_generated_image(data: bytes, extension: str) -> str:
    """Save a generated image under a random UUID name and return the filename."""
    settings.GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{extension}"
    (settings.GENERATED_DIR / filename).write_bytes(data)
    return filename


def cleanup_old_files(directory: Path, max_age_seconds: int) -> int:
    """Delete files older than max_age_seconds. Returns how many were removed."""
    if not directory.exists():
        return 0
    removed = 0
    now = time.time()
    for item in directory.iterdir():
        if not item.is_file() or item.name.startswith("."):
            continue  # keep .gitkeep and folders
        try:
            if now - item.stat().st_mtime > max_age_seconds:
                item.unlink()
                removed += 1
        except OSError:
            logger.warning("Could not remove old file %s", item.name)
    return removed
