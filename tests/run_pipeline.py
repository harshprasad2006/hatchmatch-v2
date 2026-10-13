import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.ai.compare_and_rate import compare_and_rate
from app.ai.understand_idea import understand_idea
from app.services.scoring_service import calculate_uniqueness_score
from app.services.search_service import search_existing_solutions

text = sys.argv[1] if len(sys.argv) > 1 else (
    "A food delivery app that connects local restaurants with customers "
    "in small cities, with live order tracking and online payment."
)

print("1. understand_idea")
idea = understand_idea(text)
print(json.dumps(idea.model_dump(), ensure_ascii=False, indent=2))

print("\n2. search (Member 4)")
matches = search_existing_solutions(text)
for m in matches:
    print(f"- [{m['type']}] {m['title']} -> {m['link']}")
print("matches found:", len(matches))

print("\n3. compare_and_rate")
comparison = compare_and_rate(idea, matches)
for m in comparison.matches:
    print(f"- {m.similarity:>3}  [{m.type}] {m.title}")
for f in comparison.features:
    print(f"- found={f.found}  {f.feature}")

print("\n4. score (Member 4)")
score = calculate_uniqueness_score(
    [m.model_dump() for m in comparison.matches],
    [f.model_dump() for f in comparison.features],
)
print(json.dumps(score, ensure_ascii=False, indent=2, default=str))
