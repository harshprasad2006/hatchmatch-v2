from pydantic import BaseModel, Field


class IdeaCheckRequest(BaseModel):
    idea_text: str = Field(
        min_length=10,
        max_length=5000,
        description="The student's idea pitch",
    )


class IdeaCard(BaseModel):
    title: str
    main_features: list[str] = Field(max_length=5)
    keywords: list[str]


class Match(BaseModel):
    type: str
    title: str
    link: str
    text: str
    similarity: int = Field(ge=0, le=100)


class ScoreBreakdown(BaseModel):
    closest_match_deduction: float
    crowd_deduction: float
    feature_overlap_deduction: float


class IdeaReport(BaseModel):
    id: str
    idea_text: str
    idea_card: IdeaCard
    matches: list[Match]
    compare_table: list[dict]
    uniqueness_score: int = Field(ge=0, le=100)
    score_breakdown: ScoreBreakdown
    created_at: str
    partial: bool = False
    errors: list[str] = Field(default_factory=list)
