#!/usr/bin/env python3
"""
scripts/probe_grounding.py

Probes Gemini models with Google Search grounding tool to test availability on the free tier.
- Reads GEMINI_API_KEY from environment (never logged or printed).
- Requires model names to be passed as CLI arguments.
- Executes exactly ONE non-retried call per specified model.
- Outputs success/failure, grounding citations, and full raw error text for 4xx/429.
- Generates/updates docs/search-probe.md with a results table and organizer inquiry message.
"""

import argparse
from datetime import datetime, timezone
import os
from pathlib import Path
import sys
from typing import Any, Dict, List

from dotenv import load_dotenv

# Ensure app can be imported if needed
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

load_dotenv()

ORGANIZER_MESSAGE_TEMPLATE = """## Ready-to-Send Message to Hackathon Organizers

```text
Subject: Query regarding Google Cloud / Gemini API credits for Hackathon Project (HatchMatch)

Hi Organizing Team,

We are building "HatchMatch", a platform connecting student builders with real-world problems. Our backend leverages Gemini for problem structuring and search grounding (checking existing solutions/patents/products).

Under Google AI Studio's free tier, search grounding and high-frequency model calls quickly encounter strict rate limits (429 Resource Exhausted) and daily quota caps. 

Could you please let us know if:
1. Google Cloud / Vertex AI credits or promo codes are provided for participating teams?
2. Alternatively, are higher-tier Gemini API keys or project whitelisting available for the hackathon?

This will help us determine whether to run grounded search in live evaluation or fall back to our zero-quota search pipelines.

Thank you!
Team HatchMatch
```
"""


def probe_single_model(
    client: Any,
    model_name: str,
    prompt: str = "What are commercial tools for tracking household electricity consumption in India? List 2 examples.",
) -> Dict[str, Any]:
    """
    Executes exactly ONE grounded search request for the given model without retrying.
    Returns a dictionary of probe results.
    """
    from google.genai import types

    result = {
        "model": model_name,
        "success": False,
        "grounding_metadata_present": False,
        "citations_returned": False,
        "citation_count": 0,
        "search_queries": [],
        "sources": [],
        "response_snippet": "",
        "raw_error": "",
    }

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                tools=[types.Tool(google_search=types.GoogleSearch())],
            ),
        )

        result["success"] = True

        candidates = getattr(response, "candidates", None) or []
        if candidates:
            metadata = getattr(candidates[0], "grounding_metadata", None)
            if metadata:
                result["grounding_metadata_present"] = True
                result["search_queries"] = list(getattr(metadata, "web_search_queries", []) or [])
                chunks = getattr(metadata, "grounding_chunks", []) or []
                result["citation_count"] = len(chunks)
                result["citations_returned"] = len(chunks) > 0
                for chunk in chunks:
                    web = getattr(chunk, "web", None)
                    if web and getattr(web, "uri", None):
                        result["sources"].append(web.uri)

        text = getattr(response, "text", "") or ""
        result["response_snippet"] = text[:300].strip().replace("\n", " ")

    except Exception as exc:
        result["success"] = False
        # Capture the COMPLETE untruncated error representation
        result["raw_error"] = str(exc) or repr(exc)

    return result


def format_markdown_report(results: List[Dict[str, Any]], prompt_used: str) -> str:
    timestamp = datetime.now(timezone.utc).isoformat()
    lines = [
        "# Search Grounding Probe Results",
        "",
        f"- **Probe Timestamp (UTC)**: `{timestamp}`",
        f"- **Prompt Tested**: `{prompt_used}`",
        "- **Probe Policy**: Single request per model, no retries to conserve quota.",
        "",
        "## Results Table",
        "",
        "| Model | Status | Grounding Metadata | Citations Returned | Citation Count | Error Summary |",
        "|---|---|---|---|---|---|",
    ]

    for r in results:
        status = "✅ SUCCESS" if r["success"] else "❌ FAILED"
        has_meta = "Yes" if r["grounding_metadata_present"] else "No"
        has_cit = "Yes" if r["citations_returned"] else "No"
        count = str(r["citation_count"])
        if r["success"]:
            err_summary = "None (OK)"
        else:
            first_line = r["raw_error"].split("\n")[0]
            err_summary = f"`{first_line[:80]}...`" if len(first_line) > 80 else f"`{first_line}`"

        lines.append(f"| `{r['model']}` | {status} | {has_meta} | {has_cit} | {count} | {err_summary} |")

    lines.append("")
    lines.append("## Detailed Probe Logs (Full Untruncated Errors)")
    lines.append("")

    for r in results:
        lines.append(f"### Model: `{r['model']}`")
        lines.append(f"- **Success**: `{r['success']}`")
        lines.append(f"- **Grounding Metadata Present**: `{r['grounding_metadata_present']}`")
        lines.append(f"- **Citations Returned**: `{r['citations_returned']}` (count: {r['citation_count']})")
        if r["search_queries"]:
            lines.append(f"- **Search Queries Generated**: `{r['search_queries']}`")
        if r["sources"]:
            lines.append("- **Sample Citations**:")
            for s in r["sources"][:5]:
                lines.append(f"  - {s}")
        if r["response_snippet"]:
            lines.append(f"- **Response Snippet**: {r['response_snippet']}")

        if r["raw_error"]:
            lines.append("- **FULL Raw Error Text**:")
            lines.append("```text")
            lines.append(r["raw_error"])
            lines.append("```")
        lines.append("")

    lines.append(ORGANIZER_MESSAGE_TEMPLATE)
    return "\n".join(lines)


def run_probe(models: List[str], output_path: Path, prompt: str) -> List[Dict[str, Any]]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY environment variable is not set.", file=sys.stderr)
        print("Please configure GEMINI_API_KEY in your .env or environment before running.", file=sys.stderr)
        sys.exit(1)

    from google import genai
    client = genai.Client(api_key=api_key)

    results = []
    print("=" * 70)
    print("HatchMatch: Google Search Grounding Probe")
    print(f"Models to test: {models}")
    print("Constraint: Exactly ONE call per model, no retries.")
    print("=" * 70)

    for idx, model_name in enumerate(models, 1):
        print(f"\n[{idx}/{len(models)}] Probing model: {model_name} ...")
        res = probe_single_model(client, model_name, prompt=prompt)
        results.append(res)

        if res["success"]:
            print(f"  -> SUCCESS! Grounding metadata: {res['grounding_metadata_present']}, Citations: {res['citation_count']}")
        else:
            print(f"  -> FAILED!")
            print("  -> FULL RAW ERROR:")
            print(res["raw_error"])

    report_md = format_markdown_report(results, prompt_used=prompt)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(report_md, encoding="utf-8")
    print(f"\nResults successfully written to: {output_path}")
    return results


def main():
    parser = argparse.ArgumentParser(
        description="Probe Google Search grounding across Gemini models without wasting quota.",
    )
    parser.add_argument(
        "models",
        nargs="+",
        help="One or more model names to probe (e.g. gemini-2.5-flash gemini-2.0-flash). Do not guess.",
    )
    parser.add_argument(
        "--prompt",
        default="What are commercial tools for tracking household electricity consumption in India? List 2 examples.",
        help="Prompt to send with grounded search tool.",
    )
    parser.add_argument(
        "--output",
        default="docs/search-probe.md",
        help="Output markdown file path (default: docs/search-probe.md).",
    )

    args = parser.parse_args()
    output_path = Path(args.output).resolve()
    run_probe(args.models, output_path, args.prompt)


if __name__ == "__main__":
    main()
