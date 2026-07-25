import asyncio
import re
from collections import Counter
from time import perf_counter

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .embeddings import cosine_similarity, embedding_service
from .models import KnowledgeChunk, KnowledgeDocument
from .schemas import Citation, RetrievalResponse


def _terms(text: str) -> Counter[str]:
    normalized = text.lower()
    words = re.findall(r"[a-z0-9]+|[\u4e00-\u9fff]", normalized)
    chinese = [item for item in words if re.fullmatch(r"[\u4e00-\u9fff]", item)]
    words.extend("".join(chinese[index : index + 2]) for index in range(len(chinese) - 1))
    return Counter(words)


def _lexical_score(query: str, content: str) -> float:
    query_terms = _terms(query)
    document_terms = _terms(content)
    if not query_terms:
        return 0.0
    matched = sum(min(count, document_terms.get(term, 0)) for term, count in query_terms.items())
    return matched / sum(query_terms.values())


async def retrieve(
    db: AsyncSession,
    query: str,
    brand_id: str | None = None,
    top_k: int = 5,
) -> RetrievalResponse:
    started = perf_counter()
    statement = (
        select(KnowledgeChunk, KnowledgeDocument)
        .join(KnowledgeDocument, KnowledgeChunk.document_id == KnowledgeDocument.id)
        .order_by(KnowledgeChunk.document_id, KnowledgeChunk.chunk_index)
    )
    if brand_id:
        statement = statement.where(
            (KnowledgeChunk.brand_id == brand_id) | (KnowledgeChunk.brand_id.is_(None))
        )
    rows = (await db.execute(statement)).all()
    if not rows:
        return RetrievalResponse(answer_context="", citations=[], latency_ms=int((perf_counter() - started) * 1000))

    query_embedding = (await embedding_service.embed([query]))[0]
    ranked: list[tuple[float, KnowledgeChunk, KnowledgeDocument]] = []
    for chunk, document in rows:
        vector_score = cosine_similarity(query_embedding, list(chunk.embedding or []))
        lexical_score = _lexical_score(query, chunk.content)
        # Hybrid retrieval plus a small title/source prior.
        title_score = _lexical_score(query, f"{document.title} {document.source_name}")
        score = vector_score * 0.58 + lexical_score * 0.32 + title_score * 0.10
        ranked.append((score, chunk, document))

    # Lightweight reranker: prioritize exact phrase and early, concise matches.
    query_normalized = re.sub(r"\s+", "", query.lower())
    reranked: list[tuple[float, KnowledgeChunk, KnowledgeDocument]] = []
    for score, chunk, document in sorted(ranked, reverse=True, key=lambda item: item[0])[: max(top_k * 4, 20)]:
        compact = re.sub(r"\s+", "", chunk.content.lower())
        phrase_bonus = 0.15 if query_normalized and query_normalized in compact else 0
        density_bonus = min(0.08, _lexical_score(query, chunk.content) * 0.08)
        reranked.append((score + phrase_bonus + density_bonus, chunk, document))

    selected = sorted(reranked, reverse=True, key=lambda item: item[0])[:top_k]
    citations = [
        Citation(
            chunk_id=chunk.id,
            document_id=document.id,
            source_name=document.source_name,
            title=document.title,
            excerpt=chunk.content[:320],
            score=round(score, 4),
        )
        for score, chunk, document in selected
    ]
    context = "\n\n".join(
        f"[来源{index + 1}：{citation.title} / {citation.source_name}]\n{citation.excerpt}"
        for index, citation in enumerate(citations)
    )
    return RetrievalResponse(
        answer_context=context,
        citations=citations,
        latency_ms=int((perf_counter() - started) * 1000),
    )


async def evaluate_retrieval(
    db: AsyncSession,
    cases: list[dict],
    brand_id: str | None,
    top_k: int,
) -> dict:
    async def evaluate_case(item: dict) -> dict:
        result = await retrieve(db, item["query"], brand_id=brand_id, top_k=top_k)
        returned = [citation.document_id for citation in result.citations]
        relevant = set(item["relevant_document_ids"])
        hits = [index for index, document_id in enumerate(returned) if document_id in relevant]
        return {
            "query": item["query"],
            "returned_document_ids": returned,
            "hit": bool(hits),
            "reciprocal_rank": 1 / (hits[0] + 1) if hits else 0.0,
        }

    details = []
    # A shared AsyncSession must not execute concurrently.
    for case in cases:
        details.append(await evaluate_case(case))
        await asyncio.sleep(0)
    return {
        "cases": len(details),
        "recall_at_k": sum(1 for item in details if item["hit"]) / len(details),
        "mean_reciprocal_rank": sum(item["reciprocal_rank"] for item in details) / len(details),
        "details": details,
    }

