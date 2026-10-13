from pydantic import BaseModel, Field


class ProblemRequest(BaseModel):
    raw_text: str = Field(
        min_length=10,
        max_length=5000,
        description="The problem described by the user",
    )
    language: str = Field(
        default="auto",
        description="Language used by the user",
    )


class ProblemCard(BaseModel):
    title: str
    who: str
    pain: str
    frequency: str
    workaround: str
    category: str


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
    partial: bool = False
    errors: list[str] = Field(default_factory=list)
