import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

FIREBASE_KEY_PATH = os.getenv(
    "FIREBASE_KEY_PATH",
    str(BASE_DIR / "secrets" / "firebase-key.json"),
)

# Feature flag for Google Search grounding (default false, do not enable in production yet)
USE_GROUNDING = os.getenv("USE_GROUNDING", "false").lower() in ("true", "1", "yes")
