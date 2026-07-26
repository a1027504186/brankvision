# 简历项目描述

## 推荐标题

**SPECTRUM AI 品牌智能体｜项目负责人 / AI 应用工程师**

项目地址：<https://github.com/a1027504186/brankvision.git>

## 技术标签

Python · FastAPI · Pydantic · LangGraph · RAG · DeepSeek · Tool Calling ·
Context Engineering · React · Next.js · TypeScript · PostgreSQL · SQLAlchemy ·
Redis · S3/R2 · Docker · pytest · GitHub Actions

## 项目介绍

面向个人品牌、小微商家和独立创作者，设计并实现从品牌定位、视觉规范、Logo 到
美团、小红书、微信营销物料的一站式 AI 品牌智能体，并在模拟平台界面中实时同步
品牌资产与内容效果。

## 项目职责

- 负责产品需求拆解、交互原型还原、智能体架构设计和前后端核心功能实现。
- 使用 LangGraph 构建状态化智能体，设计提问、纠错、重试、跳过、平台切换及资产
  生成路由，支持用户随时打断固定流程并保留会话上下文。
- 基于 FastAPI、Pydantic、SQLAlchemy Async 和 asyncio 实现 Python AI 服务，
  管理用户、品牌、会话、资产、Prompt 版本与 Agent Trace。
- 建设 RAG 知识库，支持 PDF、DOCX、Markdown、TXT 上传解析、文本分块、向量与
  关键词混合召回、轻量 Rerank、引用来源返回及 Recall@K/MRR 检索评测。
- 封装 DeepSeek 生文与第三方生图工具，将品牌定位、色彩、字体和原始 Logo 注入
  生成上下文，并通过质量门验证品牌令牌、资产落库和平台预览同步。
- 使用 PostgreSQL 持久化业务与知识库数据，Redis 管理短期状态、缓存和任务进度，
  S3/R2 保存上传文档与生成图片，并提供 SQLite、内存缓存和本地文件降级方案。
- 使用 React 19、Next.js 16、TypeScript 和 Tailwind CSS 实现对话工作台、品牌
  资产抽屉、知识库管理以及美团、小红书、微信高保真模拟预览。
- 建立自动化质量保障，覆盖智能体路由、RAG 检索、API、对象存储回退和生产构建；
  配置 Docker Compose、GitHub Actions、Render Blueprint 与 Sites 前端部署。

## 项目成果

- 完成可运行的全栈 MVP，将品牌创建、资产生成、知识检索和跨平台预览串成闭环。
- 前端与智能体 12 项测试、Python API/RAG 4 项测试全部通过，Ruff 静态检查通过。
- 实现 Python 服务不可用时自动回退至 TypeScript 智能体和本地/Cloudflare 数据
  层，降低外部模型、额度及网络异常对演示流程的影响。
- 完成 GitHub 开源共建和前端在线演示；Python、PostgreSQL、Redis 的生产部署配置
  已具备，当前以本地完整环境作为最终验收版本。

## 精简版

**SPECTRUM AI 品牌智能体｜AI 应用工程师**  
技术栈：Python、FastAPI、LangGraph、RAG、DeepSeek、React、Next.js、
PostgreSQL、Redis、S3/R2、Docker

- 构建状态化品牌智能体，支持自由问答、纠错、重试、平台路由和 Logo/多平台营销
  物料生成，并将结果同步至美团、小红书、微信模拟预览。
- 搭建文档知识库，完成多格式解析、混合检索、Rerank、引用与 Recall@K/MRR 评测；
  使用 PostgreSQL、Redis 和对象存储管理会话、资产、状态及知识数据。
- 设计品牌上下文与质量门，将定位、色彩、字体和 Logo 作为生图约束；构建 Trace、
  降级回退与自动化测试体系，完成本地全栈 MVP 和部署配置。
