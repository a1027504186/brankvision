type Ratio = "1:1" | "3:4" | "4:3" | "9:16";

export class ImageToolError extends Error {
  constructor(public code: string) { super(code); }
}

export async function generateImage(prompt: string, aspectRatio: Ratio, referenceImages: string[] = []) {
  const apiKey = process.env.IMAGE_API_KEY;
  const baseUrl = (process.env.IMAGE_API_BASE_URL || "https://grsaiapi.com").replace(/\/$/, "");
  if (!apiKey) throw new ImageToolError("IMAGE_API_NOT_CONFIGURED");
  const response = await fetch(`${baseUrl}/v1/api/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.IMAGE_API_MODEL || "nano-banana-2", prompt, images: referenceImages.slice(0, 4), aspectRatio, imageSize: "1K", replyType: "json" }),
  });
  const raw = await response.text();
  if (!response.ok) {
    if (/insufficient credits/i.test(raw)) throw new ImageToolError("IMAGE_CREDITS_EXHAUSTED");
    throw new ImageToolError("IMAGE_PROVIDER_FAILED");
  }
  let data: { id?: string; status?: string; results?: Array<{ url?: string }> };
  try { data = JSON.parse(raw); } catch { throw new ImageToolError("IMAGE_PROVIDER_INVALID_RESPONSE"); }
  let url = data.results?.[0]?.url;
  if (url) return url;
  if (!data.id) throw new ImageToolError("IMAGE_TASK_MISSING");
  for (let attempt = 0; attempt < 24; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const result = await fetch(`${baseUrl}/v1/api/result?id=${encodeURIComponent(data.id)}`, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!result.ok) continue;
    const status = await result.json();
    url = status?.results?.[0]?.url;
    if (url) return url;
    if (status?.status === "failed") throw new ImageToolError("IMAGE_PROVIDER_FAILED");
  }
  throw new ImageToolError("IMAGE_TASK_TIMEOUT");
}
