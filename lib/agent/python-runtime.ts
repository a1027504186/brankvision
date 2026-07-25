import type { AgentSession } from "./types";
import type { RoutedIntent } from "./orchestrator";
import type { BrandKnowledgeDocument } from "./knowledge";

function serviceUrl(path: string) {
  const base = process.env.PYTHON_AI_API_URL?.replace(/\/$/, "");
  return base ? `${base}${path}` : null;
}

async function postJson(path: string, body: unknown) {
  const url = serviceUrl(path);
  if (!url) return null;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.PYTHON_AI_API_TOKEN
        ? { Authorization: `Bearer ${process.env.PYTHON_AI_API_TOKEN}` }
        : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`PYTHON_AI_API_FAILED:${response.status}`);
  return response.json();
}

export async function routeWithPython(
  session: AgentSession,
  message: string,
): Promise<RoutedIntent | null> {
  try {
    const data = await postJson("/v1/route", {
      message,
      stage: session.stage,
      session,
    });
    if (!data) return null;
    return {
      intent: data.route,
      platform: data.platform,
      assetKind: data.asset_kind,
    } as RoutedIntent;
  } catch {
    return null;
  }
}

export async function retrieveWithPython(
  session: AgentSession,
  query: string,
): Promise<Array<BrandKnowledgeDocument & { score: number }> | null> {
  try {
    const data = await postJson("/v1/knowledge/query", {
      query: [
        query,
        `品牌：${session.brand.name}`,
        `定位：${session.brand.positioning}`,
        `品类：${session.category}`,
      ].join("\n"),
      top_k: 4,
    });
    if (!data) return null;
    return (data.citations || []).map(
      (citation: {
        chunk_id: string;
        title: string;
        excerpt: string;
        score: number;
      }) => ({
        id: citation.chunk_id,
        title: citation.title,
        platforms: ["all"] as const,
        assetKinds: ["all"] as const,
        content: citation.excerpt,
        score: citation.score,
      }),
    );
  } catch {
    return null;
  }
}

export async function mirrorSessionToPython(session: AgentSession) {
  try {
    await postJson("/v1/sessions/mirror", { session });
  } catch {
    // D1 remains authoritative when the Python service is temporarily unavailable.
  }
}

