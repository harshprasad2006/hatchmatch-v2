from unittest.mock import MagicMock, patch
import pytest

from fastapi.testclient import TestClient

# Mock Firebase before importing app
firebase_patches = [
    patch("firebase_admin.credentials.Certificate"),
    patch("firebase_admin.initialize_app"),
    patch("firebase_admin.firestore.client", return_value=MagicMock()),
]
for p in firebase_patches:
    p.start()

from app.main import app
from app.ai.compare_and_rate import compare_and_rate
from app.ai.understand_idea import IdeaCard
from app.models.problem import ProblemCard, ProblemResponse
from app.models.report import IdeaReport
from app.services.cache_service import compute_input_hash, normalize_text_for_cache
from app.services.search_service import search_existing_solutions

client = TestClient(app)


# =====================================================================
# 1. Problem endpoint solution mapping & failure resilience
# =====================================================================

@patch("app.api.routes.problems.problems_collection")
@patch("app.api.routes.problems.find_solutions")
@patch("app.api.routes.problems.structure_problem")
def test_create_problem_maps_solutions(mock_structure, mock_find, mock_collection):
    mock_doc = MagicMock()
    mock_collection.document.return_value = mock_doc

    card = ProblemCard(
        title="High electricity bill",
        who="Homeowner",
        pain="Bill is unexpectedly high every month",
        frequency="Monthly",
        workaround="Checks meter",
        category="Home",
    )
    mock_structure.return_value = MagicMock(
        status="ok",
        safe=True,
        card=card,
        card_en=card,
    )
    mock_find.return_value = {
        "solutions": [
            {
                "name": "Sense Energy Monitor",
                "summary": "Real-time whole-home electricity tracking device.",
                "link": "https://www.google.com/search?q=Sense+Energy+Monitor",
                "source": "ai_suggested",
            }
        ],
        "note": "",
    }

    response = client.post(
        "/api/v1/problems",
        json={"raw_text": "Our monthly electricity bill is unexpectedly high every month."},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["existing_solutions"]) == 1
    sol = data["existing_solutions"][0]
    assert sol["name"] == "Sense Energy Monitor"
    assert sol["summary"] == "Real-time whole-home electricity tracking device."
    assert sol["link"].startswith("https://")
    assert data["partial"] is False
    assert data["errors"] == []


@patch("app.api.routes.problems.problems_collection")
@patch("app.api.routes.problems.find_solutions")
@patch("app.api.routes.problems.structure_problem")
def test_create_problem_graceful_on_search_provider_failure(mock_structure, mock_find, mock_collection):
    mock_doc = MagicMock()
    mock_collection.document.return_value = mock_doc

    card = ProblemCard(
        title="Cold storage problem",
        who="Farmer",
        pain="Tomatoes spoil quickly without cold room",
        frequency="Daily",
        workaround="Sells cheap",
        category="Work",
    )
    mock_structure.return_value = MagicMock(
        status="ok",
        safe=True,
        card=card,
        card_en=card,
    )
    # Search provider raises an exception
    mock_find.side_effect = RuntimeError("OpenAlex and BigQuery network timeout")

    response = client.post(
        "/api/v1/problems",
        json={"raw_text": "Tomatoes spoil quickly without cold storage on farm."},
    )

    # Problem is still saved with 200 and card preserved!
    assert response.status_code == 200
    data = response.json()
    assert data["card"]["title"] == "Cold storage problem"
    assert data["existing_solutions"] == []
    assert data["partial"] is True
    assert "Solution lookup temporarily unavailable." in data["errors"]
    mock_doc.set.assert_called_once()


# =====================================================================
# 2. Ideas endpoint fallback search & grounding configuration
# =====================================================================

@patch("app.services.search_service.USE_GROUNDING", False)
@patch("app.services.search_service._search_category_grounded")
@patch("app.services.search_service.fetch_products")
@patch("app.services.search_service.fetch_papers")
@patch("app.services.search_service.fetch_patents")
def test_ideas_search_uses_fallback_when_grounding_disabled(
    mock_patents, mock_papers, mock_products, mock_grounded
):
    from search.products import ProductResult
    from search.papers import PaperResult
    from search.patents import PatentResult

    mock_products.return_value = ProductResult(
        [{"name": "Tool A", "summary": "Tool summary", "link": "https://google.com/search?q=Tool+A", "source": "ai_suggested"}],
        "",
    )
    mock_papers.return_value = PaperResult([], "")
    mock_patents.return_value = PatentResult([], "")

    results = search_existing_solutions("A mobile tool to manage crops")

    # When USE_GROUNDING is False, grounded category search must NEVER be called!
    mock_grounded.assert_not_called()
    assert len(results) == 1
    assert results[0]["type"] == "product"
    assert results[0]["title"] == "Tool A"


