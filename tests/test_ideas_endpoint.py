from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# Mock Firebase before importing the application.
firebase_patches = [
    patch("firebase_admin.credentials.Certificate"),
    patch("firebase_admin.initialize_app"),
    patch("firebase_admin.firestore.client", return_value=MagicMock()),
]

for p in firebase_patches:
    p.start()

from app.main import app

client = TestClient(app)

IDEA_TEXT = "A platform that helps students discover and evaluate project ideas using AI."


def mock_idea(safe=True):
    return type(
        "MockIdea",
        (),
        {
            "safe": safe,
            "title": "Student Project Evaluator",
            "features": ["Idea analysis", "Solution discovery"],
            "keywords": ["students", "AI"],
        },
    )()



def test_idea_check_returns_valid_report():
    mock_document = MagicMock()

    with (
        patch("app.api.routes.ideas.understand_idea", return_value=mock_idea()),
        patch("app.api.routes.ideas.search_existing_solutions", return_value=[]),
        patch(
            "app.api.routes.ideas.compare_and_rate",
            return_value=type(
                "MockComparison",
                (),
                {"matches": [], "features": []},
            )(),
        ),
        patch(
            "app.api.routes.ideas.reports_collection.document",
            return_value=mock_document,
        ),
    ):
        response = client.post(
            "/api/v1/ideas/check",
            json={"idea_text": IDEA_TEXT},
        )

    assert response.status_code == 200
    data = response.json()

    required_fields = {
        "id",
        "idea_text",
        "idea_card",
        "matches",
        "compare_table",
        "uniqueness_score",
        "score_breakdown",
        "created_at",
    }
    assert required_fields.issubset(data.keys())
    assert 0 <= data["uniqueness_score"] <= 100
    assert data["idea_card"]["title"] == "Student Project Evaluator"

    mock_document.set.assert_called_once()
    saved_report = mock_document.set.call_args.args[0]
    assert saved_report["id"] == data["id"]
    assert saved_report["idea_text"] == IDEA_TEXT



def test_idea_check_rejects_unsafe_idea():
    with patch(
        "app.api.routes.ideas.understand_idea",
        return_value=mock_idea(safe=False),
    ):
        response = client.post(
            "/api/v1/ideas/check",
            json={"idea_text": IDEA_TEXT},
        )

    assert response.status_code == 400


def test_idea_check_returns_502_when_search_fails():
    with (
        patch("app.api.routes.ideas.understand_idea", return_value=mock_idea()),
        patch(
            "app.api.routes.ideas.search_existing_solutions",
            side_effect=RuntimeError("Mocked search failure"),
        ),
    ):
        response = client.post(
            "/api/v1/ideas/check",
            json={"idea_text": IDEA_TEXT},
        )

    assert response.status_code == 502
