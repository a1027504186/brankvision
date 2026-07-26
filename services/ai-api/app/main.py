from contextlib import asynccontextmanager
from pathlib import Path
from time import perf_counter

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from .agent import create_agent_session, get_session, run_turn
from .cache import state_cache
from .config import get_settings
from .database import create_schema, get_db
from .document_parser import chunk_text, parse_document
from .embeddings import embedding_service
from .models import AgentSession, AgentTrace, Asset, Brand, KnowledgeChunk, KnowledgeDocument
from .rag import evaluate_retrieval, retrieve
from .router import route_intent
from .schemas import (
    BrandCreate,
    ExternalRouteRequest,
    KnowledgeDocumentResponse,
    KnowledgeQuery,
    KnowledgeUploadResponse,
    MessageInput,
    RetrievalEvaluationRequest,
    RetrievalEvaluationResponse,
    RetrievalResponse,
    SessionMirrorRequest,
    SessionResponse,
    TurnResponse,
)
from .storage import object_storage

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await create_schema()
    await state_cache.connect()
    yield
    await state_cache.close()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Python/LangGraph AI runtime, RAG service and persistence layer for SPECTRUM.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": settings.app_name, "environment": settings.environment}


@app.get("/ready")
async def ready(db: AsyncSession = Depends(get_db)) -> dict:
    await db.execute(text("SELECT 1"))
    return {"status": "ready", "database": "ok", "cache": "redis" if settings.redis_url else "memory"}


@app.post("/v1/sessions", response_model=SessionResponse, status_code=201)
async def create_session(request: BrandCreate, db: AsyncSession = Depends(get_db)):
    return await create_agent_session(db, request)


@app.post("/v1/route")
async def external_route(request: ExternalRouteRequest):
    return await route_intent(request.message, request.stage, request.session)


@app.post("/v1/sessions/mirror")
async def mirror_session(request: SessionMirrorRequest, db: AsyncSession = Depends(get_db)):
    payload = request.session
    session_id = str(payload.get("id") or "")
    if not session_id:
        raise HTTPException(status_code=422, detail="SESSION_ID_REQUIRED")

    brand_payload = payload.get("brand") or {}
    brand = await db.get(Brand, session_id)
    if not brand:
        brand = Brand(
            id=session_id,
            brand_type=str(payload.get("brandType") or "personal"),
            category=str(payload.get("category") or "新品牌"),
        )
        db.add(brand)
    brand.name = str(brand_payload.get("name") or "")
    brand.positioning = str(brand_payload.get("positioning") or "")
    brand.style = brand_payload.get("style")
    brand.visual_tokens = brand_payload.get("visualTokens") or {}

    session = await db.get(AgentSession, session_id)
    if not session:
        session = AgentSession(id=session_id, brand_id=brand.id)
        db.add(session)
    session.stage = str(payload.get("stage") or "free")
    session.payload = payload

    for item in payload.get("assets") or []:
        existing = await db.scalar(
            select(Asset).where(
                Asset.session_id == session_id,
                Asset.kind == str(item.get("id") or ""),
            )
        )
        asset = existing or Asset(
            session_id=session_id,
            kind=str(item.get("id") or "unknown"),
            platform=str(item.get("platform") or "xiaohongshu"),
            name=str(item.get("name") or "品牌资产"),
            size=str(item.get("size") or ""),
            url=str(item.get("url") or ""),
            prompt=str(item.get("prompt") or ""),
        )
        if not existing:
            db.add(asset)
        else:
            asset.url = str(item.get("url") or existing.url)
            asset.prompt = str(item.get("prompt") or existing.prompt)
    await db.commit()
    await state_cache.set_json(f"session:{session_id}", payload)
    return {"status": "mirrored", "session_id": session_id}


@app.get("/v1/sessions/{session_id}", response_model=SessionResponse)
async def read_session(session_id: str, db: AsyncSession = Depends(get_db)):
    session = await get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="SESSION_NOT_FOUND")
    return session


@app.post("/v1/sessions/{session_id}/turn", response_model=TurnResponse)
async def turn(session_id: str, request: MessageInput, db: AsyncSession = Depends(get_db)):
    session = await get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="SESSION_NOT_FOUND")
    return await run_turn(db, session, request)


