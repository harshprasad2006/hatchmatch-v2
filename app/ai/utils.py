import time
from typing import Any, Callable, TypeVar

T = TypeVar("T")

TRANSIENT_PATTERNS = ("503", "429", "UNAVAILABLE", "RESOURCE_EXHAUSTED")
ALLOWED_LANGUAGES = {"en", "hi", "mr", "hinglish"}


def is_transient_error(exc: Exception) -> bool:
    """Check if exception message or status indicates a transient Gemini/API error."""
    msg = str(exc)
    if any(pattern in msg for pattern in TRANSIENT_PATTERNS):
        return True
    code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    if code is not None and any(pattern in str(code) for pattern in TRANSIENT_PATTERNS):
        return True
    return False


def call_with_retry(
    fn: Callable[..., T],
    tries: int = 3,
    base: float = 1.0,
    *args: Any,
    **kwargs: Any,
) -> T:
    """
    Executes fn with exponential backoff retries for transient errors.
    Retry ONLY when the error message/code contains 503, 429, UNAVAILABLE, or RESOURCE_EXHAUSTED;
    otherwise re-raise immediately.
    Exponential backoff formula: base * (2 ** attempt).
    Re-raises the error on the final try.
    """
    for attempt in range(tries):
        try:
            return fn(*args, **kwargs)
        except Exception as exc:
            if not is_transient_error(exc):
                raise
            if attempt == tries - 1:
                raise
            sleep_duration = base * (2 ** attempt)
            time.sleep(sleep_duration)
    raise RuntimeError("call_with_retry exhausted without returning or raising")


def normalize_lang(label: Any) -> str:
    """
    Normalizes language label: allows exactly 'en', 'hi', 'mr', and 'hinglish'.
    Strips whitespace and lowercases. Maps every other label to 'mixed'.
    """
    if not isinstance(label, str):
        return "mixed"
    cleaned = label.strip().lower()
    if cleaned in ALLOWED_LANGUAGES:
        return cleaned
    return "mixed"
