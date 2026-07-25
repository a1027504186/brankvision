import { randomUUID } from "node:crypto";
import { generateImage, ImageToolError } from "./image-tool";
import { saveSession } from "./store";
import type { AgentAction, AgentAsset, AgentAssetKind, AgentDecision, AgentMessage, AgentPlatform, AgentSession, AgentStyle } from "./types";
import { getBrandStyleSystem } from "../brand-system";
import { composeExactBrandIdentity } from "./image-compose";
import { persistGeneratedAsset } from "./asset-storage";

const STYLE_MAP: Record<string, AgentStyle> = { "温馨治愈": "warm", "活力俏皮": "playful", "专业严谨": "premium" };
const PLATFORM_MAP: Record<string, AgentPlatform> = { "美团": "meituan", "小红书": "xiaohongshu", "微信": "wechat", "朋友圈": "wechat" };
export type RoutedIntent = {
  intent: "workflow" | "question" | "retry" | "skip" | "switch_platform" | "generate_asset";
  platform?: AgentPlatform;
  assetKind?: Exclude<AgentAssetKind, "brand-logo">;
  reply?: string;
};
const ASSET_META: Record<AgentAssetKind, { name: string; size: string; platform: AgentPlatform; ratio: "1:1" | "3:4" | "4:3" | "9:16" }> = {
  "brand-logo": { name: "品牌 Logo", size: "1024×1024", platform: "xiaohongshu", ratio: "1:1" },
  "meituan-cover": { name: "美团店铺主图", size: "1024×1024", platform: "meituan", ratio: "1:1" },
  "meituan-service": { name: "美团服务主图", size: "1024×1024", platform: "meituan", ratio: "1:1" },
  "xhs-profile": { name: "小红书账号主页", size: "1024×768", platform: "xiaohongshu", ratio: "4:3" },
  "xhs-note": { name: "小红书营销海报", size: "1024×1365", platform: "xiaohongshu", ratio: "3:4" },
  "wechat-cover": { name: "微信账号主图", size: "1024×768", platform: "wechat", ratio: "4:3" },
  "wechat-poster": { name: "朋友圈营销海报", size: "1024×1820", platform: "wechat", ratio: "9:16" },
};

const ASSET_KIND_PLATFORM: Record<Exclude<AgentAssetKind, "brand-logo">, AgentPlatform> = {
  "meituan-cover": "meituan",
  "meituan-service": "meituan",
  "xhs-profile": "xiaohongshu",
  "xhs-note": "xiaohongshu",
  "wechat-cover": "wechat",
  "wechat-poster": "wechat",
};

function inferAssetKind(input: string): Exclude<AgentAssetKind, "brand-logo"> | undefined {
  if (/朋友圈/.test(input) || (/微信/.test(input) && /海报|推广物料|营销物料/.test(input))) return "wechat-poster";
  if (/微信/.test(input) && /主页|主图|头图|账号图|封面/.test(input)) return "wechat-cover";
  if (/小红书/.test(input) && /海报|笔记|内容图|营销/.test(input)) return "xhs-note";
  if (/小红书/.test(input) && /主页|主图|头图|账号图|封面/.test(input)) return "xhs-profile";
  if (/美团/.test(input) && /服务|项目|商品/.test(input)) return "meituan-service";
  if (/美团/.test(input) && /主页|店铺|主图|头图|封面/.test(input)) return "meituan-cover";
  return undefined;
}

function isExplicitAssetRequest(input: string, kind?: Exclude<AgentAssetKind, "brand-logo">) {
  const affirmativePart = input.replace(/(?:先|暂时|暂)?不(?:生成|生产|制作|设计|创建|做)[^，。；,;]{0,12}/g, "");
  return Boolean(kind && /生成|生产|制作|设计|创建|做一|做个|做张|来一|产出/.test(affirmativePart));
}

