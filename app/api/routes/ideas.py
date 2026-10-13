from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.ai.compare_and_rate import compare_and_rate
from app.ai.understand_idea import understand_idea
from app.api.routes.reports import reports_collection
from app.models.report import (
    IdeaCard as ReportIdeaCard,
    IdeaCheckRequest,
    IdeaReport,
    Match,
    ScoreBreakdown,
)
from app.services.cache_service import compute_input_hash, find_cached_report_by_hash
from app.services.scoring_service import calculate_uniqueness_score
from app.services.search_service import search_existing_solutions

router = APIRouter(
    prefix="/api/v1/ideas",
    tags=["Ideas"],
)


@router.post("/check", response_model=IdeaReport)
def check_idea(request: IdeaCheckRequest):
    # 0. Check cache first (exact SHA-256 hit on normalized text)
    input_hash = compute_input_hash(request.idea_text)
    cached = find_cached_report_by_hash(reports_collection, input_hash)
    if cached:
        try:
            return IdeaReport.model_validate(cached)
        except Exception:
            pass

    errors = []
    partial = False

    try:
        # 1. Understand and structure the submitted idea.
        idea = understand_idea(request.idea_text)

        if not idea.safe:
            raise HTTPException(
                status_code=400,
                detail="This idea could not be processed safely.",
            )

        # 2. Search for existing products, papers, and patents.
        raw_matches = search_existing_solutions(request.idea_text)

        # 3. Compare search results with the idea's features.
        comparison = compare_and_rate(idea, raw_matches)

        # 4. Calculate the uniqueness score.
        score_result = calculate_uniqueness_score(
            [match.model_dump() for match in comparison.matches],
            [feature.model_dump() for feature in comparison.features],
        )

        # 5. Build the report.
        report_card = ReportIdeaCard(
            title=idea.title,
            main_features=idea.features,
            keywords=idea.keywords,
        )

        report_matches = [
            Match(
                type=match.type,
                title=match.title,
                link=match.link,
                text=(
                    f"Similarities: {match.same}\n"
                    f"Differences: {match.different}"
                ),
                similarity=match.similarity,
            )
            for match in comparison.matches
        ]

        compare_table = [
            {
                "feature": feature.feature,
                "found": feature.found,
                "found_in": feature.found_in,
            }
            for feature in comparison.features
        ]

        breakdown = ScoreBreakdown(
            closest_match_deduction=score_result[
                "score_breakdown"
            ]["closest_match_deduction"],
            crowd_deduction=score_result[
                "score_breakdown"
            ]["crowd_deduction"],
            feature_overlap_deduction=score_result[
                "score_breakdown"
            ]["feature_overlap_deduction"],
        )

        report = IdeaReport(
            id=str(uuid4()),
            idea_text=request.idea_text,
            idea_card=report_card,
            matches=report_matches,
            compare_table=compare_table,
            uniqueness_score=score_result["uniqueness_score"],
            score_breakdown=breakdown,
            created_at=datetime.now(timezone.utc).isoformat(),
            partial=partial,
            errors=errors,
        )

        # 6. Save the report to Firestore (with input_hash for future cache hits)
        try:
            report_data = report.model_dump(mode="json")
            report_data["input_hash"] = input_hash
            reports_collection.document(report.id).set(report_data)
        except Exception:
            pass

        return report

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "Idea analysis could not be completed. "
                "Check the server logs and API quota."
            ),
        ) from exc
