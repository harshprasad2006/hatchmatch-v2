import re
from typing import Dict, List, NamedTuple
from urllib.parse import quote_plus


class PatentResult(NamedTuple):
    items: List[Dict]
    note: str


def build_google_patents_fallback_link(query: str) -> str:
    """Builds a deterministic Google Patents search link from keywords."""
    clean_query = query.strip()
    return f"https://patents.google.com/?q={quote_plus(clean_query)}"


def fetch_patents(
    query: str,
    limit: int = 5,
    max_bytes_billed: int = 50 * 1024 * 1024,  # 50MB guard
) -> PatentResult:
    """
    Searches Google Patents public dataset via BigQuery sandbox.
    Guards with LIMIT and maximum_bytes_billed.
    On any failure (network, authentication, quota, malformed response),
    returns a Google Patents search link built from the keywords and a clear note.
    Never raises exceptions to the caller.
    """
    if not query or not query.strip():
        fallback_link = "https://patents.google.com/"
        return PatentResult(
            [{"title": "Google Patents Search", "link": fallback_link, "number": "", "date": "", "abstract": ""}],
            "Query is empty. Returned Google Patents homepage.",
        )

    clean_query = query.strip()
    fallback_link = build_google_patents_fallback_link(clean_query)
    fallback_item = {
        "title": f"Google Patents Search: {clean_query}",
        "link": fallback_link,
        "number": "",
        "date": "",
        "abstract": "Google Patents search query.",
    }

    # Extract keywords for query (alphanumeric only to avoid SQL injection / syntax errors)
    keywords = re.findall(r"\w+", clean_query)
    if not keywords:
        return PatentResult([fallback_item], "No valid keywords found. Returned Google Patents search link.")

    try:
        from google.cloud import bigquery

        client = bigquery.Client()
        job_config = bigquery.QueryJobConfig(
            maximum_bytes_billed=max_bytes_billed,
        )

        sql = """
        SELECT
            publication_number,
            title_localized,
            publication_date,
            abstract_localized
        FROM
            `patents-public-data.patents.publications`
        WHERE
            REGEXP_CONTAINS(LOWER(title_localized), @search_pattern)
        ORDER BY
            publication_date DESC
        LIMIT @limit
        """
        query_params = [
            bigquery.ScalarQueryParameter("search_pattern", "STRING", rf"(?i)\b{re.escape(keywords[0])}\b"),
            bigquery.ScalarQueryParameter("limit", "INT64", limit),
        ]
        job_config.query_parameters = query_params

        query_job = client.query(sql, job_config=job_config)
        rows = list(query_job.result())

        patents = []
        for row in rows:
            pub_number = row.get("publication_number") or ""
            title = row.get("title_localized") or f"Patent {pub_number}"
            date = str(row.get("publication_date") or "")
            abstract = row.get("abstract_localized") or ""
            link = f"https://patents.google.com/patent/{pub_number}/en" if pub_number else fallback_link

            patents.append({
                "title": title,
                "link": link,
                "number": pub_number,
                "date": date,
                "abstract": abstract[:300],
            })

        if patents:
            return PatentResult(patents, "")
        else:
            return PatentResult([fallback_item], "No matching patents in BigQuery. Returned Google Patents search link.")

    except Exception as exc:
        return PatentResult(
            [fallback_item],
            f"BigQuery search failed ({exc}). Fallback Google Patents link provided.",
        )
