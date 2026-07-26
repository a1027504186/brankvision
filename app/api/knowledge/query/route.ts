export async function POST(request: Request) {
  const base = process.env.PYTHON_AI_API_URL?.replace(/\/$/, "");
  if (!base) {
    return Response.json(
      { error: "知识库服务尚未连接，请先完成 Python AI 后端部署。" },
      { status: 503 },
    );
  }
  const body = await request.text();
  try {
    const response = await fetch(`${base}/v1/knowledge/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.PYTHON_AI_API_TOKEN
          ? { Authorization: `Bearer ${process.env.PYTHON_AI_API_TOKEN}` }
          : {}),
      },
      body,
      signal: AbortSignal.timeout(30_000),
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
    });
  } catch {
    return Response.json({ error: "知识库服务暂时不可用。" }, { status: 503 });
  }
}
