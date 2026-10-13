
from fastapi import APIRouter, HTTPException, status 

from app.models.report import IdeaReport
from app.services.firestore import db

from app.models.report import IdeaReport

router = APIRouter(
    prefix="/api/v1/reports",
    tags=["Reports"],
)

reports_collection = db.collection("reports")


@router.get("/{report_id}", response_model=IdeaReport)
def get_report(report_id: str):
    try:
        snapshot = reports_collection.document(report_id).get()

        if not snapshot.exists:
            raise HTTPException(
                status_code=404,
                detail="Report not found",
            )

        return snapshot.to_dict()

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve report right now",
        )

    
@router.post("", response_model=IdeaReport, status_code=status.HTTP_201_CREATED)
def save_report(report: IdeaReport):
    try:
        report_data = report.model_dump(exclude_unset=True)
        reports_collection.document(report.id).set(report_data)
        return report

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to save report right now",
        )