function fallbackDecision(session: AgentSession, input: string): AgentDecision {
  if (session.stage === "name") return { reply: `「${input.split(/[,，]/)[0]}」已经记下。接下来请描述你希望服务的人、解决的问题，以及想被怎样记住。`, action: { type: "update_name", value: input.split(/[,，]/)[0] } };
  if (session.stage === "positioning") return { reply: "定位已经清晰。接下来请选择最接近你想法的视觉风格。", action: { type: "update_positioning", value: input } };
  if (session.stage === "style") return { reply: "视觉方向已确认。接下来描述一下你希望 Logo 给人的感觉，也可以先使用字母标。", action: { type: "set_style", value: STYLE_MAP[input] || "premium" } };
  if (session.stage === "logo") {
    if (/暂用|跳过|字母标/.test(input)) return { reply: "先用名称首字作为临时标志。接下来请选择要优先落地的平台。", action: { type: "skip_logo" } };
    return { reply: "我会据此调用图像工具，生成一个简洁、有辨识度的品牌标志。", action: { type: "generate_logo", prompt: input } };
  }
  if (session.stage === "platform") {
    const platform = Object.entries(PLATFORM_MAP).find(([label]) => input.includes(label))?.[1] || (session.brandType === "store" ? "meituan" : "xiaohongshu");
    return { reply: "平台已确认。请描述第一张物料希望呈现的内容和氛围。", action: { type: "select_platform", value: platform } };
  }
  if (session.stage === "asset_brief") return { reply: "需求已拆解，我现在调用图像工具生成对应物料。", action: { type: "generate_asset", prompt: input } };
  return { reply: "收到。我会结合当前品牌定位和已有资产继续推进。", action: { type: "respond" } };
}

export function classifyLocalIntent(session: AgentSession, input: string): RoutedIntent {
  const platform = Object.entries(PLATFORM_MAP).find(([label]) => input.includes(label));
  const assetKind = inferAssetKind(input);
  const isQuestion = /[？?]|为什么|怎么|是不是|是否|什么意思|没生成|没有生成|失败|没成功|不对|不是/.test(input);
  if (/重试|重新生成|再生成|再来一次/.test(input)) return { intent: "retry" };
  if (isQuestion) {
    const lastToolFailure = [...session.messages].reverse().find((message) => message.role === "tool")?.content;
    let reply = "你提出的是对当前结果的追问，我会先回答，不推进流程。请继续说明你认为不符合预期的地方，我会基于当前品牌状态调整。";
    if (lastToolFailure?.includes("IMAGE_CREDITS_EXHAUSTED")) reply = "刚才的生成没有成功，是因为生图账户额度不足，并不是我已经完成了 Logo。当前任务仍然保留在 Logo 阶段；补充额度后可以直接让我重试，也可以明确选择暂用字母标继续。";
    else if (session.stage === "logo") reply = "Logo 目前还没有生成，当前仍停留在 Logo 阶段等待你的方向。选择“字母标与抽象符号”代表让我生成 Logo，并不等于使用临时字母标；只有你明确说“暂用”或“跳过”，我才会继续下一阶段。";
    else if (session.stage === "platform") reply = "现在处于平台选择阶段，但你的这句话是在提问，不是平台指令，所以我不会擅自选择小红书、美团或微信。";
    else if (session.stage === "asset_brief") reply = "当前正在等待物料需求，但你的这句话是在确认或质疑现状，我会先解释，不会直接调用生图工具。";
    return { intent: "question", reply };
  }
  if (isExplicitAssetRequest(input, assetKind)) {
    return { intent: "generate_asset", platform: ASSET_KIND_PLATFORM[assetKind!], assetKind };
  }
  if (platform && /切换|改成|选择|看看|预览|打开|转到|换到|进入/.test(input)) return { intent: "switch_platform", platform: platform[1] };
  if (/跳过|暂用|先不用|暂不生成任何|先不做了/.test(input)) return { intent: "skip" };
  return { intent: "workflow" };
}

