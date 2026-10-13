import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.ai.compare_and_rate import compare_and_rate
from app.ai.understand_idea import IdeaCard

idea = IdeaCard(
    safe=True,
    title="Local City Food Delivery App",
    summary="A food delivery platform that connects customers in small cities with local restaurants.",
    features=[
        "Connects local restaurants with customers in small cities",
        "Live order tracking",
        "Online payment options",
        "Voice ordering in Hindi",
    ],
    keywords=["food delivery app"],
)

# FAKE test data (not real products)
matches = [
    {"type": "product", "title": "ExampleBite (fake)", "link": "https://example.com/examplebite",
     "text": "ExampleBite is an app that lets people in small towns order food from nearby restaurants, pay online by UPI or card, and watch their delivery on a live map."},
    {"type": "paper", "title": "Demand forecasting for restaurant orders (fake)", "link": "https://example.com/paper1",
     "text": "This paper studies machine learning models that forecast the number of orders a restaurant will receive, to help plan kitchen staff."},
    {"type": "patent", "title": "Delivery vehicle tracking system (fake)", "link": "https://example.com/patent1",
     "text": "A system that tracks the GPS position of delivery vehicles and shows the position to the recipient in real time."},
]

print("--- No matches (no AI call) ---")
empty = compare_and_rate(idea, [])
print(json.dumps(empty.model_dump(), ensure_ascii=False, indent=2))

print("--- With 3 fake matches (1 AI call) ---")
result = compare_and_rate(idea, matches)
print(json.dumps(result.model_dump(), ensure_ascii=False, indent=2))
