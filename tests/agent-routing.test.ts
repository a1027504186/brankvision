import assert from "node:assert/strict";
import test from "node:test";
import { buildImagePrompt, classifyLocalIntent, validateBrandAsset } from "../lib/agent/orchestrator";
import { generateImage } from "../lib/agent/image-tool";
import { summarizeAgentTraces } from "../lib/agent/observability";
import { retrieveBrandKnowledge } from "../lib/agent/knowledge";
import { persistGeneratedAsset } from "../lib/agent/asset-storage";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import type { AgentSession } from "../lib/agent/types";

function session(overrides: Partial<AgentSession> = {}): AgentSession {
  return {
    id: "00000000-0000-4000-8000-000000000000",
    brandType: "personal",
    category: "个人品牌",
    stage: "asset_brief",
    pendingAsset: "wechat-cover",
    brand: {
      name: "一格",
      positioning: "生产产品和创造内容",
      style: "premium",
      platform: "wechat",
    },
    messages: [],
    assets: [],
    progress: {
      brandReady: true,
      meituanCover: false,
      meituanService: false,
      xhsProfile: true,
      xhsPoster: false,
      wechatCover: false,
      wechatPoster: false,
    },
    createdAt: "2026-07-22T00:00:00.000Z",
    updatedAt: "2026-07-22T00:00:00.000Z",
    ...overrides,
  };
}

test("只查看微信主页时切换平台，不触发生成", () => {
  const result = classifyLocalIntent(session({ stage: "platform", pendingAsset: undefined }), "先不生成内容吧，看看微信主页");
  assert.equal(result.intent, "switch_platform");
  assert.equal(result.platform, "wechat");
});

test("明确生成微信主页时路由到微信主图物料", () => {
  const result = classifyLocalIntent(session(), "生产微信主页，不生产内容吧，主页要体现创意、产品和内容，但不要有文字");
  assert.equal(result.intent, "generate_asset");
  assert.equal(result.platform, "wechat");
  assert.equal(result.assetKind, "wechat-cover");
});

test("明确生成小红书笔记时不能只切换平台", () => {
  const result = classifyLocalIntent(session({ stage: "platform", pendingAsset: undefined }), "帮我生成一篇小红书笔记海报，推广我的主营业务");
  assert.equal(result.intent, "generate_asset");
  assert.equal(result.platform, "xiaohongshu");
  assert.equal(result.assetKind, "xhs-note");
});

test("用户质疑当前结果时先回答，不推进工作流", () => {
  const result = classifyLocalIntent(session({ stage: "logo", pendingAsset: undefined }), "为什么我的 Logo 还没有生成？");
  assert.equal(result.intent, "question");
});

test("物料提示词包含完整品牌视觉系统和无文字约束", () => {
  const prompt = buildImagePrompt(session(), "wechat-cover", "体现创意、产品和内容，但不要有文字");
  for (const expected of ["#2C3E50", "#BDC3C7", "#E07A5F", "#F8F9FA", "Sans-serif Heavy", "Sans-serif Regular", "不得出现任何文字"]) {
    assert.match(prompt, new RegExp(expected.replace("#", "\\#")));
  }
  assert.match(prompt, /不得重新绘制、变形、仿制/);
  assert.match(prompt, /主色约占55%/);
});

test("品牌质量门同时检查提示词令牌、资产持久化和预览同步", () => {
  const current = session();
  const prompt = buildImagePrompt(current, "wechat-cover", "体现创意、产品和内容");
  const asset = {
    id: "wechat-cover",
    name: "微信账号主图",
    size: "1024×768",
    platform: "wechat",
    url: "https://example.com/wechat-cover.png",
    prompt,
    createdAt: "2026-07-25T00:00:00.000Z",
  } as const;

  current.assets = [asset];
  current.progress.wechatCover = true;
  const passed = validateBrandAsset(current, asset);
  assert.equal(passed.passed, true);
  assert.ok(passed.checks.includes("brand-tokens-present"));
  assert.ok(passed.checks.includes("preview-synced"));

  current.progress.wechatCover = false;
  const failed = validateBrandAsset(current, asset);
  assert.equal(failed.passed, false);
  assert.ok(failed.checks.includes("preview-not-synced"));
});

test("生图工具会把品牌 Logo 作为参考图传给供应商", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.IMAGE_API_KEY;
  let requestBody: Record<string, unknown> | undefined;
  process.env.IMAGE_API_KEY = "test-key";
  globalThis.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ status: "succeeded", results: [{ url: "https://example.com/generated.png" }] }), { status: 200 });
  };
  try {
    const result = await generateImage("品牌物料", "4:3", ["https://example.com/logo.png"]);
    assert.equal(result, "https://example.com/generated.png");
    assert.deepEqual(requestBody?.images, ["https://example.com/logo.png"]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.IMAGE_API_KEY;
    else process.env.IMAGE_API_KEY = originalKey;
  }
});

test("诊断汇总能够统计路由、成功率、耗时和失败检查项", () => {
  const diagnostics = summarizeAgentTraces([
    {
      id: "trace-1",
      input: "看看微信主页",
      route: "switch_platform",
      status: "passed",
      checks: ["session-updated"],
      startedAt: "2026-07-25T00:00:00.000Z",
      completedAt: "2026-07-25T00:00:00.100Z",
      durationMs: 100,
    },
    {
      id: "trace-2",
      input: "生成微信主页",
      route: "generate_asset",
      status: "failed",
      checks: ["image-tool-did-not-return-url", "asset-not-persisted"],
      startedAt: "2026-07-25T00:00:01.000Z",
      completedAt: "2026-07-25T00:00:01.300Z",
      durationMs: 300,
    },
  ]);

  assert.equal(diagnostics.totalRuns, 2);
  assert.equal(diagnostics.passRate, 0.5);
  assert.equal(diagnostics.averageDurationMs, 200);
  assert.equal(diagnostics.routes.generate_asset, 1);
  assert.equal(diagnostics.failedChecks["asset-not-persisted"], 1);
});

test("RAG 会为小红书海报检索对应平台规范", () => {
  const documents = retrieveBrandKnowledge(
    session({ brand: { ...session().brand, platform: "xiaohongshu" } }),
    "生成一张推广主营业务的小红书海报",
    "xiaohongshu",
    "xhs-note",
  );
  assert.equal(documents[0]?.id, "xiaohongshu-note");
  assert.ok(documents.some((document) => document.id === "brand-foundation"));
});

test("对象存储不可用时生成物料会可靠回退到本地文件", async () => {
  const url = await persistGeneratedAsset(
    "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C%2Fsvg%3E",
    "00000000-0000-4000-8000-000000000000",
    "brand-logo",
  );
  assert.match(url, /^\/generated\/brand-logo-[a-f0-9-]+\.svg$/);
  const target = path.join(process.cwd(), "public", url.replace(/^\//, ""));
  const content = await readFile(target, "utf8");
  assert.match(content, /<svg/);
  await unlink(target);
});
