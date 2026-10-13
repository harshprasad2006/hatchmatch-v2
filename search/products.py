import json
import os
from typing import Dict, List, NamedTuple
from urllib.parse import quote_plus
from dotenv import load_dotenv

from groq import Groq

from app.ai.utils import call_with_retry

load_dotenv()

class ProductResult(NamedTuple):
    items: List[Dict]
    note: str


PROMPT_TEMPLATE = """You are an expert product analyst.
Given the following user problem or startup idea, name up to 3 well-known existing commercial apps, platforms, products, or tools that address this or related spaces.

Problem / Idea:
{query}

Return ONLY valid JSON in exactly this format with no markdown fences:
[
  {{"name": "App or Product Name", "summary": "One-line summary of what it does and how it relates."}}
]

Rules:
- List up to 3 real, well-known products.
- Do NOT provide any URLs or websites. Any URLs provided will be discarded.
- If none exist or you are unsure, return an empty array [].
"""


def fetch_products(query: str, limit: int = 3) -> ProductResult:
    """Suggest existing products using Groq. Links are built in code."""
    if not query or not query.strip():
        return ProductResult([], "Query is empty.")

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return ProductResult([], "GROQ_API_KEY is not set in environment.")

    model_name = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    prompt = PROMPT_TEMPLATE.format(query=query.strip())

    try:
        client = Groq(api_key=api_key)

        response = call_with_retry(
            lambda: client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Return only valid JSON. Do not use Markdown fences. "
                            "Return a JSON array of product objects."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
            )
        )

        raw_text = (response.choices[0].message.content or "").strip()
        parsed = json.loads(raw_text)

        # Accept either a JSON array or an object containing a products array.
        if isinstance(parsed, dict):
            parsed = parsed.get("products", [])

        if not isinstance(parsed, list):
            return ProductResult(
                [],
                f"Malformed response: expected JSON list, got {type(parsed).__name__}",
            )

        products = []
        for item in parsed[:limit]:
            if not isinstance(item, dict):
                continue

            name = str(item.get("name") or "").strip()
            if not name:
                continue

            summary = str(item.get("summary") or "").strip()
            link = f"https://www.google.com/search?q={quote_plus(name)}"

            products.append(
                {
                    "name": name,
                    "summary": summary,
                    "link": link,
                    "source": "AI-suggested, please verify",
                }
            )

        note = "" if products else "No products suggested by model."
        return ProductResult(products, note)

    except Exception as exc:
        return ProductResult([], f"Product discovery failed: {exc}")
