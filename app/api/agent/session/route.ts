import { optionsFor } from "@/lib/agent/orchestrator";
import { createSession, loadSession } from "@/lib/agent/store";
import type { AgentBrandType } from "@/lib/agent/types";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  const session = await loadSession(id);
  if (!session) return Response.json({ error: "会话不存在" }, { status: 404 });
  return Response.json({ session, options: optionsFor(session) });
}

export async function POST(request: Request) {
  const input = await request.json().catch(() => ({}));
  const brandType: AgentBrandType = ["personal", "store", "product"].includes(input.brandType) ? input.brandType : "personal";
  const session = await createSession(brandType, String(input.category || "新品牌").slice(0, 80));
  return Response.json({ session, options: optionsFor(session) }, { status: 201 });
}
