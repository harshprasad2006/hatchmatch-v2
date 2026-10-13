#!/usr/bin/env python3
"""
scripts/run_find_solutions.py

Runs find_solutions on test problems from data/test_inputs/problems.json.
By default runs in offline/mock mode to avoid burning API quota.
Use --live flag to execute real API queries.
"""

import argparse
import json
from pathlib import Path
import sys
from unittest.mock import patch
from urllib.parse import quote_plus

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.ai.find_solutions import find_solutions
from search.papers import PaperResult
from search.patents import PatentResult
from search.products import ProductResult


def get_mock_solutions(problem_text: str):
    """Generates realistic offline mock search results for testing without burning API quota."""
    short_query = " ".join(problem_text.split()[:4])
    products = ProductResult(
        [
            {
                "name": f"SmartSolution App ({short_query})",
                "summary": "Commercial mobile tool addressing related operational challenges.",
                "link": f"https://www.google.com/search?q={quote_plus('SmartSolution ' + short_query)}",
                "source": "AI-suggested, please verify",
            }
        ],
        "",
    )
    papers = PaperResult(
        [
            {
                "title": f"Empirical Study on {short_query}",
                "authors": "A. Kumar et al.",
                "year": 2024,
                "doi": "https://doi.org/10.1016/sample.2024",
                "url": "https://doi.org/10.1016/sample.2024",
            }
        ],
        "",
    )
    patents = PatentResult(
        [
            {
                "title": f"Automated System and Method for {short_query}",
                "number": "US-2024012345",
                "date": "2024-03-15",
                "link": f"https://patents.google.com/?q={quote_plus(short_query)}",
                "abstract": "System and method providing automated tracking and management.",
            }
        ],
        "",
    )
    return products, papers, patents


def main():
    parser = argparse.ArgumentParser(description="Run find_solutions on test problems.")
    parser.add_argument(
        "--live",
        action="store_true",
        help="Run against live external APIs (OpenAlex, BigQuery, Gemini). Default is offline/mocked.",
    )
    parser.add_argument(
        "--ids",
        nargs="+",
        type=int,
        default=[14, 15, 16, 17, 18],
        help="Problem IDs to evaluate (default: 14 15 16 17 18)",
    )

    args = parser.parse_args()

    data_file = ROOT / "data" / "test_inputs" / "problems.json"
    if not data_file.exists():
        print(f"Error: {data_file} not found.", file=sys.stderr)
        sys.exit(1)

    all_cases = json.loads(data_file.read_text(encoding="utf-8"))
    selected_cases = [c for c in all_cases if c["id"] in args.ids]

    if not selected_cases:
        print(f"No cases found matching IDs: {args.ids}", file=sys.stderr)
        sys.exit(1)

    print("=" * 75)
    mode_str = "LIVE APIs" if args.live else "OFFLINE / MOCKED (zero quota spent)"
    print(f"HatchMatch: run_find_solutions [{mode_str}]")
    print(f"Evaluating {len(selected_cases)} problems: {args.ids}")
    print("=" * 75)

    for case in selected_cases:
        print(f"\n--- Problem #{case['id']} [{case['lang']}] ---")
        print(f"INPUT: {case['text']}")

        if args.live:
            res = find_solutions(case["text"])
        else:
            mock_prod, mock_papers, mock_pat = get_mock_solutions(case["text"])
            with patch("app.ai.find_solutions.fetch_products", return_value=mock_prod), \
                 patch("app.ai.find_solutions.fetch_papers", return_value=mock_papers), \
                 patch("app.ai.find_solutions.fetch_patents", return_value=mock_pat):
                res = find_solutions(case["text"])

        print(f"SOLUTIONS FOUND: {len(res['solutions'])}")
        for idx, sol in enumerate(res["solutions"], 1):
            print(f"  {idx}. [{sol['source']}] {sol['name']}")
            print(f"     Summary: {sol['summary']}")
            print(f"     Link   : {sol['link']}")
        if res.get("note"):
            print(f"NOTE: {res['note']}")

    print("\n" + "=" * 75)
    print("Completed find_solutions evaluation.")


if __name__ == "__main__":
    main()
