import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const agentSessions = sqliteTable("agent_sessions", {
  id: text("id").primaryKey(),
  brandType: text("brand_type").notNull(),
  category: text("category").notNull(),
  stage: text("stage").notNull(),
  payload: text("payload").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("agent_sessions_updated_at_idx").on(table.updatedAt),
]);

export const agentAssets = sqliteTable("agent_assets", {
  sessionId: text("session_id").notNull().references(() => agentSessions.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  name: text("name").notNull(),
  size: text("size").notNull(),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  prompt: text("prompt").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.sessionId, table.kind] }),
  index("agent_assets_session_idx").on(table.sessionId),
]);

export const agentTraces = sqliteTable("agent_traces", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => agentSessions.id, { onDelete: "cascade" }),
  input: text("input").notNull(),
  route: text("route").notNull(),
  action: text("action"),
  assetKind: text("asset_kind"),
  platform: text("platform"),
  status: text("status").notNull(),
  checks: text("checks").notNull(),
  error: text("error"),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  durationMs: integer("duration_ms"),
}, (table) => [
  index("agent_traces_session_started_idx").on(table.sessionId, table.startedAt),
  index("agent_traces_route_status_idx").on(table.route, table.status),
]);
