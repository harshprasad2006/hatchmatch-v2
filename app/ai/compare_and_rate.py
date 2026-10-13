import json
from pathlib import Path
from typing import Any, Dict, List

from pydantic import BaseModel, Field

from app.ai.structure_problem import MODEL, _client
from app.ai.understand_idea import IdeaCard
from app.ai.utils import call_with_retry

PROMPT_PATH = Path(__file__).parent / "prompts" / "compare_and_rate_v1.txt"
MAX_TEXT_CHARS = 1500


class _RawMatch(BaseModel):
    index: int
    similarity: int = Field(ge=0, le=100)
    same: str
    different: str


class FeatureRating(BaseModel):
    feature: str
    found: bool
    found_in: List[int] = Field(default_factory=list)


class _RawComparison(BaseModel):
    matches: List[_RawMatch] = Field(default_factory=list)
    features: List[FeatureRating] = Field(default_factory=list)


class RatedMatch(BaseModel):
    index: int
    type: str
    title: str
    link: str
    similarity: int
    same: str
    different: str


class Comparison(BaseModel):
    matches: List[RatedMatch]
    features: List[FeatureRating]


def _normalize_and_build_comparison(
    raw: _RawComparison,
    idea: IdeaCard,
    matches: List[Dict[str, Any]],
) -> Comparison:
    """
    Stabilizes and validates comparison outputs.
    - Snaps similarities to steps of 5 (0 to 100) for stability.
    - Automatically patches missing indices or features with safe defaults.
    - Filters found_in indices to ensure validity.
    """
    n_matches = len(matches)
    by_index = {}

    for m in raw.matches:
        if 0 <= m.index < n_matches:
            # Snap similarity to steps of 5 for rating stability
            clamped_sim = min(100, max(0, m.similarity))
            stepped_sim = int(round(clamped_sim / 5.0) * 5)
            by_index[m.index] = {
                "similarity": stepped_sim,
                "same": m.same or "Similar problem space.",
                "different": m.different or "Different implementation.",
            }

    rated = []
    for i in range(n_matches):
        match_info = by_index.get(i, {
            "similarity": 20,
            "same": "Related general problem area.",
            "different": "Different approach or insufficient details.",
        })
        rated.append(
            RatedMatch(
                index=i,
                type=matches[i].get("type", "unknown"),
                title=matches[i].get("title", "Untitled Source"),
                link=matches[i].get("link", ""),
                similarity=match_info["similarity"],
                same=match_info["same"],
                different=match_info["different"],
            )
        )

    # Normalize feature ratings
    features_by_name = {f.feature.strip().lower(): f for f in raw.features}
    normalized_features = []

    for feat in idea.features:
        feat_clean = feat.strip().lower()
        if feat_clean in features_by_name:
            f = features_by_name[feat_clean]
            valid_indices = [idx for idx in f.found_in if 0 <= idx < n_matches] if f.found else []
            normalized_features.append(
                FeatureRating(
                    feature=feat,
                    found=f.found and len(valid_indices) > 0,
                    found_in=valid_indices,
                )
            )
        else:
            normalized_features.append(
                FeatureRating(feature=feat, found=False, found_in=[])
            )

    return Comparison(matches=rated, features=normalized_features)


def compare_and_rate(idea: IdeaCard, matches: List[Dict[str, Any]]) -> Comparison:
    """Compare and rate search results with safe normalization."""
    if not matches:
        return Comparison(
            matches=[],
            features=[FeatureRating(feature=f, found=False, found_in=[]) for f in idea.features],
        )

    idea_json = json.dumps(
        {"title": idea.title, "summary": idea.summary, "features": idea.features},
        ensure_ascii=False,
    )
    matches_json = json.dumps(
        [
            {
                "index": i,
"type": m.get("type", "unknown"),
                "title": m.get("title", "Untitled"),
                "text": (m.get("text") or "")[:MAX_TEXT_CHARS],
            }
            for i, m in enumerate(matches)
        ],
        ensure_ascii=False,
    )
    prompt = (
        PROMPT_PATH.read_text(encoding="utf-8")
        .replace("{idea_json}", idea_json)
        .replace("{matches_json}", matches_json)
    )

    client = _client()
    last_error = None

    for _ in range(2):  # parse/validation retries
        try:
            response = call_with_retry(
                lambda: client.chat.completions.create(
                    model=MODEL,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "Return only valid JSON. "
                                "Do not use Markdown code fences."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.1,
                    response_format={"type": "json_object"},
                )
            )
            raw_text = (response.choices[0].message.content or "").strip()
            raw = _RawComparison.model_validate(json.loads(raw_text))
            return _normalize_and_build_comparison(raw, idea, matches)
        except (json.JSONDecodeError, ValueError, TypeError, KeyError) as e:
            last_error = e

    # Safe fallback if AI service fails completely: return baseline comparison without crashing
    fallback_matches = [
        RatedMatch(
            index=i,
            type=matches[i].get("type", "unknown"),
            title=matches[i].get("title", "Untitled Source"),
            link=matches[i].get("link", ""),
            similarity=20,
            same="Related problem domain.",
            different="Detailed comparison could not be completed.",
        )
        for i in range(len(matches))
    ]
    return Comparison(
        matches=fallback_matches,
        features=[FeatureRating(feature=f, found=False, found_in=[]) for f in idea.features],
    )
