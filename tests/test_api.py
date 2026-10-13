
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_check():
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_create_problem_rejects_short_text():
    response = client.post(
        "/api/v1/problems",
        json={"raw_text": "Too short", "language": "auto"},
    )

    assert response.status_code == 422


@patch("app.api.routes.problems.find_solutions", return_value={"solutions": [], "note": ""})
@patch("app.api.routes.problems.structure_problem")
@patch("app.api.routes.problems.problems_collection")
def test_create_problem_saves_to_database(mock_collection, mock_structure, mock_find):
    from app.models.problem import ProblemCard
    mock_document = MagicMock()
    mock_collection.document.return_value = mock_document

    mock_card = ProblemCard(
        title="Example problem",
        who="People experiencing this issue",
        pain="Streetlights in my area stop working frequently",
        frequency="Not yet assessed",
        workaround="Not yet assessed",
        category="Uncategorized",
    )
    mock_structure.return_value = MagicMock(
        status="ok",
        safe=True,
        card=mock_card,
        card_en=mock_card,
    )

    response = client.post(
        "/api/v1/problems",
        json={
            "raw_text": "Streetlights in my area stop working frequently",
            "language": "English",
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert data["id"]
    assert data["shared"] is False
    assert data["created_at"]
    assert "T" in data["created_at"]
    assert data["card"]["pain"] == mock_card.pain

    mock_structure.assert_called_once_with(
        "Streetlights in my area stop working frequently"
    )
    mock_collection.document.assert_called_once_with(data["id"])
    mock_document.set.assert_called_once()


@patch("app.api.routes.problems.problems_collection")
def test_share_existing_problem(mock_collection):
    mock_document = MagicMock()
    mock_snapshot = MagicMock()
    mock_snapshot.exists = True

    mock_collection.document.return_value = mock_document
    mock_document.get.return_value = mock_snapshot

    response = client.post("/api/v1/problems/problem-123/share")

    assert response.status_code == 200
    assert response.json()["shared"] is True
    mock_document.update.assert_called_once_with({"shared": True})


@patch("app.api.routes.problems.problems_collection")
def test_share_missing_problem_returns_404(mock_collection):
    mock_document = MagicMock()
    mock_snapshot = MagicMock()
    mock_snapshot.exists = False

    mock_collection.document.return_value = mock_document
    mock_document.get.return_value = mock_snapshot

    response = client.post("/api/v1/problems/missing-id/share")

    assert response.status_code == 404
    assert response.json()["detail"] == "Problem not found"
    mock_document.update.assert_not_called()


@patch("app.api.routes.problems.problems_collection")
def test_list_shared_problems(mock_collection):
    first_document = MagicMock()
    first_document.to_dict.return_value = {
        "id": "problem-1",
        "shared": True,
    }

    second_document = MagicMock()
    second_document.to_dict.return_value = {
        "id": "problem-2",
        "shared": True,
    }

    mock_collection.where.return_value.stream.return_value = [
        first_document,
        second_document,
    ]

    response = client.get("/api/v1/problems")

    assert response.status_code == 200
    assert len(response.json()["problems"]) == 2
    mock_collection.where.assert_called_once_with(
        "shared", "==", True
    )


@patch("app.api.routes.reports.reports_collection")
def test_get_missing_report_returns_404(mock_collection):
    mock_doc = MagicMock()
    mock_snap = MagicMock()
    mock_snap.exists = False
    mock_collection.document.return_value = mock_doc
    mock_doc.get.return_value = mock_snap

    response = client.get(
        "/api/v1/reports/nonexistent-report-id"
    )

    assert response.status_code == 404


@patch("app.api.routes.reports.reports_collection")
def test_get_existing_report(mock_collection):
    mock_document = MagicMock()
    mock_snapshot = MagicMock()

    mock_snapshot.exists = True
    mock_snapshot.to_dict.return_value = {
        "id": "report-123",
        "idea_text": "A platform to evaluate student project ideas",
        "idea_card": {
            "title": "Student Idea Evaluator",
            "main_features": [
                "Idea analysis",
                "Solution discovery",
            ],
            "keywords": ["students", "innovation"],
        },
        "matches": [],
        "compare_table": [],
        "uniqueness_score": 75,
        "score_breakdown": {
            "closest_match_deduction": 10.0,
            "crowd_deduction": 5.0,
            "feature_overlap_deduction": 10.0,
        },
        "created_at": "2026-10-11T00:00:00Z",
    }

    mock_collection.document.return_value = mock_document
    mock_document.get.return_value = mock_snapshot

    response = client.get("/api/v1/reports/report-123")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "report-123"
    assert data["uniqueness_score"] == 75
    assert data["idea_card"]["title"] == "Student Idea Evaluator"


@patch("app.api.routes.reports.reports_collection")
def test_get_report_database_error(mock_collection):
    mock_collection.document.side_effect = Exception(
        "Database unavailable"
    )

    response = client.get("/api/v1/reports/report-123")

    assert response.status_code == 500


@patch("app.api.routes.reports.reports_collection")
def test_save_report_to_database(mock_collection):
    mock_document = MagicMock()
    mock_collection.document.return_value = mock_document

    report_data = {
        "id": "report-save-123",
        "idea_text": "A platform to evaluate student project ideas",
        "idea_card": {
            "title": "Student Idea Evaluator",
            "main_features": [
                "Idea analysis",
                "Solution discovery",
            ],
            "keywords": ["students", "innovation"],
        },
        "matches": [],
        "compare_table": [],
        "uniqueness_score": 75,
        "score_breakdown": {
            "closest_match_deduction": 10.0,
            "crowd_deduction": 5.0,
            "feature_overlap_deduction": 10.0,
        },
        "created_at": "2026-10-11T00:00:00Z",
    }

    response = client.post(
        "/api/v1/reports",
        json=report_data,
    )

    assert response.status_code == 201
    assert response.json()["id"] == "report-save-123"

    mock_collection.document.assert_called_once_with(
        "report-save-123"
    )
    mock_document.set.assert_called_once_with(report_data)

@patch("app.api.routes.problems.find_solutions", return_value={"solutions": [], "note": ""})
@patch("app.api.routes.problems.structure_problem")
@patch("app.api.routes.problems.problems_collection")
def test_create_problem_database_error(mock_collection, mock_structure, mock_find):
    from app.models.problem import ProblemCard
    mock_collection.document.side_effect = Exception(
        "Database unavailable"
    )
    mock_card = ProblemCard(
        title="Example problem",
        who="People experiencing this issue",
        pain="Streetlights in my area stop working frequently",
        frequency="Not yet assessed",
        workaround="Not yet assessed",
        category="Uncategorized",
    )
    mock_structure.return_value = MagicMock(
        status="ok",
        safe=True,
        card=mock_card,
        card_en=mock_card,
    )

    response = client.post(
        "/api/v1/problems",
        json={
            "raw_text": "Streetlights in my area stop working frequently",
            "language": "English",
        },
    )

    assert response.status_code == 500
    assert response.json()["detail"] == (
        "Unable to save problem right now"
    )

