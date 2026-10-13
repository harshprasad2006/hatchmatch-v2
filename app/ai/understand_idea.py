
import json
from pathlib import Path

from pydantic import BaseModel, Field, ValidationError

from app.ai.structure_problem import MODEL, _client
from app.ai.utils import call_with_retry

PROMPT_PATH = Path(__file__).parent / "prompts" / "understand_idea_v1.txt"


class IdeaCard(BaseModel):
    safe: bool
    title: str
    summary: str
    features: list[str] = Field(max_length=5)
    keywords: list[str]


def understand_idea(idea_text: str) -> IdeaCard:
    prompt = PROMPT_PATH.read_text(encoding="utf-8").replace(
        "{idea_text}", idea_text
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
                                "Return only valid JSON. "
                                "Do not use Markdown code fences."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.2,
                    response_format={"type": "json_object"},
                )
            )

            raw_text = (response.choices[0].message.content or "").strip()

            return IdeaCard.model_validate(json.loads(raw_text))

        except (json.JSONDecodeError, ValidationError, TypeError, ValueError) as e:
            last_error = e

    raise ValueError(f"understand_idea failed after retry: {last_error}")
