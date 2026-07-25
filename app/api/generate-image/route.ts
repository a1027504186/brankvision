type ImageRequest = {
  prompt?: string;
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  referenceImages?: string[];
};

function imageApiConfig() {
  const apiKey = process.env.IMAGE_API_KEY;
  const baseUrl = (process.env.IMAGE_API_BASE_URL || "https://grsaiapi.com").replace(/\/$/, "");
  return { apiKey, baseUrl };
}

export async function GET(request: Request) {
  const { apiKey, baseUrl } = imageApiConfig();
  if (!apiKey) return Response.json({ error: "生图 API 尚未配置" }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[a-zA-Z0-9-]{10,100}$/.test(id)) return Response.json({ error: "任务 ID 无效" }, { status: 400 });

  const response = await fetch(`${baseUrl}/v1/api/result?id=${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) return Response.json({ error: "查询生成结果失败" }, { status: 502 });

  const data = await response.json();
  const url = data?.results?.[0]?.url;
  return Response.json({ id: data?.id || id, status: data?.status || "pending", progress: data?.progress ?? 0, ...(url ? { url } : {}) });
}

export async function POST(request: Request) {
  const { apiKey, baseUrl } = imageApiConfig();
  if (!apiKey) return Response.json({ error: "生图 API 尚未配置" }, { status: 503 });

  let input: ImageRequest;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "请求格式无效" }, { status: 400 });
  }

  const prompt = input.prompt?.trim();
  if (!prompt) return Response.json({ error: "缺少图片描述" }, { status: 400 });
  if (prompt.length > 3000) return Response.json({ error: "图片描述过长" }, { status: 400 });

  const response = await fetch(`${baseUrl}/v1/api/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.IMAGE_API_MODEL || "nano-banana-2",
      prompt,
      images: (input.referenceImages ?? []).slice(0, 4),
      aspectRatio: input.aspectRatio || "1:1",
      imageSize: "1K",
      replyType: "json",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Image generation failed", response.status, detail.slice(0, 500));
    if (/insufficient credits/i.test(detail)) {
      return Response.json({ error: "生图账户额度不足", code: "IMAGE_CREDITS_EXHAUSTED" }, { status: 402 });
    }
    return Response.json({ error: "图片生成暂时失败" }, { status: 502 });
  }

  const data = await response.json();
  const url = data?.results?.[0]?.url;
  if (data?.status === "succeeded" && url) {
    return Response.json({ id: data.id, status: "succeeded", url });
  }

  return Response.json({ id: data?.id, status: data?.status || "pending", progress: data?.progress ?? 0 }, { status: 202 });
}
