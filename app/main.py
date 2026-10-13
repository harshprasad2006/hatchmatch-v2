
from fastapi import FastAPI

from app.api.routes.problems import router as problems_router

from app.api.routes.reports import router as reports_router

from app.api.routes.ideas import router as ideas_router

app = FastAPI(
    title="HatchMatch API",
    description="Backend API for the HatchMatch platform",
    version="0.1.0",
)

app.include_router(problems_router)
app.include_router(reports_router)
app.include_router(ideas_router)


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "HatchMatch API",
    }
