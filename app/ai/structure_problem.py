
import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from groq import Groq
from pydantic import BaseModel, ValidationError

from app.ai.utils import call_with_retry, normalize_lang
from app.models.problem import ProblemCard

load_dotenv()

PROMPT_PATH = Path(__file__).parent / "prompts" / "structure_problem_v1.txt"
MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")


class StructuredProblem(BaseModel):
    status: str = "ok"
    language: str
    safe: bool
    card: ProblemCard
    card_en: ProblemCard


def _client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError(
            "GROQ_API_KEY environment variable is not set. "
            "Please set it in your .env file."
        )
    return Groq(api_key=api_key)


def _sanitize_card_data(card_raw: Any, default_title: str = "N/A") -> dict[str, str]:
    card_dict = card_raw if isinstance(card_raw, dict) else {}
    return {
        "title": str(card_dict.get("title") or default_title),
        "who": str(card_dict.get("who") or "N/A"),
        "pain": str(card_dict.get("pain") or "N/A"),
        "frequency": str(card_dict.get("frequency") or "N/A"),
        "workaround": str(card_dict.get("workaround") or "N/A"),
        "category": str(card_dict.get("category") or "Other"),
    }


def structure_problem(raw_text: str) -> StructuredProblem:
    prompt = PROMPT_PATH.read_text(encoding="utf-8").replace(
        "{raw_text}", raw_text
    )
    client = _client()
    last_error = None

    for _ in range(2):
        try:
            response = call_with_retry(
                lambda: client.chat.completions.create(
                    model=MODEL,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "Return only valid JSON matching the requested "
                                "schema. Do not use Markdown code fences."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.2,
                    response_format={"type": "json_object"},
                )
            )

            raw_text_resp = response.choices[0].message.content or ""
            parsed = json.loads(raw_text_resp)

            raw_status = str(parsed.get("status", "")).strip().lower()
            if raw_status in {"ok", "not_a_problem", "unsafe"}:
                status = raw_status
            elif parsed.get("safe") is False:
                status = "unsafe"
            else:
                status = "ok"

            language = normalize_lang(parsed.get("language"))
            safe = status == "ok"

            if status in {"unsafe", "not_a_problem"}:
                card = ProblemCard.model_validate(
                    _sanitize_card_data(parsed.get("card"))
                )
                card_en = ProblemCard.model_validate(
                    _sanitize_card_data(parsed.get("card_en"))
                )
            else:
                card = ProblemCard.model_validate(parsed.get("card", {}))
                card_en = ProblemCard.model_validate(
                    parsed.get("card_en", parsed.get("card", {}))
                )

            return StructuredProblem(
                status=status,
                language=language,
                safe=safe,
                card=card,
                card_en=card_en,
            )

        except (json.JSONDecodeError, ValidationError, TypeError, ValueError) as e:
            last_error = e

    raise ValueError(f"structure_problem failed after retry: {last_error}")
