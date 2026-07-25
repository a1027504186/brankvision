import { optionsFor } from "@/lib/agent/orchestrator";
import { runAgentGraphTurn } from "@/lib/agent/graph";
import { loadSession } from "@/lib/agent/store";

export async function POST(request: Request) {
  const input = await request.json().catch(() => ({}));
  const sessionId = String(input.sessionId || "");
  const message = String(input.message || "").trim();
  if (!message) return Response.json({ error: "缺少用户输入" }, { status: 400 });
  const session = await loadSession(sessionId);
  if (!session) return Response.json({ error: "会话不存在" }, { status: 404 });
  const result = await runAgentGraphTurn(session, message.slice(0, 4000));
  return Response.json({ ...result, options: optionsFor(result.session) });
}