export async function routeIntent(session: AgentSession, input: string): Promise<RoutedIntent> {
  const fallback = classifyLocalIntent(session, input);
  if (["retry", "skip", "switch_platform", "generate_asset"].includes(fallback.intent)) return fallback;
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return fallback;
  try {
    const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [
          { role: "system", content: "你是品牌智能体的全局意图路由器。区分：回答当前问题 workflow；提问或质疑 question；重试 retry；跳过 skip；只查看或切换平台 switch_platform；明确要求生成某个平台主页、海报或服务图 generate_asset。生成物料的指令绝不能路由成切换平台。只输出 JSON。" },
          { role: "user", content: `当前阶段：${session.stage}\n当前平台：${session.brand.platform || "无"}\n待执行资产：${session.pendingAsset || "无"}\n最近消息：${JSON.stringify(session.messages.slice(-8).map(({ role, content }) => ({ role, content })))}\n用户输入：${input}\n输出格式：{"intent":"workflow|question|retry|skip|switch_platform|generate_asset","platform":"meituan|xiaohongshu|wechat，可选","assetKind":"meituan-cover|meituan-service|xhs-profile|xhs-note|wechat-cover|wechat-poster，可选","reply":"question 时给出结合上下文的直接回答，其他意图可省略"}` },
        ],
        response_format: { type: "json_object" }, temperature: 0, max_tokens: 300,
      }),
    });
    if (!response.ok) return fallback;
    const data = await response.json();
    const routed = JSON.parse(data?.choices?.[0]?.message?.content || "{}") as RoutedIntent;
    if (!["workflow", "question", "retry", "skip", "switch_platform", "generate_asset"].includes(routed.intent)) return fallback;
    if (routed.intent === "question" && (!routed.reply || /你提出的是|请继续说明|我会先回答|不推进流程/.test(routed.reply))) return classifyLocalIntent(session, `${input}？`);
    if (routed.intent === "switch_platform" && !routed.platform) return fallback;
    if (routed.intent === "generate_asset" && !routed.assetKind) return fallback;
    return routed;
  } catch {
    return fallback;
  }
}

function directDecision(session: AgentSession, input: string): AgentDecision | null {
  if (session.stage === "style") {
    const style = Object.entries(STYLE_MAP).find(([label]) => input.includes(label));
    if (style) return { reply: `「${style[0]}」与当前定位很匹配。我会据此建立色彩和排版体系。接下来，我们完成品牌 Logo。`, action: { type: "set_style", value: style[1] } };
  }
  if (session.stage === "logo" && /暂用|跳过/.test(input)) return fallbackDecision(session, input);
  if (session.stage === "platform") {
    const platform = Object.entries(PLATFORM_MAP).find(([label]) => input.includes(label));
    if (platform) return { reply: `已切换到${platform[0]}。请描述你想先生成的画面内容。`, action: { type: "select_platform", value: platform[1] } };
  }
  return null;
}

function isActionAllowed(stage: AgentSession["stage"], action: AgentAction) {
  const allowed: Record<AgentSession["stage"], AgentAction["type"][]> = {
    name: ["update_name", "respond"], positioning: ["update_positioning", "respond"], style: ["set_style", "respond"],
    logo: ["generate_logo", "skip_logo", "respond"], platform: ["select_platform", "generate_asset", "respond"],
    asset_brief: ["generate_asset", "respond"], free: ["respond", "select_platform", "generate_asset"],
  };
  if (!allowed[stage].includes(action.type)) return false;
  if (action.type === "set_style" && !["warm", "playful", "premium"].includes(action.value)) return false;
  if (action.type === "select_platform" && !["meituan", "xiaohongshu", "wechat"].includes(action.value)) return false;
  if (action.type === "generate_asset" && action.kind && !(action.kind in ASSET_KIND_PLATFORM)) return false;
  return true;
}

