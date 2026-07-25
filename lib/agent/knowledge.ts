import type { AgentAssetKind, AgentPlatform, AgentSession } from "./types";

export type BrandKnowledgeDocument = {
  id: string;
  title: string;
  platforms: Array<AgentPlatform | "all">;
  assetKinds: Array<AgentAssetKind | "all">;
  content: string;
};

export const BRAND_KNOWLEDGE: BrandKnowledgeDocument[] = [
  {
    id: "brand-foundation",
    title: "品牌视觉一致性",
    platforms: ["all"],
    assetKinds: ["all"],
    content: "所有平台物料必须继承同一品牌定位、主辅色比例、字体层级与图像气质。平台适配只改变内容结构和画布比例，不能重新发明品牌风格。",
  },
  {
    id: "logo-integrity",
    title: "Logo 原始识别保护",
    platforms: ["all"],
    assetKinds: ["brand-logo", "all"],
    content: "生成品牌物料时，应使用已确认的原始 Logo 文件进行确定性叠加，不让生图模型仿制、变形或重新绘制 Logo。",
  },
  {
    id: "meituan-store",
    title: "美团店铺主页规范",
    platforms: ["meituan"],
    assetKinds: ["meituan-cover", "meituan-service"],
    content: "美团首图优先表达门店品类、核心服务与可信感；服务图需要突出单项服务、价格和购买理由。未生成服务图前，服务列表保持空状态。",
  },
  {
    id: "xiaohongshu-profile",
    title: "小红书账号主页规范",
    platforms: ["xiaohongshu"],
    assetKinds: ["xhs-profile"],
    content: "账号主页图负责建立品牌第一印象，保持头像、名称、定位与视觉系统一致。主页图生成不等于生成笔记，笔记列表在营销海报生成前保持为空。",
  },
  {
    id: "xiaohongshu-note",
    title: "小红书笔记与海报规范",
    platforms: ["xiaohongshu"],
    assetKinds: ["xhs-note"],
    content: "小红书营销海报采用 3:4 竖版，封面需在首屏完整展示，标题利益点清晰但避免文字堆叠。生成后同步新增一条笔记，详情页返回键回到账号主页。",
  },
  {
    id: "wechat-moments",
    title: "微信主页与朋友圈规范",
    platforms: ["wechat"],
    assetKinds: ["wechat-cover", "wechat-poster"],
    content: "微信账号主图与朋友圈营销海报是两项独立资产。主图建立账号识别，朋友圈内容只有在推广海报生成后才出现；头像始终使用原始品牌 Logo。",
  },
];

function tokenize(value: string) {
  const normalized = value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ");
  const words = normalized.split(/\s+/).filter(Boolean);
  const chinese = [...normalized.replace(/[^\p{Script=Han}]/gu, "")];
  const bigrams = chinese.slice(0, -1).map((character, index) => character + chinese[index + 1]);
  return new Set([...words, ...bigrams]);
}

export function retrieveBrandKnowledge(
  session: AgentSession,
  input: string,
  platform?: AgentPlatform,
  assetKind?: AgentAssetKind,
  limit = 3,
) {
  const queryTokens = tokenize([
    input,
    session.brand.name,
    session.brand.positioning,
    session.category,
    platform,
    assetKind,
  ].filter(Boolean).join(" "));

  const ranked = BRAND_KNOWLEDGE
    .map((document) => {
      const documentTokens = tokenize(`${document.title} ${document.content}`);
      let score = 0;
      for (const token of queryTokens) if (documentTokens.has(token)) score += token.length > 1 ? 2 : 0.25;
      if (document.platforms.includes("all")) score += 0.4;
      if (platform && document.platforms.includes(platform)) score += 6;
      if (document.assetKinds.includes("all")) score += 0.2;
      if (assetKind && document.assetKinds.includes(assetKind)) score += 8;
      return { ...document, score };
    })
    .filter((document) => document.score > 0)
    .sort((left, right) => right.score - left.score);

  const selected = ranked.slice(0, limit);
  const foundation = ranked.find((document) => document.id === "brand-foundation");
  if (foundation && !selected.some((document) => document.id === foundation.id)) {
    selected.splice(Math.max(1, selected.length - 1), 1, foundation);
  }
  return selected;
}

export function formatKnowledgeContext(documents: ReturnType<typeof retrieveBrandKnowledge>) {
  return documents.map((document) => `[${document.title}] ${document.content}`).join("\n");
}
