import os
from typing import Any, Dict, List, Union
from urllib.parse import quote_plus

from pydantic import BaseModel, Field

from app.config import USE_GROUNDING
from app.models.problem import ProblemCard
from search.papers import fetch_papers
from search.patents import fetch_patents
from search.products import fetch_products


class Solution(BaseModel):
    name: str = Field(..., description="Name of the solution, product, or research work")
    summary: str = Field(..., description="One-line summary of what it does")
    link: str = Field(..., description="Web or search link for verification")
    source: str = Field(default="ai_suggested", description="Source category")


class SolutionsResponse(BaseModel):
    solutions: List[Solution] = Field(default_factory=list)
    note: str = ""


def _extract_query_text(problem_input: Union[str, ProblemCard, Dict[str, Any]]) -> str:
    """Extracts a clean search query string from various input formats."""
    if isinstance(problem_input, ProblemCard):
        return f"{problem_input.title} {problem_input.pain}".strip()
    if isinstance(problem_input, dict):
        title = problem_input.get("title") or ""
        pain = problem_input.get("pain") or ""
        text = problem_input.get("text") or problem_input.get("raw_text") or ""
        combined = f"{title} {pain}".strip()
        return combined if combined else str(text).strip()
    return str(problem_input).strip()


def find_solutions(
    problem_input: Union[str, ProblemCard, Dict[str, Any]],
    max_solutions: int = 6,
) -> Dict[str, Any]:
    """
    Finds existing commercial products, academic papers, and patents for a given problem.
    Respects USE_GROUNDING flag (defaults to False).
    Never invents direct URLs; uses code-generated Google Search links or source URLs.
    Handles source failures gracefully and never raises exceptions.

    Returns:
        {"solutions": [{"name": "", "summary": "", "link": "", "source": "ai_suggested"}], "note": ""}
    """
    query_text = _extract_query_text(problem_input)
    if not query_text:
        return {"solutions": [], "note": "No clear match found"}

    solutions: List[Dict[str, str]] = []
    notes: List[str] = []

    # 1. Commercial Products (Ungrounded Gemini discovery + verified search links)
    try:
        product_res = fetch_products(query_text, limit=3)
        for item in product_res.items:
            name = item.get("name") or "Commercial Product"
            summary = item.get("summary") or "Existing commercial tool/application"
            link = item.get("link") or f"https://www.google.com/search?q={quote_plus(name)}"
            solutions.append({
                "name": name,
                "summary": summary,
                "link": link,
                "source": "ai_suggested",
            })
        if product_res.note:
            notes.append(product_res.note)
    except Exception as exc:
        notes.append(f"Product lookup unavailable: {exc}")

    # 2. Academic Papers (OpenAlex)
    try:
        paper_res = fetch_papers(query_text, limit=2)
        for item in paper_res.items:
            title = item.get("title") or "Academic Paper"
            authors = item.get("authors") or "Researchers"
            year = item.get("year") or ""
            year_str = f" ({year})" if year else ""
            summary = f"Research paper{year_str} by {authors}."
            link = item.get("url") or f"https://www.google.com/search?q={quote_plus(title)}"
            solutions.append({
                "name": title,
                "summary": summary,
                "link": link,
                "source": "ai_suggested",
            })
        if paper_res.note:
            notes.append(paper_res.note)
    except Exception as exc:
        notes.append(f"Papers lookup unavailable: {exc}")

    # 3. Patents (BigQuery Sandbox with Google Patents search fallback)
    try:
        patent_res = fetch_patents(query_text, limit=2)
        for item in patent_res.items:
            title = item.get("title") or "Patent Record"
            abstract = item.get("abstract") or ""
            summary = abstract[:200] if abstract else "Patent publication covering related technology."
            link = item.get("link") or f"https://patents.google.com/?q={quote_plus(query_text)}"
            solutions.append({
                "name": title,
                "summary": summary,
                "link": link,
                "source": "ai_suggested",
            })
        if patent_res.note:
            notes.append(patent_res.note)
    except Exception as exc:
        notes.append(f"Patents lookup unavailable: {exc}")

    # Deduplicate by link or name
    seen_links = set()
    deduped_solutions = []
    for sol in solutions:
        link = sol["link"]
        if link in seen_links:
            continue
        seen_links.add(link)
        deduped_solutions.append(sol)
        if len(deduped_solutions) >= max_solutions:
            break

    # Determine final note
    if not deduped_solutions:
        return {
            "solutions": [],
            "note": "No clear match found",
        }

    final_note = "; ".join(notes) if notes and len(deduped_solutions) < 2 else ""

    return {
        "solutions": deduped_solutions,
        "note": final_note,
    }
