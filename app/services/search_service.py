from typing import Any, Dict, List
from google.genai import types

from app.ai.structure_problem import MODEL, _client
from app.ai.utils import call_with_retry
from app.config import USE_GROUNDING
from search.papers import fetch_papers
from search.patents import fetch_patents
from search.products import fetch_products

MAX_RESULTS_PER_CATEGORY = 5


def _search_category_grounded(idea_text: str, category: str) -> List[Dict[str, Any]]:
    """Search the web for existing work in one category using Google Search Grounding."""
    prompts = {
        "product": (
            "Find existing products, apps, websites, and commercial tools "
            "related to this idea. Prefer official product pages."
        ),
        "research_paper": (
            "Find relevant academic research papers, preferably publisher, "
            "journal, conference, DOI, or university repository pages."
        ),
        "patent": (
            "Find relevant patent records. Prefer official patent database "
            "pages such as Google Patents or patent office websites."
        ),
    }

    prompt = f"""
You are researching existing work for an idea-checking platform.

Idea:
{idea_text}

Research category: {category}

Task:
{prompts[category]}

Use Google Search to find relevant sources.
Discuss only sources supported by the search results.
Do not invent titles, authors, dates, patent numbers, or URLs.
Explain briefly why each source is relevant.
Prefer distinct sources and include source-specific information.
"""

    client = _client()

    response = call_with_retry(
        lambda: client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                tools=[
                    types.Tool(
                        google_search=types.GoogleSearch()
                    )
                ],
            ),
        )
    )

    candidates = response.candidates or []
    if not candidates:
        return []

    metadata = candidates[0].grounding_metadata
    if not metadata or not metadata.grounding_chunks:
        return []

    snippets_by_index = {}
    for support in metadata.grounding_supports or []:
        segment = support.segment
        if not segment or not segment.text:
            continue
        for index in support.grounding_chunk_indices or []:
            snippets_by_index.setdefault(index, []).append(segment.text)

    results = []
    seen_urls = set()

    for index, chunk in enumerate(metadata.grounding_chunks):
        web_source = chunk.web
        if not web_source or not web_source.uri:
            continue

        url = web_source.uri
        title = web_source.title or "Untitled source"

        if url in seen_urls:
            continue
        seen_urls.add(url)

        snippets = snippets_by_index.get(index, [])
        source_text = " ".join(dict.fromkeys(snippets))

        results.append({
            "type": category,
            "title": title,
            "link": url,
            "text": source_text[:1500],
            "similarity": 0,
        })

        if len(results) >= MAX_RESULTS_PER_CATEGORY:
            break

    return results


def _search_fallback_sources(idea_text: str) -> List[Dict[str, Any]]:
    """
    Zero-quota fallback search:
    - Products: Ungrounded Gemini suggestion with verified Google Search links.
    - Papers: OpenAlex academic API.
    - Patents: BigQuery sandbox with Google Patents search links.
    """
    results: List[Dict[str, Any]] = []

    # 1. Commercial products
    try:
        prod_res = fetch_products(idea_text, limit=3)
        for p in prod_res.items:
            results.append({
                "type": "product",
                "title": p.get("name", "Commercial Tool"),
                "link": p.get("link", ""),
                "text": f"AI-suggested product: {p.get('summary', '')}",
                "similarity": 0,
            })
    except Exception:
        pass

    # 2. Research papers
    try:
        paper_res = fetch_papers(idea_text, limit=2)
        for item in paper_res.items:
            title = item.get("title", "Research Paper")
            authors = item.get("authors", "Researchers")
            year = item.get("year", "")
            doi = item.get("doi", "")
            results.append({
                "type": "research_paper",
                "title": title,
                "link": item.get("url", ""),
                "text": f"Academic research paper ({year}) by {authors}. DOI: {doi}",
                "similarity": 0,
            })
    except Exception:
        pass

    # 3. Patents
    try:
        patent_res = fetch_patents(idea_text, limit=2)
        for item in patent_res.items:
            results.append({
                "type": "patent",
                "title": item.get("title", "Patent Publication"),
                "link": item.get("link", ""),
                "text": item.get("abstract", "") or f"Patent publication {item.get('number', '')}",
                "similarity": 0,
            })
    except Exception:
        pass

    return results


def search_existing_solutions(idea_text: str) -> List[Dict[str, Any]]:
    """
    Searches for existing products, papers, and patents.
    Respects USE_GROUNDING flag:
    - If USE_GROUNDING is True: tries grounded search, falling back to offline search on error.
    - If USE_GROUNDING is False: uses zero-quota fallback search directly.
    """
    if not idea_text or not idea_text.strip():
        raise ValueError("idea_text cannot be empty")

    query = idea_text.strip()

    if USE_GROUNDING:
        try:
            results = []
            for category in ("product", "research_paper", "patent"):
                results.extend(_search_category_grounded(query, category))
            if results:
                return results
        except Exception:
            # Fall back to zero-quota search on quota/API error
            pass

    return _search_fallback_sources(query)
