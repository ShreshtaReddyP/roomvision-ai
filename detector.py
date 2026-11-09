"""Furniture and object detection with Ultralytics YOLO11n.

The model is loaded lazily (on first use) so the web server starts quickly and
a problem with PyTorch never stops the whole API from booting.
"""
import logging
import threading
from pathlib import Path

from config import settings

logger = logging.getLogger("roomvision.detector")

# COCO class names that matter for interior design.
RELEVANT_CLASSES = {
    "bed",
    "chair",
    "couch",
    "dining table",
    "tv",
    "potted plant",
    "bench",
    "clock",
    "vase",
    "refrigerator",
    "microwave",
    "oven",
    "sink",
    "toilet",
}

_model = None
_load_lock = threading.Lock()
_predict_lock = threading.Lock()  # one prediction at a time keeps memory use low


class DetectorUnavailable(Exception):
    """Raised when YOLO cannot be loaded or run."""


def is_loaded() -> bool:
    return _model is not None


def _get_model():
    global _model
    if _model is None:
        with _load_lock:
            if _model is None:
                logger.info("Loading YOLO model '%s' (first load may download the weights)...", settings.YOLO_MODEL)
                from ultralytics import YOLO  # imported here on purpose (heavy import)

                _model = YOLO(settings.YOLO_MODEL)
                logger.info("YOLO model loaded.")
    return _model


def preload() -> None:
    """Load the model ahead of the first request. Never raises."""
    try:
        _get_model()
    except Exception:
        logger.exception("YOLO preload failed; detection will be retried on demand.")


def detect_objects(image_path: Path) -> dict:
    """Run detection and return only interior-relevant objects.

    Returns:
        {"count": int, "objects": [{"label", "confidence", "bbox": {x1,y1,x2,y2}}],
         "image_width": int, "image_height": int}
    Raises:
        DetectorUnavailable if the model cannot be loaded or run.
    """
    if not settings.ENABLE_DETECTION:
        raise DetectorUnavailable("Detection is switched off (ENABLE_DETECTION=false)")

    try:
        model = _get_model()
        with _predict_lock:
            results = model.predict(
                source=str(image_path),
                conf=settings.YOLO_CONFIDENCE,
                imgsz=640,
                device="cpu",
                verbose=False,
            )
    except Exception as exc:
        logger.exception("YOLO detection failed")
        raise DetectorUnavailable("YOLO detection failed") from exc

    result = results[0]
    height, width = result.orig_shape
    objects = []
    for box in result.boxes:
        label = result.names[int(box.cls[0])]
        if label not in RELEVANT_CLASSES:
            continue
        x1, y1, x2, y2 = (float(v) for v in box.xyxy[0].tolist())
        objects.append(
            {
                "label": label,
                "confidence": round(float(box.conf[0]), 3),
                "bbox": {"x1": round(x1, 1), "y1": round(y1, 1), "x2": round(x2, 1), "y2": round(y2, 1)},
            }
        )

    objects.sort(key=lambda o: o["confidence"], reverse=True)
    return {"count": len(objects), "objects": objects, "image_width": int(width), "image_height": int(height)}
