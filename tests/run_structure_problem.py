import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "hatchmatch")

from app.ai.structure_problem import structure_problem

cases = json.loads((ROOT / "tests" / "test_inputs.json").read_text(encoding="utf-8"))
only = int(sys.argv[1]) if len(sys.argv) > 1 else None

passed = 0
first = True
for case in cases:
    if only and case["id"] != only:
        continue
    if not first:
        time.sleep(25)  # free tier: 5 requests per minute
    first = False
    print("=" * 70)
    print(f"#{case['id']} [{case['lang']}] expected_safe={case['expected_safe']}")
    print("INPUT:", case["text"])
    out = None
    for attempt in range(2):
        try:
            out = structure_problem(case["text"])
            break
        except Exception as e:
            print(f"ERROR (attempt {attempt + 1}):", str(e)[:150])
            time.sleep(65)
    if out is None:
        continue
    ok = out.safe == case["expected_safe"]
    passed += ok
    print(f"language={out.language} safe={out.safe} -> {'OK' if ok else 'MISMATCH'}")
    print("CARD   :", json.dumps(out.card.model_dump(), ensure_ascii=False, indent=2))
    print("CARD_EN:", json.dumps(out.card_en.model_dump(), ensure_ascii=False, indent=2))

print("=" * 70)
print("safe-flag matches:", passed)
