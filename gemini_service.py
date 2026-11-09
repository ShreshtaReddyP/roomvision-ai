"""Calls the Google GenAI SDK to turn the room photo + prompt into a redesigned image."""
import logging
from dataclasses import dataclass

from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from config import settings

logger = logging.getLogger("roomvision.gemini")


class GeminiError(Exception):
    """An error whose message is safe to show to the user."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


@dataclass
class GeneratedImage:
    data: bytes
    mime_type: str
    text: str


def is_configured() -> bool:
    return bool(settings.GEMINI_API_KEY)


def _get_client() -> genai.Client:
    if not settings.GEMINI_API_KEY:
        raise GeminiError(
            "The server is not configured with a Gemini API key yet. Please contact the site owner.",
            status_code=503,
        )
    return genai.Client(
        api_key=settings.GEMINI_API_KEY,
        http_options=types.HttpOptions(timeout=settings.GEMINI_TIMEOUT_SECONDS * 1000),  # milliseconds
    )


def _translate_api_error(exc: genai_errors.APIError) -> GeminiError:
    """Convert an SDK error into a friendly message. Full detail goes to the server log only."""
    code = getattr(exc, "code", None)
    detail = str(getattr(exc, "message", "") or "").lower()
    logger.error("Gemini API error %s: %s", code, detail[:500])

    if code == 400 and "api key" in detail:
        return GeminiError("The server's Gemini API key is invalid. Please contact the site owner.", 503)
    if code == 400 and ("modalit" in detail or "image" in detail):
        return GeminiError(
            f"The configured model '{settings.GEMINI_MODEL}' does not support image output. "
            "The site owner needs to set GEMINI_MODEL to a Gemini model that can generate images.",
            502,
        )
    if code in (401, 403):
        return GeminiError(
            "Gemini rejected the server's credentials or this model is not available to the API key.", 503
        )
    if code == 404:
        return GeminiError(
            f"The model '{settings.GEMINI_MODEL}' was not found. Check the GEMINI_MODEL setting.", 502
        )
    if code == 429:
        return GeminiError("The Gemini service is rate-limited or out of quota right now. Please try again shortly.", 429)
    if code is not None and code >= 500:
        return GeminiError("The Gemini service is temporarily unavailable. Please try again in a moment.", 503)
    return GeminiError("Gemini could not process this request. Please try a different photo or instructions.", 502)


def generate_redesign(image_bytes: bytes, mime_type: str, prompt: str) -> GeneratedImage:
    """Send the photo and prompt to Gemini and return the generated image.

    Raises GeminiError if no real image comes back. It never fakes a result.
    """
    client = _get_client()

    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[prompt, types.Part.from_bytes(data=image_bytes, mime_type=mime_type)],
            config=types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"]),
        )
    except genai_errors.APIError as exc:
        raise _translate_api_error(exc) from exc
    except Exception as exc:  # network failures, timeouts, SDK problems
        logger.exception("Unexpected error while calling Gemini")
        if "timeout" in type(exc).__name__.lower() or "timed out" in str(exc).lower():
            raise GeminiError("The AI took too long to respond. Please try again.", 504) from exc
        raise GeminiError("Could not reach the Gemini service. Please try again in a moment.", 503) from exc

    candidates = getattr(response, "candidates", None) or []
    if not candidates:
        feedback = getattr(response, "prompt_feedback", None)
        reason = getattr(feedback, "block_reason", None)
        logger.warning("Gemini returned no candidates. block_reason=%s", reason)
        if reason:
            raise GeminiError(
                "The AI declined to process this photo or request. Try a different image or simpler instructions.", 422
            )
        raise GeminiError("The AI did not return a result. Please try again.", 502)

    image_data = None
    image_mime = "image/png"
    text_parts: list[str] = []
    finish_reason = None

    for candidate in candidates:
        finish_reason = finish_reason or getattr(candidate, "finish_reason", None)
        parts = getattr(getattr(candidate, "content", None), "parts", None) or []
        for part in parts:
            inline = getattr(part, "inline_data", None)
            if inline is not None and inline.data and (inline.mime_type or "").startswith("image/"):
                if image_data is None:  # keep the first image
                    image_data = inline.data
                    image_mime = inline.mime_type
            elif getattr(part, "text", None):
                text_parts.append(part.text)

    text = " ".join(text_parts).strip()

    if image_data is None:
        logger.warning("Gemini returned no image. finish_reason=%s text=%r", finish_reason, text[:300])
        message = "The AI responded but did not produce an image. Please try again"
        if text:
            message += f". The model said: \"{text[:250]}\""
        else:
            message += " or adjust your instructions."
        raise GeminiError(message, 502)

    return GeneratedImage(data=image_data, mime_type=image_mime, text=text)
