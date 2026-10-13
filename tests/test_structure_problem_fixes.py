from unittest.mock import MagicMock, patch
import json
import pytest

# Mock Firebase before importing the application or router
firebase_patches = [
    patch("firebase_admin.credentials.Certificate"),
    patch("firebase_admin.initialize_app"),
    patch("firebase_admin.firestore.client", return_value=MagicMock()),
]
for p in firebase_patches:
    p.start()

from fastapi.testclient import TestClient
from app.main import app
from app.ai.utils import call_with_retry, normalize_lang
from app.ai.structure_problem import structure_problem, StructuredProblem
from app.models.problem import ProblemCard

client = TestClient(app)


# =====================================================================
# 1. Tests for call_with_retry
# =====================================================================

def test_retry_success_after_mocked_503():
    mock_fn = MagicMock()
    mock_fn.side_effect = [
        RuntimeError("503 UNAVAILABLE: The service is temporarily overloaded."),
        {"status": "ok", "text": "success"},
    ]

    with patch("time.sleep") as mock_sleep:
        result = call_with_retry(mock_fn, tries=3, base=1.0)

    assert result == {"status": "ok", "text": "success"}
    assert mock_fn.call_count == 2
    mock_sleep.assert_called_once_with(1.0)  # 1.0 * (2 ** 0)


def test_retry_success_after_mocked_429():
    mock_fn = MagicMock()
    mock_fn.side_effect = [
        RuntimeError("429 RESOURCE_EXHAUSTED: Rate limit exceeded."),
        "recovered",
    ]

    with patch("time.sleep") as mock_sleep:
        result = call_with_retry(mock_fn, tries=3, base=0.5)

    assert result == "recovered"
    assert mock_fn.call_count == 2
    mock_sleep.assert_called_once_with(0.5)


def test_no_retry_for_non_transient_error():
    mock_fn = MagicMock()
    mock_fn.side_effect = ValueError("Invalid json schema format")

    with patch("time.sleep") as mock_sleep:
        with pytest.raises(ValueError) as exc_info:
            call_with_retry(mock_fn, tries=3, base=1.0)

    assert "Invalid json schema format" in str(exc_info.value)
    assert mock_fn.call_count == 1
    mock_sleep.assert_not_called()


def test_retry_exhaustion_reraises():
    mock_fn = MagicMock()
    mock_fn.side_effect = RuntimeError("503 UNAVAILABLE")

    with patch("time.sleep"):
        with pytest.raises(RuntimeError) as exc_info:
            call_with_retry(mock_fn, tries=3, base=0.1)

    assert "503" in str(exc_info.value)
    assert mock_fn.call_count == 3


# =====================================================================
# 2. Tests for normalize_lang
# =====================================================================

@pytest.mark.parametrize(
    "input_label,expected",
    [
        ("en", "en"),
        ("hi", "hi"),
        ("mr", "mr"),
        ("hinglish", "hinglish"),
        (" EN ", "en"),
        ("  Hi  ", "hi"),
        ("Mr", "mr"),
        (" Hinglish\n", "hinglish"),
        ("fr", "mixed"),
        ("spanish", "mixed"),
        ("marathi", "mixed"),
        ("english", "mixed"),
        ("unknown", "mixed"),
        ("", "mixed"),
        ("   ", "mixed"),
        (None, "mixed"),
        (123, "mixed"),
    ],
)
def test_normalize_lang(input_label, expected):
    assert normalize_lang(input_label) == expected


# =====================================================================
# 3. Tests for structure_problem status separation
# =====================================================================

def _mock_gemini_response(response_dict):
    mock_resp = MagicMock()
    import json
    mock_resp.text = json.dumps(response_dict)
    return mock_resp


def test_structure_problem_ok_status():
    sample_data = {
        "status": "ok",
        "language": "hi",
        "safe": True,
        "card": {
            "title": "UPI Payment Delay",
            "who": "Shopkeeper",
            "pain": "Takes long to receive confirmation SMS",
            "frequency": "Daily",
            "workaround": "Checks SMS",
            "category": "Money",
        },
        "card_en": {
            "title": "UPI Payment Delay",
            "who": "Shopkeeper",
            "pain": "Takes long to receive confirmation SMS",
            "frequency": "Daily",
            "workaround": "Checks SMS",
            "category": "Money",
        },
    }

    with patch("app.ai.structure_problem._client") as mock_client:
        mock_instance = MagicMock()
        mock_instance.chat.completions.create.return_value.choices[0].message.content = json.dumps(sample_data)
        mock_client.return_value = mock_instance

        res = structure_problem("meri kirane ki dukan hai...")

    assert res.status == "ok"
    assert res.safe is True
    assert res.language == "hi"
    assert res.card.title == "UPI Payment Delay"


