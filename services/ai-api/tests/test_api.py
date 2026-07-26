from io import BytesIO

import pytest

pytestmark = pytest.mark.asyncio


async def test_health_and_readiness(client):
    assert (await client.get("/health")).json()["status"] == "ok"
    assert (await client.get("/ready")).json()["status"] == "ready"


async def test_python_agent_session_flow(client):
    created = await client.post(
        "/v1/sessions",
        json={
            "brand_type": "personal",
            "category": "AI应用工程师",
            "user_external_id": "candidate@example.com",
        },
    )
    assert created.status_code == 201
    session_id = created.json()["id"]

    turn = await client.post(f"/v1/sessions/{session_id}/turn", json={"message": "一格"})
    assert turn.status_code == 200
    result = turn.json()
    assert result["route"]["route"] == "workflow"
    assert result["session"]["stage"] == "positioning"
    assert result["trace_id"]
    assert "一格" in result["reply"]


async def test_document_upload_vector_retrieval_citations_and_evaluation(client):
    upload = await client.post(
        "/v1/knowledge/documents",
        data={"title": "品牌视觉规范"},
        files={
            "file": (
                "brand-guide.txt",
                BytesIO("品牌主色为深蓝色。所有平台必须使用统一 Logo，禁止变形重绘。".encode()),
                "text/plain",
            )
        },
    )
    assert upload.status_code == 201
    document_id = upload.json()["document_id"]

    documents = await client.get("/v1/knowledge/documents")
    assert documents.status_code == 200
    assert documents.json()[0]["id"] == document_id
    assert documents.json()[0]["chunks"] == 1

    query = await client.post(
        "/v1/knowledge/query",
        json={"query": "Logo 可以变形吗？", "top_k": 3},
    )
    assert query.status_code == 200
    payload = query.json()
    assert payload["citations"]
    assert payload["citations"][0]["document_id"] == document_id
    assert "禁止变形" in payload["answer_context"]

    evaluation = await client.post(
        "/v1/knowledge/evaluate",
        json={
            "top_k": 3,
            "cases": [
                {
                    "query": "Logo 视觉规范",
                    "relevant_document_ids": [document_id],
                }
            ],
        },
    )
    assert evaluation.status_code == 200
    assert evaluation.json()["recall_at_k"] == 1.0
    assert evaluation.json()["mean_reciprocal_rank"] == 1.0


async def test_metrics_expose_agent_runs(client):
    response = await client.get("/metrics")
    assert response.status_code == 200
    assert "spectrum_agent_runs_total" in response.text
