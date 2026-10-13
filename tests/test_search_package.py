from unittest.mock import MagicMock, patch
import json
import pytest

from search.papers import fetch_papers, PaperResult
from search.patents import fetch_patents, PatentResult, build_google_patents_fallback_link
from search.products import fetch_products, ProductResult


# =====================================================================
# 1. Tests for search/papers.py (OpenAlex)
# =====================================================================

def test_papers_success():
    mock_data = {
        "results": [
            {
                "title": "Smart Metering and IoT for Energy Conservation",
                "authorships": [
                    {"author": {"display_name": "Dr. Sharma"}},
                    {"author": {"display_name": "Prof. Rao"}},
                ],
                "publication_year": 2024,
                "doi": "https://doi.org/10.1016/j.iot.2024.01",
                "id": "https://openalex.org/W123456",
            }
        ]
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_data

    with patch("os.getenv", return_value="mock_openalex_key"), \
         patch("requests.get", return_value=mock_resp):
        res = fetch_papers("smart energy metering", limit=5)

    assert isinstance(res, PaperResult)
    assert len(res.items) == 1
    item = res.items[0]
    assert item["title"] == "Smart Metering and IoT for Energy Conservation"
    assert item["authors"] == "Dr. Sharma, Prof. Rao"
    assert item["year"] == 2024
    assert item["doi"] == "https://doi.org/10.1016/j.iot.2024.01"
    assert item["url"] == "https://doi.org/10.1016/j.iot.2024.01"
    assert res.note == ""


def test_papers_missing_api_key():
    with patch("os.getenv", return_value=None):
        res = fetch_papers("energy monitoring")

    assert res.items == []
    assert "OPENALEX_API_KEY is not set" in res.note


def test_papers_api_failure():
    mock_resp = MagicMock()
    mock_resp.status_code = 500
    mock_resp.text = "Internal Server Error"

    with patch("os.getenv", return_value="mock_key"), \
         patch("requests.get", return_value=mock_resp):
        res = fetch_papers("query")

    assert res.items == []
    assert "HTTP 500" in res.note


def test_papers_network_exception():
    with patch("os.getenv", return_value="mock_key"), \
         patch("requests.get", side_effect=RuntimeError("Connection reset")):
        res = fetch_papers("query")

    assert res.items == []
    assert "Connection reset" in res.note


def test_papers_malformed_json():
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.side_effect = ValueError("Invalid JSON format")

    with patch("os.getenv", return_value="mock_key"), \
         patch("requests.get", return_value=mock_resp):
        res = fetch_papers("query")

    assert res.items == []
    assert "OpenAlex API call failed" in res.note


# =====================================================================
# 2. Tests for search/patents.py (BigQuery + Fallback Link)
# =====================================================================

def test_patents_success():
    mock_row = {
        "publication_number": "US-11223344-B2",
        "title_localized": "IoT Smart Energy Monitoring System",
        "publication_date": "2023-05-12",
        "abstract_localized": "A wireless energy monitoring apparatus using sensors...",
    }

    mock_client = MagicMock()
    mock_job = MagicMock()
    mock_job.result.return_value = [mock_row]
    mock_client.query.return_value = mock_job

    with patch("google.cloud.bigquery.Client", return_value=mock_client), \
         patch("google.cloud.bigquery.QueryJobConfig") as mock_config_cls:
        res = fetch_patents("IoT smart energy monitoring", limit=5)

    assert isinstance(res, PatentResult)
    assert len(res.items) == 1
    item = res.items[0]
    assert item["number"] == "US-11223344-B2"
    assert item["title"] == "IoT Smart Energy Monitoring System"
    assert item["link"] == "https://patents.google.com/patent/US-11223344-B2/en"
    assert res.note == ""


def test_patents_bigquery_failure_returns_fallback_link():
    # When BigQuery fails (e.g. no GCP ADC credentials in sandbox), MUST return Google Patents search link
    with patch("google.cloud.bigquery.Client", side_effect=Exception("No GCP credentials")):
        res = fetch_patents("solar panel cleaning robot")

    assert isinstance(res, PatentResult)
    assert len(res.items) == 1
    fallback = res.items[0]
    assert "Google Patents" in fallback["title"]
    assert "https://patents.google.com/?q=solar+panel+cleaning+robot" in fallback["link"]
    assert "Fallback Google Patents link provided" in res.note


def test_patents_empty_query():
    res = fetch_patents("")
    assert len(res.items) == 1
    assert "https://patents.google.com/" in res.items[0]["link"]
    assert "empty" in res.note.lower()


def test_patents_bytes_billed_guard_configured():
    mock_client = MagicMock()
    mock_job = MagicMock()
    mock_job.result.return_value = []
    mock_client.query.return_value = mock_job

    with patch("google.cloud.bigquery.Client", return_value=mock_client), \
         patch("google.cloud.bigquery.QueryJobConfig") as mock_config_cls:
        res = fetch_patents("energy", max_bytes_billed=1024 * 1024)

    mock_config_cls.assert_called_once_with(maximum_bytes_billed=1024 * 1024)



# =====================================================================
# 3. Tests for search/products.py (Groq + Code URL synthesis)
# =====================================================================

def test_products_success_and_url_hallucination_prevention():
    model_output = [
        {
            "name": "Schneider Wiser Energy",
            "summary": "Smart home monitoring app for electrical load and energy efficiency.",
            "url": "https://fake-url-that-must-be-ignored.com/sc",
        },
        {
            "name": "Oakter Smart Plug",
            "summary": "WiFi-enabled smart plug tracking consumption for individual appliances.",
        },
    ]

    mock_resp = MagicMock()
    mock_resp.choices[0].message.content = json.dumps(model_output)

    with patch("os.getenv") as mock_env, \
         patch("search.products.Groq") as mock_groq_cls:
        mock_env.side_effect = lambda k, default=None: (
            "mock_groq_key" if k == "GROQ_API_KEY" else default
        )

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_resp
        mock_groq_cls.return_value = mock_client

        res = fetch_products("track home electricity consumption")

    assert isinstance(res, ProductResult)
    assert len(res.items) == 2

    first = res.items[0]
    assert first["name"] == "Schneider Wiser Energy"
    assert first["summary"] == (
        "Smart home monitoring app for electrical load and energy efficiency."
    )
    assert first["link"] == (
        "https://www.google.com/search?q=Schneider+Wiser+Energy"
    )
    assert "fake-url" not in first["link"]
    assert first["source"] == "AI-suggested, please verify"

    second = res.items[1]
    assert second["name"] == "Oakter Smart Plug"
    assert second["link"] == (
        "https://www.google.com/search?q=Oakter+Smart+Plug"
    )
    assert second["source"] == "AI-suggested, please verify"
    assert res.note == ""



def test_products_missing_gemini_api_key():
    with patch("os.getenv", return_value=None), \
         patch.dict("os.environ", {}, clear=True), \
         patch("search.products.Groq") as mock_groq_cls:
        res = fetch_products("query")

    assert res.items == []
    assert "GROQ_API_KEY is not set" in res.note
    mock_groq_cls.assert_not_called()




def test_products_api_failure():
    with patch("os.getenv") as mock_env, \
         patch("search.products.Groq") as mock_groq_cls:
        mock_env.side_effect = lambda k, default=None: (
            "mock_groq_key" if k == "GROQ_API_KEY" else default
        )

        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = RuntimeError(
            "Quota exhausted"
        )
        mock_groq_cls.return_value = mock_client

        res = fetch_products("query")

    assert res.items == []
    assert "Product discovery failed" in res.note


def test_products_malformed_json():
    mock_resp = MagicMock()
    mock_resp.choices[0].message.content = (
        "This is not valid json response"
    )

    with patch("os.getenv") as mock_env, \
         patch("search.products.Groq") as mock_groq_cls:
        mock_env.side_effect = lambda k, default=None: (
            "mock_groq_key" if k == "GROQ_API_KEY" else default
        )

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_resp
        mock_groq_cls.return_value = mock_client

        res = fetch_products("query")

    assert res.items == []
    assert "Product discovery failed" in res.note
