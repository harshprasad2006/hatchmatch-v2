
from app.services.scoring_service import calculate_uniqueness_score


def test_empty_results_give_100():
    result = calculate_uniqueness_score([], [])

    assert result["uniqueness_score"] == 100
    assert result["score_breakdown"]["closest_match_deduction"] == 0
    assert result["score_breakdown"]["crowd_deduction"] == 0
    assert result["score_breakdown"]["feature_overlap_deduction"] == 0


def test_score_with_matches_and_features():
    result = calculate_uniqueness_score(
        [{"similarity": 80}, {"similarity": 40}],
        [{"found": True}, {"found": False}],
    )

    assert result["uniqueness_score"] == 35
    assert result["score_breakdown"]["closest_match_deduction"] == 40
    assert result["score_breakdown"]["crowd_deduction"] == 12.5
    assert result["score_breakdown"]["feature_overlap_deduction"] == 12.5


def test_perfect_match_gives_zero():
    result = calculate_uniqueness_score(
        [{"similarity": 100}],
        [{"found": True}],
    )

    assert result["uniqueness_score"] == 0


def test_invalid_similarity_is_rejected():
    try:
        calculate_uniqueness_score([{"similarity": 120}], [])
    except ValueError:
        pass
    else:
        raise AssertionError("Expected invalid similarity to raise ValueError")
