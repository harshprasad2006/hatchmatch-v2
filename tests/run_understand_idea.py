import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.ai.understand_idea import understand_idea

cases = json.loads((ROOT / "tests" / "test_ideas.json").read_text(encoding="utf-8"))
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
    try:
        out = understand_idea(case["text"])
    except Exception as e:
        print("ERROR:", str(e)[:200])
        continue
    ok = out.safe == case["expected_safe"]
    passed += ok
    print(f"safe={out.safe} -> {'OK' if ok else 'MISMATCH'}")
    print(json.dumps(out.model_dump(), ensure_ascii=False, indent=2))

print("=" * 70)
print("safe-flag matches:", passed)