async function decide(session: AgentSession, input: string, routedIntent?: RoutedIntent): Promise<AgentDecision> {
  const route = routedIntent || await routeIntent(session, input);
  if (route.intent === "question") {
    const contextualFallback = classifyLocalIntent(session, input);
    const reply = contextualFallback.intent === "question" && session.stage !== "free" ? contextualFallback.reply : route.reply;
    return { reply: reply || "我先回答这个问题，不会推进当前任务。", action: { type: "respond" } };
  }
  if (route.intent === "retry") {
    if (session.stage === "logo") return { reply: "我会沿用当前品牌定位，重新调用 Logo 生成工具。", action: { type: "generate_logo", prompt: "沿用当前品牌定位和此前的 Logo 方向重新生成" } };
    if (session.stage === "asset_brief" && session.pendingAsset) return { reply: "我会保留当前需求并重新调用物料生成工具。", action: { type: "generate_asset", prompt: "沿用当前品牌定位和此前的物料要求重新生成" } };
    return { reply: "当前没有等待重试的生成任务。你可以告诉我想重新处理哪一项资产。", action: { type: "respond" } };
  }
  if (route.intent === "skip") {
    if (session.stage === "logo") return { reply: "先使用品牌名称首字作为临时标志，Logo 任务保持可随时重试。接下来可以选择内容平台。", action: { type: "skip_logo" } };
    return { reply: "已收到跳过请求。我会保留现有结果，不会误生成新的物料。", action: { type: "respond" } };
  }
  if (route.intent === "switch_platform" && route.platform) return { reply: `已切换到${PLATFORM_LABEL(route.platform)}，接下来请描述要生成的第一项内容。`, action: { type: "select_platform", value: route.platform } };
  if (route.intent === "generate_asset" && route.assetKind) {
    return {
      reply: `已识别为${ASSET_META[route.assetKind].name}生成任务。我会沿用现有品牌视觉体系执行，而不是只切换预览平台。`,
      action: { type: "generate_asset", kind: route.assetKind, prompt: input },
    };
  }
  const direct = directDecision(session, input);
  if (direct) return direct;
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return fallbackDecision(session, input);
  try {
    const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
    const state = { brandType: session.brandType, category: session.category, stage: session.stage, pendingAsset: session.pendingAsset, brand: session.brand, generatedAssets: session.assets.map((asset) => asset.id) };
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [
          { role: "system", content: "你是 SPECTRUM 品牌智能体的决策控制器。根据当前状态理解用户意图，每轮只推进一步。只输出合法 JSON，不输出 Markdown。" },
          ...session.messages.filter((message) => message.role !== "tool").slice(-8).map(({ role, content }) => ({ role, content })),
          { role: "user", content: `状态：${JSON.stringify(state)}\n当前输入：${input}\n动作只能是 update_name/update_positioning/set_style/generate_logo/skip_logo/select_platform/generate_asset/respond。输出：{"reply":"自然、专业、120字以内的回复","action":{"type":"动作","value":"可选","prompt":"可选"}}` },
        ],
        response_format: { type: "json_object" }, temperature: 0.2, max_tokens: 420,
      }),
    });
    if (!response.ok) return fallbackDecision(session, input);
    const data = await response.json();
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content || "{}") as AgentDecision;
    return parsed.reply && parsed.action && isActionAllowed(session.stage, parsed.action) ? parsed : fallbackDecision(session, input);
  } catch {
    return fallbackDecision(session, input);
  }
}

function PLATFORM_LABEL(platform: AgentPlatform) {
  return platform === "meituan" ? "美团" : platform === "xiaohongshu" ? "小红书" : "微信";
}

function addMessage(session: AgentSession, role: AgentMessage["role"], content: string, extra: Partial<AgentMessage> = {}) {
  session.messages.push({ id: randomUUID(), role, content, createdAt: new Date().toISOString(), ...extra });
}

function nextAsset(session: AgentSession, platform: AgentPlatform): AgentAssetKind {
  if (platform === "meituan") return session.progress.meituanCover ? "meituan-service" : "meituan-cover";
  if (platform === "xiaohongshu") return session.progress.xhsProfile ? "xhs-note" : "xhs-profile";
  return session.progress.wechatCover ? "wechat-poster" : "wechat-cover";
}

export function buildImagePrompt(session: AgentSession, kind: AgentAssetKind, request: string, knowledgeContext = "") {
  const system = getBrandStyleSystem(session.brand.style);
  const palette = system.colors.map((color) => `${color.name}${color.value}`).join("、");
  const base = [
    `品牌名称：${session.brand.name}`,
    `品牌类型：${session.brandType}`,
    `业务类别：${session.category}`,
    `品牌定位：${session.brand.positioning}`,
    `品牌视觉方向：${system.name}（${system.mood}）`,
    `固定品牌色板：${palette}`,
    `排版规范：标题使用${system.typography.heading}，正文使用${system.typography.body}`,
    `图像方向：${system.imageDirection}`,
    `本次用户要求：${request}`,
    knowledgeContext ? `检索到的平台与品牌规范：${knowledgeContext}` : "",
  ].filter(Boolean).join("；");
  if (kind === "brand-logo") return `Design a clean vector logo symbol. ${base}. Use only the fixed brand palette. Centered mark, strong silhouette, flat shapes, plain ${system.colors[3].value} background, no mockup, no photograph, no paragraph.`;
  const formats: Record<Exclude<AgentAssetKind, "brand-logo">, string> = {
    "meituan-cover": "美团店铺方形首页主图", "meituan-service": "美团方形服务商品图",
    "xhs-profile": "小红书账号横向主页头图，4:3", "xhs-note": "小红书3:4竖版营销海报",
    "wechat-cover": "微信账号横向主页图，4:3", "wechat-poster": "微信朋友圈9:16竖版推广海报",
  };
  const noText = /不要有文字|不要文字|无文字|纯视觉/.test(request);
  return `${base}；生成${formats[kind]}。上述品牌色板是不可更改的设计令牌：主色约占55%，背景色约占30%，点缀色约占10%，辅助色约占5%，不得引入其他高饱和品牌色。必须严格沿用上述视觉气质和排版系统，不能擅自改成另一套配色或风格。Logo 参考图只用于理解品牌识别；不得重新绘制、变形、仿制或在底图中生成任何 Logo、首字母标与相似符号，系统会在生成后叠加原始 Logo。移动端阅读，主体明确，信息层级清晰。${noText ? "画面中不得出现任何文字、字母、数字或伪文字，只保留视觉构图。" : "文字必须少而清晰，禁止堆叠小字与不可读伪文字。"}`;
}

