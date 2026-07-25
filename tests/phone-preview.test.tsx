import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PhonePreview } from "../app/pawmuse/PhonePreview";

test("小红书笔记已生成时，即使主页封面未生成也展示笔记", () => {
  const html = renderToStaticMarkup(
    <PhonePreview
      platform="xiaohongshu"
      brandType="personal"
      brandDraft={{ type: "personal", name: "一格", positioning: "用 AI 创造好产品与内容" }}
      logoUrl="https://example.com/logo.png"
      assetUrls={{ xhsPoster: "https://example.com/poster.png" }}
      progress={{
        brandReady: true,
        meituanCover: false,
        meituanService: false,
        xhsProfile: false,
        xhsPoster: true,
        wechatCover: false,
        wechatPoster: false,
      }}
    />,
  );

  assert.match(html, /https:\/\/example\.com\/poster\.png/);
  assert.doesNotMatch(html, /小红书内容尚未生成/);
  assert.match(html, /笔记/);
});
