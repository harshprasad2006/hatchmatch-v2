# AI Notes & Architecture Reference

<!-- ================================================================= -->
<!-- [PLACEHOLDER: MEMBER 3'S WRITTEN SUMMARY]                          -->
<!-- Paste Member 3's written summary below this line.                 -->
<!-- ================================================================= -->


---

## 1. AI Functions (as built)

### `structure_problem(raw_text: str) -> StructuredProblem`
- **File**: `app/ai/structure_problem.py`
- **Prompt**: `app/ai/prompts/structure_problem_v1.txt`
- **Model**: `GEMINI_MODEL` (defaults to `gemini-3.7-flash`).
- **Description**: Takes unstructured user input describing an everyday problem (in English, Hindi, Marathi, Hinglish, or mixed), calls Gemini with structured JSON output, and structures it into dual problem cards (`card` in original language/script, `card_en` in simple English).
- **Status & Safety**: Returns `status` in `{"ok", "not_a_problem", "unsafe"}`. Sets `safe = (status == "ok")`.
- **Language Detection**: Normalized via `normalize_lang()` to `{"en", "hi", "mr", "hinglish", "mixed"}`.
- **Retry / Error Handling**: Gemini API call is wrapped in `call_with_retry(tries=3, base=1.0)` for transient errors (503, 429, UNAVAILABLE, RESOURCE_EXHAUSTED). JSON/validation parse retries up to 2 attempts.

### `understand_idea(idea_text: str) -> IdeaCard`
- **File**: `app/ai/understand_idea.py`
- **Prompt**: `app/ai/prompts/understand_idea_v1.txt`
- **Model**: `GEMINI_MODEL` via `structure_problem._client()`.
- **Description**: Analyzes a student's project idea pitch, checks basic safety, extracts a concise title, 1-sentence summary, up to 5 core features, and search keywords.
- **Retry / Error Handling**: Wrapped in `call_with_retry` for transient errors.

### `compare_and_rate(idea: IdeaCard, matches: list[dict]) -> Comparison`
- **File**: `app/ai/compare_and_rate.py`
- **Prompt**: `app/ai/prompts/compare_and_rate_v1.txt`
- **Model**: `GEMINI_MODEL` via `structure_problem._client()`.
- **Description**: Compares the structured `IdeaCard` against search match candidates (`list[dict]` containing `type`, `title`, `link`, `text`). Rates similarity (0–100), identifies similarities and differences, and evaluates which idea features were found in existing work.
- **Guardrails**:
  - If `matches` is empty, returns immediately without calling Gemini.
  - Text truncated to `MAX_TEXT_CHARS = 1500` per match.
  - Validates index coverage and feature names against the idea.
- **Retry / Error Handling**: Wrapped in `call_with_retry` for transient errors.

### `find_solutions(problem_input) -> dict`
- **File**: `app/ai/find_solutions.py`
- **Status**: Implemented. Combines ungrounded Gemini product discovery (`search.products`), OpenAlex research papers (`search.papers`), and BigQuery patents (`search.patents`).
- **Output Schema**: `{"solutions": [{"name": str, "summary": str, "link": str, "source": "ai_suggested"}], "note": str}`
- **Fallback Rule**: Returns `solutions: []` and `note: "No clear match found"` if nothing fits.
- **Safety**: Never invents direct URLs; uses code-generated Google Search links or authenticated source URLs.

---

## 2. Shared Utilities (`app/ai/utils.py`)

### `call_with_retry(fn, tries=3, base=1.0)`
- **Behavior**: Executes `fn` with exponential backoff: `base * (2 ** attempt)` seconds between attempts.
- **Retry Condition**: Retries **ONLY** when the error message or code contains `503`, `429`, `UNAVAILABLE`, or `RESOURCE_EXHAUSTED`.
- **Non-Transient Errors**: Re-raises immediately without sleeping or retrying (e.g., `ValidationError`, `ValueError`, auth errors).
- **Final Attempt**: Re-raises the last error if all retries are exhausted.
- **Quota Alert**: A **daily-quota 429** (`RESOURCE_EXHAUSTED` due to daily free-tier limits) will **NOT recover by retrying**. Retrying is designed for temporary RPM rate spikes or service unavailability (503). When daily quota is exhausted, backoff will fail until the quota window resets.

### `normalize_lang(label)`
- **Allowed Values**: Exactly `"en"`, `"hi"`, `"mr"`, and `"hinglish"`.
- **Normalization**: Strips whitespace and lowercases input.
- **Fallback**: Maps every other label (including empty, None, or unrecognized languages) to `"mixed"`.
- **Roman-Script Hindi**: Prompt explicitly enforces that Hindi written in Roman script (e.g. "bhaiya refund nahi mil raha") is labeled `"hinglish"`.

---

## 3. Input/Output Schemas

### Problem Structuring Schemas (`app/models/problem.py`, `app/ai/structure_problem.py`)

#### `ProblemRequest` (API Request)
```python
class ProblemRequest(BaseModel):
    raw_text: str  # min_length=10, max_length=5000
    language: str = "auto"
```

#### `ProblemCard` (Domain Model)
```python
class ProblemCard(BaseModel):
    title: str
    who: str
    pain: str
    frequency: str
    workaround: str
    category: str  # One of: Money, Shopping, Health, Education, Transport, Food, Work, Home, Other
```

#### `StructuredProblem` (AI Output)
```python
class StructuredProblem(BaseModel):
    status: str = "ok"  # "ok", "not_a_problem", "unsafe"
    language: str       # "en", "hi", "mr", "hinglish", or "mixed"
    safe: bool          # True if status == "ok", else False
    card: ProblemCard
    card_en: ProblemCard
```

#### `ProblemResponse` (API Response)
```python
class ExistingSolution(BaseModel):
    name: str
    summary: str
    link: str

class ProblemResponse(BaseModel):
    id: str
    card: ProblemCard
    card_en: ProblemCard | None = None
    existing_solutions: list[ExistingSolution]
    shared: bool = False
    created_at: str
```

---

## 4. Status Codes & Frontend Contract

### Frontend Contract for Members 2 & 4 (`POST /api/v1/problems`)

#### 1. Success (`status: "ok"`) -> HTTP 200 OK
```json
{
  "id": "c1f7a28e-5cb2-4a7b-a489-08cb7c631980",
  "card": {
    "title": "UPI Payment Delay",
    "who": "Small grocery shopkeeper",
    "pain": "Customer says payment is done, but confirmation SMS takes 10 minutes",
    "frequency": "Daily, multiple times per day",
    "workaround": "Checks bank SMS repeatedly while customer waits",
    "category": "Money"
  },
  "card_en": {
    "title": "UPI Payment Delay",
    "who": "Small grocery shopkeeper",
    "pain": "Customer says payment is done, but confirmation SMS takes 10 minutes",
    "frequency": "Daily, multiple times per day",
    "workaround": "Checks bank SMS repeatedly while customer waits",
    "category": "Money"
  },
  "existing_solutions": [],
  "shared": false,
  "created_at": "2026-10-12T18:00:00.000000+00:00"
}
```

#### 2. Unsafe Content (`status: "unsafe"`) -> HTTP 400 Bad Request
Returned when input contains hateful, abusive, illegal, sexual, or malicious/hacking content.
```json
{
  "detail": "This content could not be processed safely."
}
```

#### 3. Not A Problem (`status: "not_a_problem"`) -> HTTP 422 Unprocessable Entity
Returned when input is chit-chat, greetings, off-topic trivia, or does not describe a real problem.
```json
{
  "detail": "Please describe a real problem you face."
}
```

#### 4. Validation Error (`raw_text < 10` chars) -> HTTP 422 Unprocessable Entity
FastAPI schema validation error when body is too short or malformed:
```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "raw_text"],
      "msg": "String should have at least 10 characters",
      "input": "Too short"
    }
  ]
}
```

---

## 5. Known Issues & Operational Notes

1. **Free-Tier Daily Quotas**:
   - Google AI Studio free tier enforces low requests-per-minute (RPM) limits and daily quotas.
   - Transient 429 rate limit bursts will automatically retry with exponential backoff.
   - **A daily-quota 429 cannot recover by retrying**. Once exhausted, retries will fail until the daily window resets.
2. **Billing Prevention**:
   - `_client()` in `app/ai/structure_problem.py` strictly reads `GEMINI_API_KEY` from the environment. Vertex AI fallback has been disabled to prevent accidental GCP billing.
3. **Eager Firestore Initialization in Tests**:
   - `app/services/firestore.py` initializes Firebase immediately upon module import. In unit tests, `firebase_admin` must be mocked before importing `app` (as demonstrated in `test_structure_problem_fixes.py` and `test_ideas_endpoint.py`).
4. **URL Hallucination Safeguard**:
   - Gemini must never invent direct product/solution URLs. All external links will be constructed deterministically via Google search URLs (`https://www.google.com/search?q=...`) in Phase 4.
