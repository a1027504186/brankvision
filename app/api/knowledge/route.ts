function pythonApiUrl(path: string) {
  const base = process.env.PYTHON_AI_API_URL?.replace(/\/$/, "");
  return base ? `${base}${path}` : null;
}

function serviceUnavailable() {
  return Response.json(
    { error: "知识库服务尚未连接，请先完成 Python AI 后端部署。" },
    { status: 503 },
  );
}

function headers(contentType?: string) {
  return {
    ...(contentType ? { "Content-Type": contentType } : {}),
    ...(process.env.PYTHON_AI_API_TOKEN
      ? { Authorization: `Bearer ${process.env.PYTHON_AI_API_TOKEN}` }
      : {}),
  };
}

export async function GET(request: Request) {
  const service = pythonApiUrl("/v1/knowledge/documents");
  if (!service) return serviceUnavailable();
  const brandId = new URL(request.url).searchParams.get("brandId");
  const url = brandId ? `${service}?brand_id=${encodeURIComponent(brandId)}` : service;
  try {
    const response = await fetch(url, {
      headers: headers(),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
    });
  } catch {
    return serviceUnavailable();
  }
}

export async function POST(request: Request) {
  const service = pythonApiUrl("/v1/knowledge/documents");
  if (!service) return serviceUnavailable();
  const form = await request.formData();
  try {
    const response = await fetch(service, {
      method: "POST",
      headers: headers(),
      body: form,
      signal: AbortSignal.timeout(60_000),
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
    });
  } catch {
    return serviceUnavailable();
  }
}