export function validateBrandAsset(session: AgentSession, asset?: AgentAsset) {
  const checks: string[] = [];
  if (!asset) return { passed: false, checks: ["asset-missing"] };

  const system = getBrandStyleSystem(session.brand.style);
  const expectedTokens = [
    session.brand.name,
    session.brand.positioning,
    system.typography.heading,
    system.typography.body,
    ...system.colors.map((color) => color.value),
  ].filter(Boolean);

  const missingTokens = expectedTokens.filter((token) => !asset.prompt.includes(token));
  checks.push(missingTokens.length === 0 ? "brand-tokens-present" : `brand-tokens-missing:${missingTokens.join(",")}`);

  const matchingAsset = session.assets.find((item) => item.id === asset.id);
  checks.push(matchingAsset?.url === asset.url ? "asset-persisted" : "asset-not-persisted");

  if (asset.id !== "brand-logo" && session.assets.some((item) => item.id === "brand-logo")) {
    checks.push("logo-reference-available");
  } else if (asset.id !== "brand-logo") {
    checks.push("logo-reference-not-yet-available");
  }

  const progressKey = {
    "meituan-cover": "meituanCover",
    "meituan-service": "meituanService",
    "xhs-profile": "xhsProfile",
    "xhs-note": "xhsPoster",
    "wechat-cover": "wechatCover",
    "wechat-poster": "wechatPoster",
  }[asset.id];
  if (progressKey) {
    checks.push(session.progress[progressKey as keyof AgentSession["progress"]] ? "preview-synced" : "preview-not-synced");
  }

  return {
    passed:
      missingTokens.length === 0 &&
      matchingAsset?.url === asset.url &&
      (!progressKey || session.progress[progressKey as keyof AgentSession["progress"]]),
    checks,
  };
}

async function runImageTool(session: AgentSession, kind: AgentAssetKind, request: string, knowledgeContext = "") {
  const meta = ASSET_META[kind];
  const prompt = buildImagePrompt(session, kind, request, knowledgeContext);
  const logo = kind === "brand-logo" ? undefined : session.assets.find((asset) => asset.id === "brand-logo")?.url;
  const generatedUrl = await generateImage(prompt, meta.ratio, logo ? [logo] : []);
  let url = generatedUrl;
  if (logo && kind !== "brand-logo") {
    try {
      const system = getBrandStyleSystem(session.brand.style);
      url = await composeExactBrandIdentity(generatedUrl, logo, kind, system.colors.map((color) => color.value));
    } catch {
      // The generated image remains usable if deterministic composition is temporarily unavailable.
      url = generatedUrl;
    }
  }
  url = await persistGeneratedAsset(url, session.id, kind);
  const asset: AgentAsset = { id: kind, name: meta.name, size: meta.size, platform: meta.platform, url, prompt, createdAt: new Date().toISOString() };
  session.assets = [...session.assets.filter((item) => item.id !== kind), asset];
  const progressKey = { "meituan-cover": "meituanCover", "meituan-service": "meituanService", "xhs-profile": "xhsProfile", "xhs-note": "xhsPoster", "wechat-cover": "wechatCover", "wechat-poster": "wechatPoster" }[kind];
  if (progressKey) session.progress[progressKey as keyof AgentSession["progress"]] = true;
  return asset;
}

