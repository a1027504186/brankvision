import type { AgentTrace } from "./types";

export type AgentDiagnostics = {
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  passRate: number;
  averageDurationMs: number;
  routes: Record<string, number>;
  failedChecks: Record<string, number>;
  recentRuns: AgentTrace[];
};

export function summarizeAgentTraces(traces: AgentTrace[] = []): AgentDiagnostics {
  const completed = traces.filter((trace) => trace.status !== "running");
  const passedRuns = completed.filter((trace) => trace.status === "passed").length;
  const failedRuns = completed.filter((trace) => trace.status === "failed").length;
  const routes: Record<string, number> = {};
  const failedChecks: Record<string, number> = {};

  for (const trace of completed) {
    routes[trace.route] = (routes[trace.route] || 0) + 1;
    if (trace.status === "failed") {
      for (const check of trace.checks) {
        if (
          check.includes("missing") ||
          check.includes("not-") ||
          check.includes("mismatched") ||
          check.includes("did-not")
        ) {
          failedChecks[check] = (failedChecks[check] || 0) + 1;
        }
      }
    }
  }

  const durations = completed.map((trace) => trace.durationMs).filter((value): value is number => typeof value === "number");
  const averageDurationMs = durations.length
    ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
    : 0;

  return {
    totalRuns: completed.length,
    passedRuns,
    failedRuns,
    passRate: completed.length ? Number((passedRuns / completed.length).toFixed(4)) : 0,
    averageDurationMs,
    routes,
    failedChecks,
    recentRuns: completed.slice(-20).reverse(),
  };
}
