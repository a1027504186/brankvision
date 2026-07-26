# SPECTRUM 智能品牌系统

SPECTRUM 是面向个人品牌、店铺品牌和产品品牌的 AI 品牌智能体。它把品牌定位、
视觉规范、Logo 与多平台营销物料串成一条可追踪、可恢复的生产流程，并在美团、
小红书和微信模拟界面中实时预览结果。

## 项目状态

- 本地 MVP：已完成
- 前端演示版：已部署
- Python AI API：本地开发与测试已完成
- RAG：文档上传、解析、检索、Rerank、引用与评测已完成
- PostgreSQL、Redis、S3：代码与容器配置已完成
- 线上 Python、PostgreSQL、Redis：暂未部署

因此，本项目当前适合作为完整的本地作品集项目和前端在线演示。线上演示在
Python 服务不可用时会自动回退到 TypeScript 智能体，线上知识库暂不可用。

## 核心能力

- 通过自然语言完成品牌类型、名称、定位、风格与发布平台梳理
- 使用 LangGraph 识别提问、纠错、重试、平台切换和资产生成意图
- 生成 Logo、美团店铺图、小红书主页与海报、微信主页与朋友圈物料
- 将品牌色、字体、Logo 和定位作为生成约束，保持跨平台视觉一致性
- 在美团、小红书、微信模拟界面中同步预览已生成资产
- 上传品牌手册、产品资料与内容规范，并在生成前检索可核验依据
- 保存会话、品牌、资产、运行 Trace、Prompt 版本和知识库数据
- 在 Python 服务不可用时自动回退，保证演示流程不中断

## 系统架构

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

更完整的节点、数据流和降级策略见
[`docs/architecture.md`](docs/architecture.md)。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | React 19、Next.js 16、TypeScript、Tailwind CSS、Vinext/Vite |
| 智能体 | LangGraph.js、LangGraph Python、DeepSeek、Tool Calling、Context Engineering |
| AI 后端 | Python、FastAPI、Pydantic、asyncio |
| RAG | PDF/DOCX/Markdown/TXT 解析、混合检索、Rerank、引用、Recall@K、MRR |
| 数据 | PostgreSQL、SQLAlchemy Async、Redis、Cloudflare D1 |
| 文件 | S3 兼容对象存储、Cloudflare R2、MinIO |
| 工程化 | Docker Compose、pytest、Ruff、Node Test Runner、GitHub Actions |
| 托管 | OpenAI Sites、Render Blueprint 配置 |

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

## 智能体架构

SPECTRUM 使用状态图编排品牌梳理和多平台物料生产：

- `route_intent`：识别提问、纠错、重试、跳过、平台切换和生成任务
- `retrieve_context`：检索品牌规则和平台规范，并携带引用进入执行节点
- 专用执行节点：更新品牌状态、切换平台或调用生图工具
- `quality_gate`：检查品牌令牌、资产持久化、资产类型和预览同步
- Trace：记录路由、动作、检查项、耗时、Prompt 版本和错误信息

生产会话、资产元数据和 Trace 可写入 Cloudflare D1；生成图片可写入 R2。本地缺少
云端绑定时，会自动使用原子 JSON 会话文件和 `public/generated` 资产目录。

只读诊断接口：

```text
GET /api/agent/diagnostics?id=<session-id>
```

不调用真实模型即可运行确定性智能体回归：

```bash
npm run test:agent
```

## 快速开始

```bash
npm install
npm run dev
```

Python 服务可直接运行，也可以使用 Docker Compose 同时启动 PostgreSQL、Redis
和 MinIO。前端本地环境变量中设置：

```text
PYTHON_AI_API_URL=http://127.0.0.1:8000
```

## 测试

```bash
npm run test:all

cd services/ai-api
pytest -q
ruff check app tests
```

当前验收结果：

- 前端构建与智能体测试：12 项通过
- Python API、会话、RAG 与指标测试：4 项通过
- Ruff 静态检查：通过

## 项目资料

- [系统架构与数据流](docs/architecture.md)
- [路演与面试演示脚本](docs/demo-script.md)
- [项目验收与已知边界](docs/acceptance.md)
- [简历项目描述](docs/resume-project.md)

## 在线演示

[SPECTRUM 智能品牌系统](https://spectrum-brand-agent.wowkun.chatgpt.site)

当前演示站为访问受限版本。完整 Python RAG 能力请使用本地全栈环境运行。