@app.post("/v1/knowledge/documents", response_model=KnowledgeUploadResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(""),
    brand_id: str | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
):
    started = perf_counter()
    data = await file.read(settings.max_upload_bytes + 1)
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="DOCUMENT_TOO_LARGE")
    try:
        parsed = parse_document(
            file.filename or "document.txt",
            file.content_type or "application/octet-stream",
            data,
        )
    except ValueError as error:
        raise HTTPException(status_code=415, detail=str(error)) from error
    chunks = chunk_text(parsed)
    if not chunks:
        raise HTTPException(status_code=422, detail="DOCUMENT_HAS_NO_TEXT")

    object_key, _ = await object_storage.put_bytes(
        data,
        file.content_type or "application/octet-stream",
        "knowledge",
        file.filename or "document.bin",
    )
    document = KnowledgeDocument(
        brand_id=brand_id,
        title=(title or Path(file.filename or "document").stem)[:255],
        source_name=(file.filename or "document")[:255],
        content_type=file.content_type or "application/octet-stream",
        object_key=object_key,
        status="indexing",
    )
    db.add(document)
    await db.flush()
    vectors = await embedding_service.embed(chunks)
    for index, (content, vector) in enumerate(zip(chunks, vectors, strict=True)):
        db.add(
            KnowledgeChunk(
                document_id=document.id,
                brand_id=brand_id,
                chunk_index=index,
                content=content,
                token_count=len(content),
                embedding=vector,
                metadata_json={"source_name": document.source_name, "title": document.title},
            )
        )
    document.status = "ready"
    await db.commit()
    await state_cache.set_progress(
        document.id,
        "completed",
        100,
        f"{len(chunks)} chunks indexed in {int((perf_counter() - started) * 1000)}ms",
    )
    return KnowledgeUploadResponse(
        document_id=document.id,
        title=document.title,
        source_name=document.source_name,
        chunks=len(chunks),
    )


@app.get("/v1/knowledge/documents", response_model=list[KnowledgeDocumentResponse])
async def list_documents(
    brand_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    chunk_counts = (
        select(
            KnowledgeChunk.document_id,
            func.count(KnowledgeChunk.id).label("chunks"),
        )
        .group_by(KnowledgeChunk.document_id)
        .subquery()
    )
    statement = (
        select(KnowledgeDocument, func.coalesce(chunk_counts.c.chunks, 0))
        .outerjoin(chunk_counts, chunk_counts.c.document_id == KnowledgeDocument.id)
        .order_by(KnowledgeDocument.created_at.desc())
        .limit(100)
    )
    if brand_id:
        statement = statement.where(KnowledgeDocument.brand_id == brand_id)
    rows = (await db.execute(statement)).all()
    return [
        KnowledgeDocumentResponse(
            id=document.id,
            title=document.title,
            source_name=document.source_name,
            content_type=document.content_type,
            status=document.status,
            chunks=int(chunks),
            created_at=document.created_at,
        )
        for document, chunks in rows
    ]


@app.post("/v1/knowledge/query", response_model=RetrievalResponse)
async def query_knowledge(request: KnowledgeQuery, db: AsyncSession = Depends(get_db)):
    return await retrieve(db, request.query, brand_id=request.brand_id, top_k=request.top_k)


@app.post("/v1/knowledge/evaluate", response_model=RetrievalEvaluationResponse)
async def evaluate_knowledge(
    request: RetrievalEvaluationRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await evaluate_retrieval(
        db,
        [item.model_dump() for item in request.cases],
        brand_id=request.brand_id,
        top_k=request.top_k,
    )
    return RetrievalEvaluationResponse(**result)


@app.get("/v1/tasks/{task_id}")
async def task_progress(task_id: str):
    value = await state_cache.get_json(f"task:{task_id}")
    if not value:
        raise HTTPException(status_code=404, detail="TASK_NOT_FOUND")
    return value


@app.get("/v1/objects/{filename}")
async def local_object(filename: str, prefix: str = "knowledge"):
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="INVALID_OBJECT_NAME")
    path = Path("data/objects") / prefix / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="OBJECT_NOT_FOUND")
    return FileResponse(path)


@app.get("/metrics", response_class=PlainTextResponse)
async def metrics(db: AsyncSession = Depends(get_db)) -> str:
    session_count = await db.scalar(select(func.count()).select_from(AgentSession)) or 0
    trace_count = await db.scalar(select(func.count()).select_from(AgentTrace)) or 0
    passed_count = (
        await db.scalar(
            select(func.count()).select_from(AgentTrace).where(AgentTrace.status == "passed")
        )
        or 0
    )
    return "\n".join(
        [
            "# HELP spectrum_sessions_total Number of persisted agent sessions.",
            "# TYPE spectrum_sessions_total gauge",
            f"spectrum_sessions_total {session_count}",
            "# HELP spectrum_agent_runs_total Number of agent runs.",
            "# TYPE spectrum_agent_runs_total counter",
            f"spectrum_agent_runs_total {trace_count}",
            "# HELP spectrum_agent_runs_passed_total Number of passed agent runs.",
            "# TYPE spectrum_agent_runs_passed_total counter",
            f"spectrum_agent_runs_passed_total {passed_count}",
            "",
        ]
    )
