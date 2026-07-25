import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AgentBrandType, AgentSession } from "./types";

const DATA_DIR = path.join(process.cwd(), ".agent-data", "sessions");
let schemaReady: Promise<void> | undefined;

async function getRuntimeDatabase(): Promise<D1Database | null> {
  try {
    const runtime = await import("cloudflare:workers");
    return runtime.env.DB || null;
  } catch {
    return null;
  }
}

async function ensureDatabaseSchema(db: D1Database) {
  schemaReady ||= (async () => {
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS agent_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        brand_type TEXT NOT NULL,
        category TEXT NOT NULL,
        stage TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`),
      db.prepare("CREATE INDEX IF NOT EXISTS agent_sessions_updated_at_idx ON agent_sessions(updated_at)"),
      db.prepare(`CREATE TABLE IF NOT EXISTS agent_assets (
        session_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        name TEXT NOT NULL,
        size TEXT NOT NULL,
        platform TEXT NOT NULL,
        url TEXT NOT NULL,
        prompt TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY(session_id, kind),
        FOREIGN KEY(session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE
      )`),
      db.prepare("CREATE INDEX IF NOT EXISTS agent_assets_session_idx ON agent_assets(session_id)"),
      db.prepare(`CREATE TABLE IF NOT EXISTS agent_traces (
        id TEXT PRIMARY KEY NOT NULL,
        session_id TEXT NOT NULL,
        input TEXT NOT NULL,
        route TEXT NOT NULL,
        action TEXT,
        asset_kind TEXT,
        platform TEXT,
        status TEXT NOT NULL,
        checks TEXT NOT NULL,
        error TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        duration_ms INTEGER,
        FOREIGN KEY(session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE
      )`),
      db.prepare("CREATE INDEX IF NOT EXISTS agent_traces_session_started_idx ON agent_traces(session_id, started_at)"),
      db.prepare("CREATE INDEX IF NOT EXISTS agent_traces_route_status_idx ON agent_traces(route, status)"),
    ]);
  })().catch((error) => {
    schemaReady = undefined;
    throw error;
  });
  await schemaReady;
}

async function loadSessionFromDatabase(db: D1Database, id: string) {
  await ensureDatabaseSchema(db);
  const row = await db.prepare("SELECT payload FROM agent_sessions WHERE id = ? LIMIT 1").bind(id).first<{ payload: string }>();
  return row ? JSON.parse(row.payload) as AgentSession : null;
}

async function saveSessionToDatabase(db: D1Database, session: AgentSession) {
  await ensureDatabaseSchema(db);
  const statements = [
    db.prepare(`INSERT INTO agent_sessions (id, brand_type, category, stage, payload, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        brand_type = excluded.brand_type,
        category = excluded.category,
        stage = excluded.stage,
        payload = excluded.payload,
        updated_at = excluded.updated_at`)
      .bind(session.id, session.brandType, session.category, session.stage, JSON.stringify(session), session.createdAt, session.updatedAt),
    ...session.assets.map((asset) =>
      db.prepare(`INSERT INTO agent_assets (session_id, kind, name, size, platform, url, prompt, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id, kind) DO UPDATE SET
          name = excluded.name,
          size = excluded.size,
          platform = excluded.platform,
          url = excluded.url,
          prompt = excluded.prompt,
          created_at = excluded.created_at`)
        .bind(session.id, asset.id, asset.name, asset.size, asset.platform, asset.url, asset.prompt, asset.createdAt)
    ),
    ...(session.traces || []).slice(-100).map((trace) =>
      db.prepare(`INSERT INTO agent_traces
        (id, session_id, input, route, action, asset_kind, platform, status, checks, error, started_at, completed_at, duration_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          action = excluded.action,
          asset_kind = excluded.asset_kind,
          platform = excluded.platform,
          status = excluded.status,
          checks = excluded.checks,
          error = excluded.error,
          completed_at = excluded.completed_at,
          duration_ms = excluded.duration_ms`)
        .bind(
          trace.id,
          session.id,
          trace.input,
          trace.route,
          trace.action || null,
          trace.assetKind || null,
          trace.platform || null,
          trace.status,
          JSON.stringify(trace.checks),
          trace.error || null,
          trace.startedAt,
          trace.completedAt || null,
          trace.durationMs ?? null,
        )
    ),
  ];
  await db.batch(statements);
}

function sessionPath(id: string) {
  if (!/^[a-f0-9-]{20,80}$/i.test(id)) throw new Error("INVALID_SESSION_ID");
  return path.join(DATA_DIR, `${id}.json`);
}

export async function createSession(brandType: AgentBrandType, category: string): Promise<AgentSession> {
  const now = new Date().toISOString();
  const labels = { personal: "个人品牌", store: "店铺品牌", product: "产品品牌" } as const;
  const questions = {
    personal: "先告诉我，你希望用什么名字被记住？可以是本名、昵称或个人品牌名。",
    store: "先告诉我店铺叫什么名字。如果有 Slogan，也可以一起告诉我。",
    product: "先告诉我产品叫什么名字。如果还没有正式名称，也可以先用项目代号。",
  } as const;
  const session: AgentSession = {
    id: randomUUID(),
    brandType,
    category,
    stage: "name",
    brand: { name: "", positioning: "" },
    messages: [
      { id: randomUUID(), role: "assistant", content: "你好，我是 SPECTRUM 品牌智能体。我会梳理定位、建立视觉体系，并按需调用工具生成品牌资产。", createdAt: now },
      { id: randomUUID(), role: "user", content: `${labels[brandType]} · ${category}`, createdAt: now },
      { id: randomUUID(), role: "assistant", content: `收到，我们先建立一个「${labels[brandType]}」。${questions[brandType]}`, createdAt: now },
    ],
    assets: [],
    progress: { brandReady: false, meituanCover: false, meituanService: false, xhsProfile: false, xhsPoster: false, wechatCover: false, wechatPoster: false },
    createdAt: now,
    updatedAt: now,
  };
  await saveSession(session);
  return session;
}

export async function loadSession(id: string): Promise<AgentSession | null> {
  const database = await getRuntimeDatabase();
  if (database) return loadSessionFromDatabase(database, id);
  try {
    return JSON.parse(await readFile(sessionPath(id), "utf8")) as AgentSession;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function saveSession(session: AgentSession) {
  session.updatedAt = new Date().toISOString();
  const database = await getRuntimeDatabase();
  if (database) {
    await saveSessionToDatabase(database, session);
    return;
  }
  await mkdir(DATA_DIR, { recursive: true });
  const target = sessionPath(session.id);
  const temporary = `${target}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(session, null, 2), "utf8");
  await rename(temporary, target);
}
