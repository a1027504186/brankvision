from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

BrandType = Literal["personal", "store", "product"]
Platform = Literal["meituan", "xiaohongshu", "wechat"]
Style = Literal["warm", "playful", "premium"]
Route = Literal["workflow", "question", "retry", "skip", "switch_platform", "generate_asset"]


class BrandCreate(BaseModel):
    brand_type: BrandType = "personal"
    category: str = Field(min_length=1, max_length=120)
    user_external_id: str | None = Field(default=None, max_length=255)


class MessageInput(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class RouteDecision(BaseModel):
    route: Route
    platform: Platform | None = None
    asset_kind: str | None = None
    confidence: float = Field(ge=0, le=1)
    reason: str


class Citation(BaseModel):
    chunk_id: str
    document_id: str
    source_name: str
    title: str
    excerpt: str
    score: float


class RetrievalResponse(BaseModel):
    answer_context: str
    citations: list[Citation]
    latency_ms: int


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID | str
    brand_id: UUID | str
    stage: str
    payload: dict
    created_at: datetime
    updated_at: datetime


class TurnResponse(BaseModel):
    session: SessionResponse
    route: RouteDecision
    reply: str
    citations: list[Citation] = []
    options: list[str] = []
    trace_id: str


class KnowledgeUploadResponse(BaseModel):
    document_id: str
    title: str
    source_name: str
    chunks: int


class KnowledgeQuery(BaseModel):
    query: str = Field(min_length=1, max_length=4000)
    brand_id: str | None = None
    top_k: int = Field(default=5, ge=1, le=20)


class EvaluationCase(BaseModel):
    query: str
    relevant_document_ids: list[str]


class RetrievalEvaluationRequest(BaseModel):
    cases: list[EvaluationCase] = Field(min_length=1, max_length=200)
    brand_id: str | None = None
    top_k: int = Field(default=5, ge=1, le=20)


class RetrievalEvaluationResponse(BaseModel):
    cases: int
    recall_at_k: float
    mean_reciprocal_rank: float
    details: list[dict]


class ExternalRouteRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    stage: str = Field(min_length=1, max_length=64)
    session: dict = Field(default_factory=dict)


class SessionMirrorRequest(BaseModel):
    session: dict
