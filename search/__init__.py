"""
Search package for fallback solution and prior-art lookups:
- search.papers: OpenAlex research papers search
- search.patents: BigQuery public patents search with Google Patents fallback
- search.products: Gemini ungrounded product discovery with code-generated Google search links
"""

from typing import NamedTuple, List, Dict


class SearchResult(NamedTuple):
    items: List[Dict]
    note: str


from search.papers import fetch_papers
from search.patents import fetch_patents
from search.products import fetch_products

__all__ = [
    "SearchResult",
    "fetch_papers",
    "fetch_patents",
    "fetch_products",
]
