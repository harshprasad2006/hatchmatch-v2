
from typing import Any


def calculate_uniqueness_score(
    matches: list[dict[str, Any]],
    features: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Calculate a heuristic uniqueness score from existing matches
    and feature-overlap results.

    Each match should contain:
        similarity: integer from 0 to 100

    Each feature should contain:
        found: boolean
    """

    # Validate match similarity values.
    similarities = []

    for match in matches:
        similarity = match.get("similarity", 0)

        if not isinstance(similarity, (int, float)):
            raise ValueError("Similarity must be a number.")

        if not 0 <= similarity <= 100:
            raise ValueError("Similarity must be between 0 and 100.")

        similarities.append(float(similarity))

    # 1. Closest-match deduction: maximum 50 points.
    highest_similarity = max(similarities, default=0)
    closest_match_deduction = 50 * highest_similarity / 100

    # 2. Crowd deduction: maximum 25 points.
    # If no matches exist, there is no crowd deduction.
    if matches:
        crowded_matches = sum(
            similarity >= 70 for similarity in similarities
        )
        crowd_deduction = 25 * crowded_matches / len(matches)
    else:
        crowd_deduction = 0.0

    # 3. Feature-overlap deduction: maximum 25 points.
    if features:
        found_features = sum(
            bool(feature.get("found", False))
            for feature in features
        )
        feature_overlap_deduction = (
            25 * found_features / len(features)
        )
    else:
        feature_overlap_deduction = 0.0

    total_deduction = (
        closest_match_deduction
        + crowd_deduction
        + feature_overlap_deduction
    )

    uniqueness_score = round(
        max(0, min(100, 100 - total_deduction))
    )

    return {
        "uniqueness_score": uniqueness_score,
        "score_breakdown": {
            "closest_match_deduction": round(
                closest_match_deduction, 2
            ),
            "crowd_deduction": round(crowd_deduction, 2),
            "feature_overlap_deduction": round(
                feature_overlap_deduction, 2
            ),
        },
    }
