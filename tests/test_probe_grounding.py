from unittest.mock import MagicMock, patch
import pytest

from scripts.probe_grounding import (
    probe_single_model,
    format_markdown_report,
    ORGANIZER_MESSAGE_TEMPLATE,
)


def test_probe_single_model_success():
    mock_client = MagicMock()
    mock_response = MagicMock()

    # Build mock candidate with grounding metadata
    mock_chunk1 = MagicMock()
    mock_chunk1.web.uri = "https://example.com/energy-meter"
    mock_chunk2 = MagicMock()
    mock_chunk2.web.uri = "https://example.com/smart-plug"

    mock_metadata = MagicMock()
    mock_metadata.web_search_queries = ["energy meter india", "smart plug apps"]
    mock_metadata.grounding_chunks = [mock_chunk1, mock_chunk2]

    mock_candidate = MagicMock()
    mock_candidate.grounding_metadata = mock_metadata

    mock_response.candidates = [mock_candidate]
    mock_response.text = "Commercial tools include Oakter Smart Plug and Schneider Energy Meter."
    mock_client.models.generate_content.return_value = mock_response

    res = probe_single_model(mock_client, "gemini-test-model", "Test prompt")

    assert res["success"] is True
    assert res["model"] == "gemini-test-model"
    assert res["grounding_metadata_present"] is True
    assert res["citations_returned"] is True
    assert res["citation_count"] == 2
    assert "https://example.com/energy-meter" in res["sources"]
    assert res["search_queries"] == ["energy meter india", "smart plug apps"]
    assert res["raw_error"] == ""
    # Verify exactly ONE call was made
    mock_client.models.generate_content.assert_called_once()


def test_probe_single_model_untruncated_error_on_429():
    mock_client = MagicMock()
    very_long_error = (
        "429 RESOURCE_EXHAUSTED: Quota exceeded for quota metric 'GenerateContent' "
        "and limit 'GenerateContent requests per minute' of service 'generativelanguage.googleapis.com' "
        "for consumer 'project_number:1234567890'. Additional diagnostic info: " + ("X" * 300)
    )
    mock_client.models.generate_content.side_effect = RuntimeError(very_long_error)

    res = probe_single_model(mock_client, "gemini-quota-model", "Test prompt")

    assert res["success"] is False
    assert res["model"] == "gemini-quota-model"
    assert res["grounding_metadata_present"] is False
    assert res["citations_returned"] is False
    # Ensure raw_error is completely preserved and NOT truncated
    assert res["raw_error"] == very_long_error
    assert len(res["raw_error"]) > 350
    mock_client.models.generate_content.assert_called_once()


def test_format_markdown_report():
    results = [
        {
            "model": "model-a",
            "success": True,
            "grounding_metadata_present": True,
            "citations_returned": True,
            "citation_count": 3,
            "search_queries": ["query 1"],
            "sources": ["https://source1.com"],
            "response_snippet": "Sample response snippet",
            "raw_error": "",
        },
        {
            "model": "model-b",
            "success": False,
            "grounding_metadata_present": False,
            "citations_returned": False,
            "citation_count": 0,
            "search_queries": [],
            "sources": [],
            "response_snippet": "",
            "raw_error": "404 NOT_FOUND: Model model-b not found or unsupported",
        },
    ]

    report = format_markdown_report(results, prompt_used="Test prompt")

    assert "# Search Grounding Probe Results" in report
    assert "`model-a`" in report
    assert "✅ SUCCESS" in report
    assert "`model-b`" in report
    assert "❌ FAILED" in report
    assert "404 NOT_FOUND" in report
    assert "Ready-to-Send Message to Hackathon Organizers" in report
    assert "HatchMatch" in report
