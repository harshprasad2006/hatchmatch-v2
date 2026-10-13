from unittest.mock import patch
import pytest

from app.ai.find_solutions import find_solutions
from app.models.problem import ProblemCard
from search.papers import PaperResult
from search.patents import PatentResult
from search.products import ProductResult


def test_find_solutions_happy_path_combines_sources():
    mock_products = ProductResult(
        [
            {
                "name": "Schneider Wiser",
                "summary": "Commercial energy management tool.",
                "link": "https://www.google.com/search?q=Schneider+Wiser",
                "source": "AI-suggested, please verify",
            }
        ],
        "",
    )
    mock_papers = PaperResult(
        [
            {
                "title": "Smart Energy Metering via IoT",
                "authors": "Dr. Sharma et al.",
                "year": 2024,
                "doi": "https://doi.org/10.1016/sample",
                "url": "https://doi.org/10.1016/sample",
            }
        ],
        "",
    )
    mock_patents = PatentResult(
        [
            {
                "title": "Apparatus for Automated Energy Monitoring",
                "number": "US-123456",
                "date": "2023-01-01",
                "link": "https://patents.google.com/patent/US-123456/en",
                "abstract": "A sensor-based monitoring system.",
            }
        ],
        "",
    )

    with patch("app.ai.find_solutions.fetch_products", return_value=mock_products), \
         patch("app.ai.find_solutions.fetch_papers", return_value=mock_papers), \
         patch("app.ai.find_solutions.fetch_patents", return_value=mock_patents):
        res = find_solutions("high electricity bills at home")

    assert "solutions" in res
    assert "note" in res
    solutions = res["solutions"]
    assert len(solutions) == 3

    # Check exact agreed schema
    for sol in solutions:
        assert set(sol.keys()) == {"name", "summary", "link", "source"}
        assert sol["source"] == "ai_suggested"
        assert sol["link"].startswith("https://")

    assert solutions[0]["name"] == "Schneider Wiser"
    assert solutions[1]["name"] == "Smart Energy Metering via IoT"
    assert solutions[2]["name"] == "Apparatus for Automated Energy Monitoring"
    assert res["note"] == ""


def test_find_solutions_graceful_partial_failure():
    mock_products = ProductResult(
        [
            {
                "name": "Oakter Smart Plug",
                "summary": "Tracks individual appliance electricity consumption.",
                "link": "https://www.google.com/search?q=Oakter+Smart+Plug",
                "source": "AI-suggested, please verify",
            }
        ],
        "",
    )
    # Papers fails completely
    mock_papers = PaperResult([], "OpenAlex API service unavailable (503)")
    # Patents fails BigQuery and returns fallback Google Patents link
    mock_patents = PatentResult(
        [
            {
                "title": "Google Patents Search: high electricity bills",
                "number": "",
                "date": "",
                "link": "https://patents.google.com/?q=high+electricity+bills",
                "abstract": "Search query on Google Patents.",
            }
        ],
        "BigQuery sandbox connection timed out. Fallback Google Patents link provided.",
    )

    with patch("app.ai.find_solutions.fetch_products", return_value=mock_products), \
         patch("app.ai.find_solutions.fetch_papers", return_value=mock_papers), \
         patch("app.ai.find_solutions.fetch_patents", return_value=mock_patents):
        res = find_solutions("high electricity bills")

    assert len(res["solutions"]) == 2
    assert res["solutions"][0]["name"] == "Oakter Smart Plug"
    assert res["solutions"][1]["link"].startswith("https://patents.google.com")


def test_find_solutions_returns_empty_and_note_when_nothing_found():
    empty_products = ProductResult([], "")
    empty_papers = PaperResult([], "")
    empty_patents = PatentResult([], "")

    with patch("app.ai.find_solutions.fetch_products", return_value=empty_products), \
         patch("app.ai.find_solutions.fetch_papers", return_value=empty_papers), \
         patch("app.ai.find_solutions.fetch_patents", return_value=empty_patents):
        res = find_solutions("extremely obscure or nonsensical problem description")

    assert res["solutions"] == []
    assert res["note"] == "No clear match found"


def test_find_solutions_supports_problem_card_input():
    card = ProblemCard(
        title="High Electricity Bill",
        who="Homeowner",
        pain="Monthly electricity bill is unusually high but not sure which device causes it",
        frequency="Monthly",
        workaround="Checks meter",
        category="Home",
    )

    mock_products = ProductResult(
        [{"name": "Sense Energy Monitor", "summary": "Home monitor", "link": "https://www.google.com/search?q=Sense", "source": "ai_suggested"}],
        "",
    )

    with patch("app.ai.find_solutions.fetch_products", return_value=mock_products), \
         patch("app.ai.find_solutions.fetch_papers", return_value=PaperResult([], "")), \
         patch("app.ai.find_solutions.fetch_patents", return_value=PatentResult([], "")) as mock_pat:
        res = find_solutions(card)

    assert len(res["solutions"]) == 1
    assert res["solutions"][0]["name"] == "Sense Energy Monitor"
    # Ensure search was called with title and pain
    mock_pat.assert_called_once()
    called_query = mock_pat.call_args[0][0]
    assert "High Electricity Bill" in called_query
    assert "Monthly electricity bill" in called_query
