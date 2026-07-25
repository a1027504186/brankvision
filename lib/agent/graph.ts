import { Annotation, END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { randomUUID } from "node:crypto";
import { routeIntent, runAgentTurn, validateBrandAsset, type RoutedIntent } from "./orchestrator";
import { saveSession } from "./store";
import type { AgentAsset, AgentSession, AgentTrace } from "./types";
import { formatKnowledgeContext, retrieveBrandKnowledge, type BrandKnowledgeDocument } from "./knowledge";
import { mirrorSessionToPython, retrieveWithPython, routeWithPython } from "./python-runtime";

export type AgentTurnResult = {
  session: AgentSession;
  generatedAsset?: AgentAsset;
  actionType?: AgentTrace["action"];
};

export type AgentTurnAudit = {
  route: RoutedIntent["intent"];
  passed: boolean;
  checks: string[];
};

const AgentGraphState = Annotation.Root({
  session: Annotation<AgentSession>(),
  input: Annotation<string>(),
  route: Annotation<RoutedIntent | undefined>(),
  result: Annotation<AgentTurnResult | undefined>(),
  audit: Annotation<AgentTurnAudit | undefined>(),
  trace: Annotation<AgentTrace | undefined>(),
  knowledge: Annotation<Array<BrandKnowledgeDocument & { score: number }>>({
    reducer: (_current, update) => update,
    default: () => [],
  }),
});

type GraphState = typeof AgentGraphState.State;

async function routeNode(state: GraphState) {
  const route = (await routeWithPython(state.session, state.input)) || await routeIntent(state.session, state.input);
  const now = new Date().toISOString();
  return {
    route,
    trace: {
      id: randomUUID(),
      input: state.input,
      route: route.intent,
      assetKind: route.assetKind,
      platform: route.platform,
      status: "running",
      checks: [],
      startedAt: now,
    } satisfies AgentTrace,
  };
}

async function executeNode(state: GraphState) {
  if (!state.route) throw new Error("AGENT_ROUTE_MISSING");
  return { result: await runAgentTurn(state.session, state.input, state.route, formatKnowledgeContext(state.knowledge)) };
}

async function retrievalNode(state: GraphState) {
  const knowledge = (await retrieveWithPython(state.session, state.input)) || retrieveBrandKnowledge(
    state.session,
    state.input,
    state.route?.platform || state.session.brand.platform,
    state.route?.assetKind,
  );
  return {
    knowledge,
    trace: state.trace ? { ...state.trace, retrieval: knowledge.map((document) => document.id) } : undefined,
  };
}

function qualityNode(state: GraphState) {
  const route = state.route?.intent || "workflow";
  const checks: string[] = [];
  let passed = Boolean(state.result?.session);

  if (state.route?.intent === "generate_asset") {
    const expectedKind = state.route.assetKind;
    const generated = state.result?.generatedAsset;
    const persisted = expectedKind
      ? state.result?.session.assets.some((asset) => asset.id === expectedKind && Boolean(asset.url))
      : Boolean(generated?.url);
    checks.push(generated?.url ? "image-tool-returned-url" : "image-tool-did-not-return-url");
    checks.push(persisted ? "asset-persisted" : "asset-not-persisted");
    if (expectedKind) checks.push(generated?.id === expectedKind ? "asset-kind-matched" : "asset-kind-mismatched");
    const brandAudit = state.result?.session ? validateBrandAsset(state.result.session, generated) : { passed: false, checks: ["session-missing"] };
    checks.push(...brandAudit.checks);
    passed = passed && Boolean(generated?.url) && Boolean(persisted) && (!expectedKind || generated?.id === expectedKind) && brandAudit.passed;
  } else {
    checks.push("session-updated");
  }

  const completedAt = new Date();
  const trace = state.trace
    ? {
        ...state.trace,
        action: state.result?.actionType,
        status: passed ? "passed" : "failed",
        checks,
        error: passed
          ? undefined
          : [...(state.result?.session.messages || [])].reverse().find((message) => message.role === "tool")?.content,
        completedAt: completedAt.toISOString(),
        durationMs: Math.max(0, completedAt.getTime() - new Date(state.trace.startedAt).getTime()),
      } satisfies AgentTrace
    : undefined;

  return { audit: { route, passed, checks } satisfies AgentTurnAudit, trace };
}

function selectExecutionNode(state: GraphState) {
  return state.route?.intent || "workflow";
}

const checkpointer = new MemorySaver();

export const agentGraph = new StateGraph(AgentGraphState)
  .addNode("route_intent", routeNode)
  .addNode("retrieve_context", retrievalNode)
  .addNode("workflow", executeNode)
  .addNode("question", executeNode)
  .addNode("retry", executeNode)
  .addNode("skip", executeNode)
  .addNode("switch_platform", executeNode)
  .addNode("generate_asset", executeNode)
  .addNode("quality_gate", qualityNode)
  .addEdge(START, "route_intent")
  .addEdge("route_intent", "retrieve_context")
  .addConditionalEdges("retrieve_context", selectExecutionNode, {
    workflow: "workflow",
    question: "question",
    retry: "retry",
    skip: "skip",
    switch_platform: "switch_platform",
    generate_asset: "generate_asset",
  })
  .addEdge("workflow", "quality_gate")
  .addEdge("question", "quality_gate")
  .addEdge("retry", "quality_gate")
  .addEdge("skip", "quality_gate")
  .addEdge("switch_platform", "quality_gate")
  .addEdge("generate_asset", "quality_gate")
  .addEdge("quality_gate", END)
  .compile({ checkpointer });

export async function runAgentGraphTurn(session: AgentSession, input: string) {
  const output = await agentGraph.invoke(
    { session, input, route: undefined, result: undefined, audit: undefined, trace: undefined, knowledge: [] },
    { configurable: { thread_id: session.id } },
  );
  if (!output.result) throw new Error("AGENT_GRAPH_DID_NOT_RETURN_RESULT");
  if (output.trace) {
    output.result.session.traces = [...(output.result.session.traces || []).slice(-99), output.trace];
    await saveSession(output.result.session);
  }
  await mirrorSessionToPython(output.result.session);
  return { ...output.result, audit: output.audit };
}
