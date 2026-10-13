import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import firebase_admin
from firebase_admin import credentials, firestore

from app.config import FIREBASE_KEY_PATH

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_FILE = DATA_DIR / "firestore_data.json"
SEED_FILE = BASE_DIR / "seed" / "problems_demo_seed.json"


class LocalDocumentSnapshot:
    def __init__(self, data: Optional[Dict[str, Any]] = None, doc_id: str = ""):
        self._data = data
        self.exists = data is not None
        self.id = doc_id or (data or {}).get("id", "")

    def to_dict(self) -> Dict[str, Any]:
        return dict(self._data) if self._data else {}


class LocalDocumentReference:
    def __init__(self, collection: "LocalCollectionReference", doc_id: str):
        self.collection = collection
        self.id = str(doc_id)

    def get(self) -> LocalDocumentSnapshot:
        data = self.collection._data.get(self.id)
        return LocalDocumentSnapshot(data, self.id)

    def set(self, data: Dict[str, Any], merge: bool = False) -> None:
        if merge and self.id in self.collection._data:
            self.collection._data[self.id].update(data)
        else:
            self.collection._data[self.id] = dict(data)
        self.collection.client.save()

    def update(self, updates: Dict[str, Any]) -> None:
        if self.id in self.collection._data:
            self.collection._data[self.id].update(updates)
            self.collection.client.save()

    def delete(self) -> None:
        self.collection._data.pop(self.id, None)
        self.collection.client.save()


class LocalQuery:
    def __init__(
        self,
        collection: "LocalCollectionReference",
        filters: Optional[List[tuple]] = None,
        limit_val: Optional[int] = None,
    ):
        self.collection = collection
        self.filters = filters or []
        self.limit_val = limit_val

    def where(self, field: str, op: str, value: Any) -> "LocalQuery":
        return LocalQuery(self.collection, self.filters + [(field, op, value)], self.limit_val)

    def limit(self, val: int) -> "LocalQuery":
        return LocalQuery(self.collection, self.filters, val)

    def stream(self) -> List[LocalDocumentSnapshot]:
        docs = []
        for doc_id, data in self.collection._data.items():
            match = True
            for field, op, val in self.filters:
                doc_val = data.get(field)
                if op == "==" and doc_val != val:
                    match = False
                    break
            if match:
                docs.append(LocalDocumentSnapshot(data, doc_id))
        if self.limit_val is not None:
            docs = docs[: self.limit_val]
        return docs


class LocalCollectionReference:
    def __init__(self, name: str, client: "PersistentFirestoreClient"):
        self.name = name
        self.client = client
        self._data: Dict[str, Dict[str, Any]] = {}

    def document(self, doc_id: str) -> LocalDocumentReference:
        return LocalDocumentReference(self, str(doc_id))

    def where(self, field: str, op: str, value: Any) -> LocalQuery:
        return LocalQuery(self).where(field, op, value)

    def limit(self, val: int) -> LocalQuery:
        return LocalQuery(self).limit(val)

    def stream(self) -> List[LocalDocumentSnapshot]:
        return LocalQuery(self).stream()


class PersistentFirestoreClient:
    def __init__(self):
        self._collections: Dict[str, LocalCollectionReference] = {}
        self.load()
        self._seed_if_empty()

    def collection(self, name: str) -> LocalCollectionReference:
        if name not in self._collections:
            self._collections[name] = LocalCollectionReference(name, self)
        return self._collections[name]

    def load(self) -> None:
        if DATA_FILE.exists():
            try:
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                    for col_name, col_data in raw.items():
                        col = self.collection(col_name)
                        col._data = col_data
                return
            except Exception as e:
                logger.warning(f"Error loading local firestore cache: {e}")

    def save(self) -> None:
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            raw = {name: col._data for name, col in self._collections.items()}
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(raw, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.warning(f"Error persisting local firestore cache: {e}")

    def _seed_if_empty(self) -> None:
        problems_col = self.collection("problems")
        if not problems_col._data and SEED_FILE.exists():
            try:
                with open(SEED_FILE, "r", encoding="utf-8") as f:
                    seeds = json.load(f)
                for item in seeds:
                    doc_id = item.get("id")
                    if doc_id:
                        # Normalize seed schema to match ProblemResponse
                        normalized = {
                            "id": doc_id,
                            "card": item.get("card", {}),
                            "card_en": None,
                            "existing_solutions": item.get("existingSolutions", []),
                            "shared": True,
                            "created_at": item.get("createdAt", "2026-10-12T10:00:00Z"),
                            "partial": False,
                            "errors": [],
                        }
                        problems_col._data[doc_id] = normalized
                self.save()
                logger.info(f"Seeded {len(problems_col._data)} problems into local firestore storage.")
            except Exception as e:
                logger.warning(f"Could not load seed problems: {e}")


# Initialize Firebase Admin SDK or local fallback
db = None

google_creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")

if os.path.exists(FIREBASE_KEY_PATH):
    try:
        credential = credentials.Certificate(FIREBASE_KEY_PATH)
        firebase_admin.initialize_app(credential)
        db = firestore.client()
        logger.info("Connected to Google Cloud Firestore with certificate.")
    except Exception as e:
        logger.warning(f"Firebase initialization with certificate failed: {e}")
elif google_creds and os.path.exists(google_creds):
    try:
        credential = credentials.Certificate(google_creds)
        firebase_admin.initialize_app(credential)
        db = firestore.client()
        logger.info("Connected to Google Cloud Firestore with GOOGLE_APPLICATION_CREDENTIALS.")
    except Exception as e:
        logger.warning(f"Firebase initialization with GOOGLE_APPLICATION_CREDENTIALS failed: {e}")

if db is None:
    logger.info("Using local persistent JSON Firestore database.")
    db = PersistentFirestoreClient()