# =====================================================================
# 3. compare_and_rate stability tests
# =====================================================================

def test_compare_and_rate_empty_matches():
    idea = IdeaCard(
        safe=True,
        title="Student Evaluator",
        summary="Evaluates project ideas",
        features=["Feature 1", "Feature 2"],
        keywords=["student"],
    )

    comp = compare_and_rate(idea, [])

    assert comp.matches == []
    assert len(comp.features) == 2
    assert all(not f.found for f in comp.features)


def test_compare_and_rate_malformed_ai_response_uses_safe_fallback():
    idea = IdeaCard(
        safe=True,
        title="Smart Agriculture",
        summary="Sensors for soil",
        features=["Soil moisture sensor"],
        keywords=["agriculture"],
    )
    matches = [
        {"type": "product", "title": "AgriSensor", "link": "https://google.com/search?q=AgriSensor", "text": "Soil sensing app"}
    ]

    with patch("app.ai.compare_and_rate._client") as mock_client:
        mock_instance = MagicMock()
        mock_resp = MagicMock()
        mock_resp.text = "NOT JSON RESPONSE"
        mock_instance.models.generate_content.return_value = mock_resp
        mock_client.return_value = mock_instance

        comp = compare_and_rate(idea, matches)

    assert len(comp.matches) == 1
    assert comp.matches[0].title == "AgriSensor"
    assert comp.matches[0].similarity == 20
    assert len(comp.features) == 1


# =====================================================================
# 4. SHA-256 caching & cache isolation
# =====================================================================

def test_normalize_text_and_compute_hash():
    t1 = "  A Platform   For Student Projects!  "
    t2 = "a platform for student projects!"
    assert normalize_text_for_cache(t1) == normalize_text_for_cache(t2)
    assert compute_input_hash(t1) == compute_input_hash(t2)


@patch("app.api.routes.ideas.reports_collection")
@patch("app.api.routes.ideas.search_existing_solutions", return_value=[])
@patch("app.api.routes.ideas.compare_and_rate")
@patch("app.api.routes.ideas.understand_idea")
def test_ideas_cache_hit_avoids_recalculating(
    mock_understand, mock_compare, mock_search, mock_collection
):
    mock_understand.return_value = IdeaCard(
        safe=True,
        title="Idea 1",
        summary="Summary 1",
        features=["F1"],
        keywords=["K1"],
    )
    mock_compare.return_value = type("MockComp", (), {"matches": [], "features": []})()

    # Configure mock collection for cache check: miss on 1st call, hit on 2nd call
    cached_doc = MagicMock()
    cached_doc.to_dict.return_value = {
        "id": "cached-report-id",
        "idea_text": "A platform for students",
        "idea_card": {"title": "Idea 1", "main_features": ["F1"], "keywords": ["K1"]},
        "matches": [],
        "compare_table": [],
        "uniqueness_score": 90,
        "score_breakdown": {
            "closest_match_deduction": 0.0,
            "crowd_deduction": 0.0,
            "feature_overlap_deduction": 0.0,
        },
        "created_at": "2026-10-12T00:00:00Z",
        "partial": False,
        "errors": [],
    }

    mock_query = MagicMock()
    # 1st call: empty generator (cache miss)
    mock_query.stream.return_value = iter([])
    mock_collection.where.return_value.limit.return_value = mock_query

    resp1 = client.post(
        "/api/v1/ideas/check",
        json={"idea_text": "A platform for students"},
    )
    assert resp1.status_code == 200
    assert mock_understand.call_count == 1

    # 2nd call: returns cached_doc (cache hit)
    mock_query.stream.return_value = iter([cached_doc])

    resp2 = client.post(
        "/api/v1/ideas/check",
        json={"idea_text": "  a PLATFORM   for students  "},  # Normalized variation
    )
    assert resp2.status_code == 200
    assert resp2.json()["id"] == "cached-report-id"
    # assert understand_idea was NOT called again!
    assert mock_understand.call_count == 1
