import hashlib
import re
from typing import Any, Dict, Optional


def normalize_text_for_cache(text: str) -> str:
    """Consistently normalizes input text: strips, lowercases, and collapses all whitespace."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.strip().lower())


def compute_input_hash(text: str) -> str:
    """Computes a SHA-256 hash of the normalized input string."""
    normalized = normalize_text_for_cache(text)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def find_cached_report_by_hash(collection: Any, input_hash: str) -> Optional[Dict[str, Any]]:
    """
    Looks up a previously generated report in Firestore using the SHA-256 hash of normalized text.
    Returns the report data dict on a cache hit, or None on a miss/error.
    """
    try:
        query = collection.where("input_hash", "==", input_hash).limit(1).stream()
        for doc in query:
            data = doc.to_dict() if hasattr(doc, "to_dict") else None
            if data and "idea_card" in data and "uniqueness_score" in data:
                return data
    except Exception:
        # Cache lookup errors must never interrupt the live pipeline
        pass
    return None
