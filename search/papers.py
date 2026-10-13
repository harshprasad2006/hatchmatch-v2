import os
from typing import Dict, List, NamedTuple
import requests


OPENALEX_BASE_URL = "https://api.openalex.org/works"


class PaperResult(NamedTuple):
    items: List[Dict]
    note: str


def fetch_papers(query: str, limit: int = 5, timeout: float = 8.0) -> PaperResult:
    """
    Searches academic papers via OpenAlex API.
    Reads OPENALEX_API_KEY from environment.
    Never raises exceptions to the caller; returns empty list and note on failure.
    """
    if not query or not query.strip():
        return PaperResult([], "Query is empty.")

    api_key = os.getenv("OPENALEX_API_KEY")
    if not api_key:
        return PaperResult([], "OPENALEX_API_KEY is not set in environment.")

    params = {
        "search": query.strip(),
        "per-page": limit,
        "api_key": api_key,
    }

    try:
        response = requests.get(
            OPENALEX_BASE_URL,
            params=params,
            timeout=timeout,
            headers={"User-Agent": "HatchMatch-Hackathon/1.0 (mailto:contact@hatchmatch.dev)"},
        )
        if response.status_code != 200:
            return PaperResult([], f"OpenAlex returned HTTP {response.status_code}: {response.text[:120]}")

        data = response.json()
        results = data.get("results", [])
        papers = []

        for item in results:
            title = item.get("title") or "Untitled Paper"

            authorships = item.get("authorships", []) or []
            author_names = []
            for a in authorships:
                author_obj = a.get("author", {}) or {}
                name = author_obj.get("display_name")
                if name:
                    author_names.append(name)
            authors_str = ", ".join(author_names[:5]) if author_names else "Unknown authors"

            year = item.get("publication_year")
            doi = item.get("doi") or ""
            url = doi if doi else (item.get("id") or "")

            papers.append({
                "title": title,
                "authors": authors_str,
                "year": year,
                "doi": doi,
                "url": url,
            })

        note = "" if papers else "No papers found matching query."
        return PaperResult(papers, note)

    except Exception as exc:
        return PaperResult([], f"OpenAlex API call failed: {exc}")