def test_structure_problem_unsafe_status():
    sample_data = {
        "status": "unsafe",
        "language": "hinglish",
        "safe": False,
        "card": {
            "title": "N/A",
            "who": "N/A",
            "pain": "N/A",
            "frequency": "N/A",
            "workaround": "N/A",
            "category": "Other",
        },
        "card_en": {
            "title": "N/A",
            "who": "N/A",
            "pain": "N/A",
            "frequency": "N/A",
            "workaround": "N/A",
            "category": "Other",
        },
    }

    with patch("app.ai.structure_problem._client") as mock_client:
        mock_instance = MagicMock()
        mock_instance.chat.completions.create.return_value.choices[0].message.content = json.dumps(sample_data)
        mock_client.return_value = mock_instance

        res = structure_problem("bank account hack karna hai...")

    assert res.status == "unsafe"
    assert res.safe is False
    assert res.language == "hinglish"


def test_structure_problem_not_a_problem_status():
    sample_data = {
        "status": "not_a_problem",
        "language": "en",
        "safe": False,
        "card": {
            "title": "N/A",
            "who": "N/A",
            "pain": "N/A",
            "frequency": "N/A",
            "workaround": "N/A",
            "category": "Other",
        },
        "card_en": {
            "title": "N/A",
            "who": "N/A",
            "pain": "N/A",
            "frequency": "N/A",
            "workaround": "N/A",
            "category": "Other",
        },
    }

    with patch("app.ai.structure_problem._client") as mock_client:
        mock_instance = MagicMock()
        mock_instance.chat.completions.create.return_value.choices[0].message.content = json.dumps(sample_data)
        mock_client.return_value = mock_instance

        res = structure_problem("hello how are you today?")

    assert res.status == "not_a_problem"
    assert res.safe is False
    assert res.language == "en"


# =====================================================================
# 4. Route tests for /api/v1/problems status codes (400, 422, 200)
# =====================================================================

def _make_structured(status: str):
    card = ProblemCard(
        title="Sample Problem" if status == "ok" else "N/A",
        who="Sample User" if status == "ok" else "N/A",
        pain="Sample Pain" if status == "ok" else "N/A",
        frequency="Daily" if status == "ok" else "N/A",
        workaround="None" if status == "ok" else "N/A",
        category="Money" if status == "ok" else "Other",
    )
    return StructuredProblem(
        status=status,
        language="en",
        safe=(status == "ok"),
        card=card,
        card_en=card,
    )


@patch("app.api.routes.problems.find_solutions", return_value={"solutions": [], "note": ""})
@patch("app.api.routes.problems.problems_collection")
def test_create_problem_route_ok(mock_collection, mock_find):
    mock_doc = MagicMock()
    mock_collection.document.return_value = mock_doc

    with patch("app.api.routes.problems.structure_problem", return_value=_make_structured("ok")):
        response = client.post(
            "/api/v1/problems",
            json={"raw_text": "Students in my college struggle to find authentic problem statements"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["id"]
    assert data["card"]["title"] == "Sample Problem"
    mock_doc.set.assert_called_once()


def test_create_problem_route_unsafe_returns_400():
    with patch("app.api.routes.problems.structure_problem", return_value=_make_structured("unsafe")):
        response = client.post(
            "/api/v1/problems",
            json={"raw_text": "How can I hack into someone's bank account illegally?"},
        )

    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "This content could not be processed safely."


def test_create_problem_route_not_a_problem_returns_422():
    with patch("app.api.routes.problems.structure_problem", return_value=_make_structured("not_a_problem")):
        response = client.post(
            "/api/v1/problems",
            json={"raw_text": "Hello, the weather is very pleasant today, let us have some tea."},
        )

    assert response.status_code == 422
    data = response.json()
    assert data["detail"] == "Please describe a real problem you face."
