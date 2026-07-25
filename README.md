# SPECTRUM 智能品牌系统

SPECTRUM 是面向个人品牌、店铺品牌和产品品牌的 AI 品牌智能体。它把品牌定位、
视觉规范、Logo 与多平台营销物料串成一条可追踪、可恢复的生产流程，并在美团、
小红书和微信模拟界面中实时预览结果。

## 当前生产架构

```text
浏览器
  └─ Sites / Next.js 前端
       ├─ LangGraph.js 交互与工具执行
       ├─ Cloudflare D1 / R2 降级存储
       └─ Python AI API
            ├─ FastAPI + Pydantic
            ├─ LangGraph 路由与上下文编排
            ├─ PostgreSQL / SQLAlchemy
            ├─ Redis 状态、缓存与任务进度
            ├─ 文档解析、混合检索、Rerank、引用与评测
            └─ S3 兼容对象存储
```

前端优先调用 Python 路由与 RAG 服务；Python 服务不可用时，自动回退到原有
TypeScript 路由和 Sites 数据层，避免整个演示因单点故障中断。

## Python AI 后端

目录：`services/ai-api`

主要接口：

- `POST /v1/sessions`：创建用户、品牌和智能体会话
- `POST /v1/sessions/{id}/turn`：运行一次 LangGraph 智能体
- `POST /v1/route`：供前端调用的意图路由
- `POST /v1/sessions/mirror`：镜像前端会话及资产
- `POST /v1/knowledge/documents`：上传 PDF、DOCX、Markdown 或 TXT
- `POST /v1/knowledge/query`：混合召回、Rerank，并返回可核验引用
- `POST /v1/knowledge/evaluate`：计算 Recall@K 和 MRR
- `GET /metrics`：暴露智能体运行、延迟、路由和资产指标
- `GET /health`、`GET /ready`：部署健康检查

### 本地全栈启动

已安装 Docker 时：

```bash
docker compose up --build
```

这会启动 Python AI API、PostgreSQL、Redis 和 MinIO。前端另开终端运行：

```bash
npm install
npm run dev
```

不使用 Docker 时，可在 `services/ai-api` 创建 Python 3.11+ 虚拟环境并运行：

```bash
pip install ".[dev]"
uvicorn app.main:app --reload --port 8000
pytest -q
```

### 环境变量

复制根目录和 `services/ai-api` 下的 `.env.example`。密钥只放在部署平台的
Secret 管理中，不提交到 Git。

- `DATABASE_URL`：PostgreSQL；开发环境可使用 SQLite
- `REDIS_URL`：Redis 连接地址；缺省时使用进程内缓存
- `PYTHON_AI_API_URL`：前端访问 Python 服务的地址
- `DEEPSEEK_API_KEY`：生文与高级路由
- `IMAGE_API_KEY`：生图服务
- `EMBEDDING_*`：外部向量模型；缺省时使用可复现的本地向量
- `S3_*`：Cloudflare R2、MinIO 或其他 S3 兼容对象存储

## 部署

- 前端：由 `.openai/hosting.json` 管理并部署到 OpenAI Sites。
- Python/数据库/Redis：根目录 `render.yaml` 可在 Render Blueprint 中创建。
- 对象存储：生产环境填写一组 S3 兼容凭证；本地 Compose 使用 MinIO。
- CI：`.github/workflows/ci.yml` 同时执行 TypeScript 全链路测试、
  Python API/RAG 测试和 Ruff 静态检查。
- HTTPS：Sites 与 Render 公网服务均由平台终止 TLS。

Render 完成后，将前端的 `PYTHON_AI_API_URL` 配置为 Render 服务 HTTPS 地址，
重新保存并部署 Sites 版本即可。

## TypeScript 智能体架构

SPECTRUM uses a LangGraph.js state graph to coordinate brand discovery and
multi-platform asset generation:

- `route_intent` classifies questions, corrections, retries, platform switches,
  workflow input, and explicit asset-generation requests.
- specialized execution nodes preserve the current session instead of forcing
  every message through a fixed wizard.
- the image tool receives the complete brand style system and the original
  logo reference before creating Meituan, Xiaohongshu, or WeChat assets.
- `retrieve_context` retrieves global brand rules and platform-specific
  delivery guidance before execution.
- `quality_gate` verifies brand tokens, asset persistence, asset kind, and
  preview synchronization.
- each graph turn writes a structured trace containing route, action, checks,
  duration, and failure information.

Production sessions, asset metadata, and traces are persisted in Cloudflare D1.
Generated image bytes are stored in R2. Local development automatically falls
back to atomic JSON session files and `public/generated` assets when the
bindings are unavailable.

The read-only diagnostics endpoint is:

```text
GET /api/agent/diagnostics?id=<session-id>
```

Run the deterministic agent evaluation suite without calling a real text model:

```bash
npm run test:agent
```

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the starter and verify its rendered loading skeleton
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
