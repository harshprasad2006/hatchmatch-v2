from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.ai.find_solutions import find_solutions
from app.ai.structure_problem import structure_problem
from app.models.problem import (
    ExistingSolution,
    ProblemCard,
    ProblemRequest,
    ProblemResponse,
)
from app.services.firestore import db

router = APIRouter(
    prefix="/api/v1/problems",
    tags=["Problems"],
)

problems_collection = db.collection("problems")


@router.post("", response_model=ProblemResponse)
def create_problem(request: ProblemRequest):
    structured = structure_problem(request.raw_text)

    if structured.status == "unsafe":
        raise HTTPException(
            status_code=400,
            detail="This content could not be processed safely.",
        )
    if structured.status == "not_a_problem":
        raise HTTPException(
            status_code=422,
            detail="Please describe a real problem you face.",
        )

    # 2. Discover existing solutions for the structured problem
    existing_solutions = []
    errors = []
    partial = False

    try:
        solutions_data = find_solutions(structured.card)
        for item in solutions_data.get("solutions", []):
            existing_solutions.append(
                ExistingSolution(
                    name=item["name"],
                    summary=item["summary"],
                    link=item["link"],
                )
            )
        if solutions_data.get("note") and not existing_solutions:
            # Informative search provider note
            errors.append(solutions_data["note"])
    except Exception as exc:
        partial = True
        errors.append("Solution lookup temporarily unavailable.")

    problem_id = str(uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    response = ProblemResponse(
        id=problem_id,
        card=structured.card,
        card_en=structured.card_en,
        existing_solutions=existing_solutions,
        shared=False,
        created_at=created_at,
        partial=partial,
        errors=errors,
    )

    try:
        problems_collection.document(problem_id).set(
            response.model_dump()
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to save problem right now",
        )

    return response


@router.post("/{problem_id}/share")
def share_problem(problem_id: str):
    document = problems_collection.document(problem_id)
    snapshot = document.get()

    if not snapshot.exists:
        raise HTTPException(
            status_code=404,
            detail="Problem not found",
        )

    document.update({"shared": True})

    return {
        "id": problem_id,
        "shared": True,
        "message": "Problem shared successfully",
    }


@router.get("")
def list_shared_problems():
    snapshots = (
        problems_collection
        .where("shared", "==", True)
        .stream()
    )

    problems = [snapshot.to_dict() for snapshot in snapshots]

    return {"problems": problems}
