import { summarizeAgentTraces } from "@/lib/agent/observability";
import { loadSession } from "@/lib/agent/store";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("id") || "";
  const session = await loadSession(sessionId);
  if (!session) return Response.json({ error: "会话不存在" }, { status: 404 });

  return Response.json({
    sessionId: session.id,
    brand: {
      type: session.brandType,
      name: session.brand.name,
      stage: session.stage,
      platform: session.brand.platform,
    },
    diagnostics: summarizeAgentTraces(session.traces),
  });
}
