import { randomUUID } from "node:crypto";
import type { AgentAssetKind } from "./types";

type AssetPayload = {
  body: ArrayBuffer | Uint8Array | string;
  contentType: string;
  extension: string;
};

async function getRuntimeBucket(): Promise<R2Bucket | null> {
  try {
    const runtime = await import("cloudflare:workers");
    return runtime.env.GENERATED_ASSETS || null;
  } catch {
    return null;
  }
}

function payloadFromDataUrl(url: string): AssetPayload | null {
  const match = url.match(/^data:([^;,]+)(;base64)?,(.*)$/s);
  if (!match) return null;
  const contentType = match[1] || "application/octet-stream";
  const body = match[2]
    ? Uint8Array.from(Buffer.from(match[3], "base64"))
    : decodeURIComponent(match[3]);
  return {
    body,
    contentType,
    extension: contentType.includes("svg") ? "svg" : contentType.includes("png") ? "png" : "bin",
  };
}

async function readAssetPayload(url: string): Promise<AssetPayload> {
  const inline = payloadFromDataUrl(url);
  if (inline) return inline;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`ASSET_SOURCE_UNAVAILABLE:${response.status}`);
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const extension = contentType.includes("svg")
    ? "svg"
    : contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
  return { body: await response.arrayBuffer(), contentType, extension };
}

export async function persistGeneratedAsset(sourceUrl: string, sessionId: string, kind: AgentAssetKind) {
  const payload = await readAssetPayload(sourceUrl);
  const filename = `${kind}-${randomUUID()}.${payload.extension}`;
  const key = `${sessionId}/${filename}`;
  const bucket = await getRuntimeBucket();

  if (bucket) {
    await bucket.put(key, payload.body, {
      httpMetadata: { contentType: payload.contentType },
      customMetadata: { sessionId, kind },
    });
    return `/api/agent/assets?key=${encodeURIComponent(key)}`;
  }

  const [{ mkdir, writeFile }, path] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  const directory = path.join(process.cwd(), "public", "generated");
  await mkdir(directory, { recursive: true });
  const localBody = typeof payload.body === "string" ? payload.body : Buffer.from(payload.body);
  await writeFile(path.join(directory, filename), localBody);
  return `/generated/${filename}`;
}

export async function loadGeneratedAsset(key: string) {
  if (!/^[a-f0-9-]{20,80}\/[a-z0-9-]+\.(?:svg|png|webp|jpg)$/i.test(key)) return null;
  const bucket = await getRuntimeBucket();
  if (!bucket) return null;
  return bucket.get(key);
}