export async function runAgentTurn(session: AgentSession, input: string, routedIntent?: RoutedIntent, knowledgeContext = "") {
  addMessage(session, "user", input);
  const decision = await decide(session, input, routedIntent);
  const action = decision.action;
  let reply = decision.reply;
  let generatedAsset: AgentAsset | undefined;
  try {
    if (action.type === "update_name") { session.brand.name = action.value.trim().slice(0, 80); session.stage = "positioning"; }
    else if (action.type === "update_positioning") { session.brand.positioning = action.value.trim().slice(0, 500); session.stage = "style"; }
    else if (action.type === "set_style") { session.brand.style = action.value; session.progress.brandReady = true; session.stage = "logo"; }
    else if (action.type === "skip_logo") session.stage = "platform";
    else if (action.type === "generate_logo") { generatedAsset = await runImageTool(session, "brand-logo", action.prompt || input, knowledgeContext); session.stage = "platform"; reply += "\nLogo 已加入品牌资产。接下来请选择要优先落地的平台。"; }
    else if (action.type === "select_platform") {
      if (session.brandType !== "store" && action.value === "meituan") { reply = "个人或产品品牌更适合先从小红书或微信开始，请选择其中一个。"; }
      else { session.brand.platform = action.value; session.pendingAsset = nextAsset(session, action.value); session.stage = "asset_brief"; }
    } else if (action.type === "generate_asset") {
      const kind = action.kind || session.pendingAsset;
      if (!kind) {
        reply = "我还不能确定要生成哪一种物料。请说明平台和类型，例如“微信主页”“小红书海报”或“美团服务图”。";
        addMessage(session, "assistant", reply);
        await saveSession(session);
        return { session, generatedAsset, actionType: action.type };
      }
      const targetPlatform = ASSET_KIND_PLATFORM[kind];
      if (session.brandType !== "store" && targetPlatform === "meituan") {
        reply = "个人或产品品牌暂不生成美团店铺物料，可以选择小红书或微信。";
        addMessage(session, "assistant", reply);
        await saveSession(session);
        return { session, generatedAsset, actionType: action.type };
      }
      session.brand.platform = targetPlatform;
      session.pendingAsset = kind;
      session.stage = "asset_brief";
      generatedAsset = await runImageTool(session, kind, action.prompt || input, knowledgeContext);
      if (kind === "meituan-cover") { session.pendingAsset = "meituan-service"; reply += "\n店铺主图已同步到预览。接下来告诉我第一项服务和价格。"; }
      else if (kind === "xhs-profile") { session.pendingAsset = "xhs-note"; reply += "\n账号主页已同步。接下来告诉我第一篇内容想表达什么。"; }
      else if (kind === "wechat-cover") { session.pendingAsset = "wechat-poster"; reply += "\n微信主图已同步。接下来告诉我推广海报的主题。"; }
      else { session.pendingAsset = undefined; session.stage = "platform"; reply += "\n物料已加入资产库，可以继续选择下一个平台。"; }
    }
  } catch (error) {
    const code = error instanceof ImageToolError ? error.code : "TOOL_FAILED";
    addMessage(session, "tool", `工具执行失败：${code}`);
    reply = code === "IMAGE_CREDITS_EXHAUSTED" ? "生图账户额度不足，本次没有生成资产。补充额度后可以直接让我重试；当前对话和品牌状态都已保留。" : "图片工具暂时没有完成任务，当前上下文已保留，可以稍后直接重试。";
  }
  addMessage(session, "assistant", reply, generatedAsset ? { attachment: generatedAsset.id === "brand-logo" ? "brand" : "poster", imageUrl: generatedAsset.url } : {});
  await saveSession(session);
  return { session, generatedAsset, actionType: action.type };
}

export function optionsFor(session: AgentSession) {
  if (session.stage === "style") return ["温馨治愈", "活力俏皮", "专业严谨"];
  if (session.stage === "logo") return ["字母标与抽象符号", "图形标", "暂用字母标"];
  if (session.stage === "platform") return session.brandType === "store" ? ["美团", "小红书", "微信"] : ["小红书", "微信"];
  return [];
}
