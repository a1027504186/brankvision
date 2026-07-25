import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: handler } = await import(workerUrl.href);
  const fetchHandler =
    typeof handler === "function"
      ? handler
      : handler.fetch.bind(handler);

  return fetchHandler(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("生产构建能够服务 SPECTRUM 应用首页", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>PawMuse 宠物品牌设计助手<\/title>/i);
  assert.match(html, /SPECTRUM/);
  assert.match(html, /个人品牌/);
  assert.match(html, /店铺品牌/);
  assert.match(html, /产品品牌/);
  assert.match(html, /创建新品牌/);
});

test("首页交互入口和全局元数据保持可用", async () => {
  const [page, layout, dashboard] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/pawmuse/Dashboard.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /export const metadata:\s*Metadata/);
  assert.match(layout, /title:\s*"PawMuse 宠物品牌设计助手"/);
  assert.match(page, /onStartBrand/);
  assert.match(page, /onOpenStore/);
  assert.match(page, /setView\("workspace"\)/);
  assert.match(dashboard, /type="button"/);
  assert.match(dashboard, /onClick=/);
});
