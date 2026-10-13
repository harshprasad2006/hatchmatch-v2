# HatchMatch API Contract

Base URL (local): `http://127.0.0.1:8000`

Interactive API documentation: `/docs`

## 1. Health Check

**GET** `/api/v1/health`

Confirms the backend is running.

## 2. Create a Problem

**POST** `/api/v1/problems`

Request:
```json
{
  "raw_text": "Students struggle to find authentic real-world problem statements",
  "language": "English"
}
```

Response fields:
- `id`: unique problem ID
- `card`: `title`, `who`, `pain`, `frequency`, `workaround`, `category`
- `existing_solutions`: list of solutions with `name`, `summary`, `link`
- `shared`: boolean
- `created_at`: UTC timestamp in ISO 8601 format

Note: The current implementation uses placeholder card values and does not yet perform AI structuring or solution discovery.

## 3. Share a Problem

**POST** `/api/v1/problems/{problem_id}/share`

Marks an existing problem as shared.

Response:
```json
{
  "id": "the-problem-id",
  "shared": true,
  "message": "Problem shared successfully"
}
```

Unknown IDs return `404`.

## 4. List Shared Problems

**GET** `/api/v1/problems`

Returns:
```json
{
  "problems": []
}
```

The list contains saved problems where `shared` is `true`.

## 5. Check an Idea

**POST** `/api/v1/ideas/check`

Request:
```json
{
  "idea_text": "A platform that helps students discover real-world problems"
}
```

Current status: The route is registered, but returns `501 Not Implemented` until AI structuring and grounded search are integrated.

Planned report fields include `id`, `idea_text`, `idea_card`, `matches`, `compare_table`, `uniqueness_score`, `score_breakdown`, and `created_at`.

## 6. Save and Retrieve a Report

**POST** `/api/v1/reports`

Saves a complete `IdeaReport` to Firestore using the report's `id`.

The request body must contain all fields defined by the `IdeaReport` model:
- `id`
- `idea_text`
- `idea_card`
- `matches`
- `compare_table`
- `uniqueness_score`
- `score_breakdown`
- `created_at`

Returns the saved report with HTTP `201 Created`. Returns `500` if saving fails.

**GET** `/api/v1/reports/{report_id}`

Retrieves a saved report from Firestore.

- Returns `200 OK` when the report exists.
- Returns `404 Not Found` when the report does not exist.
- Returns `500 Internal Server Error` if retrieval fails.

Both endpoints have automated tests using mocked Firestore data.

**Limitation:** The report-saving endpoint stores a supplied report. It does not generate the report, perform AI analysis, or discover existing solutions. Those integrations remain pending.

## Team integration notes

- Frontend: use the field names and endpoint paths above.
- AI module: coordinate the `IdeaCard` structure and problem-structuring output.
- Search/scoring module: coordinate the `Match`, comparison table, and score breakdown.
- Backend: connect the modules, persist reports in Firestore, and validate responses.

## Run locally

Activate the project's virtual environment, then run:

```powershell
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs`.

**Security:** Never commit Firebase private keys, `.env` files, or secrets to GitHub.