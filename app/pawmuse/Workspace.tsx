"use client";

import { ChevronLeft, ChevronRight, Download, Image as ImageIcon, Layers3, LockKeyhole, LockKeyholeOpen, Palette, Plus, Send, Store, Type, WandSparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BRAND, IMAGES, INITIAL_MESSAGES } from "./data";
import { EmptyBrandPreview } from "./EmptyBrandPreview";
import { PhonePreview } from "./PhonePreview";
import type { BrandAsset, BrandDraft, BrandType, ChatMessage, Platform, StoryProgress } from "./types";
import { SpectrumLogo } from "./SpectrumLogo";
import { AgentDialoguePanel } from "./AgentDialoguePanel";
import { KnowledgePanel } from "./KnowledgePanel";
import { BRAND_STYLE_SYSTEMS } from "@/lib/brand-system";

const PLATFORM_LABELS: Record<Platform, string> = { meituan: "美团", xiaohongshu: "小红书", wechat: "微信" };
const PLATFORM_COLORS: Record<Platform, string> = { meituan: "#F5C400", xiaohongshu: "#FF2442", wechat: "#07C160" };
type StyleId = "warm" | "playful" | "premium";
const BRAND_TYPE_LABELS: Record<BrandType, string> = { personal: "个人品牌", store: "店铺品牌", product: "产品品牌" };
const BRAND_TYPE_PROMPTS: Record<BrandType, { name: string; positioning: (name: string) => string; style: string }> = {
  personal: {
    name: "先告诉我，你希望用什么名字被记住？\n可以是本名、昵称或个人品牌名。",
    positioning: (name) => `「${name}」已经记录。\n接下来请说说你的专业能力、希望服务的人，以及希望被怎样记住。\n（例如：帮助职场女性完成职业转型的独立顾问）`,
    style: "这个方向已经具备清晰的个人价值。\n接下来请选择更符合你表达方式的视觉风格，我会据此建立个人品牌的色彩、字体与内容基调。",
  },
  store: {
    name: "接下来，请问您的店铺叫什么名字？\n如果有 Slogan 也可以一起告诉我。",
    positioning: (name) => `「${name}」听起来亲切又有记忆点，我先记下了。\n为了让品牌真正贴合顾客，请再说说店铺面向的人群和特色定位。\n（例如：高端商场里的宠物 SPA）`,
    style: "这个定位很清晰：既要有专业辨识度，也要保留品牌的亲和力。\n接下来请选择更符合您想法的视觉风格，我会据此建立色彩与排版体系。\n（例如：活力俏皮）",
  },
  product: {
    name: "先告诉我产品叫什么名字。\n如果还没有正式名称，也可以先用项目代号。",
    positioning: (name) => `「${name}」已经记录。\n接下来请描述它为谁解决什么问题，以及你最希望用户记住的价值。\n（例如：帮助独立创作者更轻松管理内容与客户）`,
    style: "产品价值已经清晰。\n接下来请选择一个视觉方向，我会据此建立产品品牌的色彩、排版与发布表达。",
  },
};
const STYLE_OPTIONS: Array<{ id: StyleId; name: string; desc: string }> = [
  { id: "warm", name: "温馨治愈", desc: "暖粉 · 米色 · 柔和亲近" },
  { id: "playful", name: "活力俏皮", desc: "明黄 · 亮蓝 · 年轻醒目" },
  { id: "premium", name: "专业严谨", desc: "藏蓝 · 银灰 · 克制可靠" },
];
const STYLE_COLORS: Record<StyleId, Array<{ name: string; value: string }>> = {
  warm: BRAND_STYLE_SYSTEMS.warm.colors,
  playful: BRAND_STYLE_SYSTEMS.playful.colors,
  premium: BRAND_STYLE_SYSTEMS.premium.colors,
};
const STORY_ASSETS: Record<Exclude<keyof StoryProgress, "brandReady">, BrandAsset> = {
  meituanCover: { id: "meituan-cover", name: "美团店铺主图", size: "800×800", platform: "meituan", url: IMAGES.meituanCover },
  meituanService: { id: "meituan-service", name: "美团服务主图", size: "800×800", platform: "meituan", url: IMAGES.works[0] },
  xhsProfile: { id: "xhs-profile", name: "小红书账号主页", size: "1080×810", platform: "xiaohongshu", url: IMAGES.xhsCover },
  xhsPoster: { id: "xhs-note", name: "小红书营销海报", size: "1080×1440", platform: "xiaohongshu", url: IMAGES.xhsPoster },
  wechatCover: { id: "wechat-cover", name: "微信账号主图", size: "1080×810", platform: "wechat", url: IMAGES.wechatCover },
  wechatPoster: { id: "wechat-poster", name: "朋友圈营销海报", size: "1080×1920", platform: "wechat", url: IMAGES.wechatPoster },
};

function assetsFromProgress(progress: StoryProgress) {
  return (Object.keys(STORY_ASSETS) as Array<keyof typeof STORY_ASSETS>).filter((key) => progress[key]).map((key) => STORY_ASSETS[key]);
}

function BrandMark() {
  return <SpectrumLogo compact />;
}

function DialoguePanel({ onPlatform, brandType, initialCategory, existingStore, expanded = false, onAssetsReady, onStoryUpdate, onDraftChange, onGeneratedAsset, brandDraft }: { onPlatform: (platform: Platform) => void; brandType: BrandType; initialCategory: string; existingStore: boolean; expanded?: boolean; onAssetsReady?: (styleId: StyleId) => void; onStoryUpdate?: (patch: Partial<StoryProgress>, platform: Platform) => void; onDraftChange?: (patch: Partial<BrandDraft>) => void; onGeneratedAsset?: (asset: BrandAsset) => void; brandDraft?: BrandDraft }) {
  const typeCopy = BRAND_TYPE_PROMPTS[brandType];
  const guidedMessages: ChatMessage[] = existingStore ? INITIAL_MESSAGES : [
    { id: "welcome", role: "assistant", content: "你好，我是 SPECTRUM 品牌智能体。\n我会通过几轮对话，和你一起建立定位、视觉与内容表达。", time: "17:08" },
    { id: "selected-category", role: "user", content: initialCategory === BRAND_TYPE_LABELS[brandType] ? BRAND_TYPE_LABELS[brandType] : `${BRAND_TYPE_LABELS[brandType]} · ${initialCategory}`, time: "17:08" },
    { id: "confirm-brand-type", role: "assistant", content: `收到，我们先建立一个「${BRAND_TYPE_LABELS[brandType]}」。\n${typeCopy.name}`, time: "17:08" },
  ];
  const [messages, setMessages] = useState<ChatMessage[]>(guidedMessages);
  const [input, setInput] = useState("");
  const [creationStep, setCreationStep] = useState<"name" | "positioning" | "style" | "logo" | "platform" | "meituanCover" | "meituanService" | "xhsProfile" | "xhsPoster" | "wechatBundle" | "free" | "done">(existingStore ? "done" : "name");
  const [isWorking, setIsWorking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const askAgent = async (stage: string, userContent: string, fallback: string, attachment?: ChatMessage["attachment"], imageUrl?: string) => {
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandType,
          stage,
          brand: brandDraft,
          messages: [...messages, { role: "user", content: userContent }].map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!response.ok) throw new Error("agent unavailable");
      const data = await response.json();
      return { content: data.reply || fallback, attachment, imageUrl };
    } catch {
      return { content: fallback, attachment, imageUrl };
    }
  };

  const createImage = async (prompt: string, aspectRatio: "1:1" | "3:4" | "4:3" | "9:16", asset: Omit<BrandAsset, "url">) => {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, aspectRatio }),
    });
    if (!response.ok) {
      const failure = await response.json().catch(() => ({}));
      throw new Error(failure.code || "IMAGE_GENERATION_FAILED");
    }
    let data = await response.json();
    if (!data.url && data.id) {
      for (let attempt = 0; attempt < 24 && !data.url; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 2500));
        const result = await fetch(`/api/generate-image?id=${encodeURIComponent(data.id)}`);
        if (!result.ok) continue;
        data = await result.json();
        if (data.status === "failed") break;
      }
    }
    if (!data.url) throw new Error("image generation incomplete");
    onGeneratedAsset?.({ ...asset, url: data.url });
    return data.url as string;
  };

  const send = async () => {
    const value = input.trim();
    if (!value || isWorking) return;
    const platform: Platform | null = value.includes("小红书") ? "xiaohongshu" : value.includes("微信") || value.includes("朋友圈") ? "wechat" : value.includes("美团") ? "meituan" : null;
    const time = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: value, time }]);
    setInput("");
    setIsWorking(true);

    if (!existingStore && creationStep === "name") {
      const name = value.split(/[,，]/)[0].trim() || "新品牌";
      onDraftChange?.({ name });
      setCreationStep("positioning");
      const reply = await askAgent("品牌命名完成，继续澄清定位", value, typeCopy.positioning(name));
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, ...reply }]);
      setIsWorking(false);
      return;
    }

    if (!existingStore && creationStep === "positioning") {
      onDraftChange?.({ positioning: value });
      setCreationStep("style");
      const reply = await askAgent("定位完成，邀请用户选择视觉风格", value, typeCopy.style);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, ...reply }]);
      setIsWorking(false);
      return;
    }

    if (!existingStore && creationStep === "logo") {
      try {
        const direction = /没生成|失败|重试|再来|没有生成/.test(value) ? "字母标与抽象符号结合，简洁、专业、有记忆点" : value;
        const initials = (brandDraft?.name || "品牌").trim().slice(0, 2);
        const imageUrl = await createImage(`Design a clean vector logo symbol for the brand "${brandDraft?.name || "新品牌"}". Brand type: ${BRAND_TYPE_LABELS[brandType]}. Positioning: ${brandDraft?.positioning || "清晰、可信赖"}. Direction: ${direction}. Use the initials "${initials}" only as visual inspiration. One centered geometric symbol, flat vector style, solid shapes, strong silhouette, white or transparent-looking plain background. No mockup, no photograph, no scene, no tiny text, no slogan, no paragraph, no extra letters.`, "1:1", { id: "brand-logo", name: "品牌 Logo", size: "1024×1024", platform: "xiaohongshu" });
        setCreationStep("platform");
        const reply = await askAgent("Logo 已生成，邀请选择内容落地平台", value, "Logo 已经生成，并加入品牌资产。接下来请选择要优先落地的平台。", "brand", imageUrl);
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, ...reply }]);
      } catch (error) {
        const reason = error instanceof Error ? error.message : "unknown";
        const content = reason === "IMAGE_CREDITS_EXHAUSTED"
          ? "Logo 生图账户当前额度不足，因此任务没有进入生成队列。充值或更换可用的生图密钥后，直接回复“重新生成”即可；如果想先继续流程，也可以选择“暂用字母标”。"
          : reason === "IMAGE_GENERATION_FAILED"
            ? "Logo 生成服务返回了失败状态。本次没有写入物料，你可以直接回复“重新生成”，我会沿用当前品牌信息重试。"
            : "Logo 生成等待超时，本次没有写入物料。你可以直接回复“重新生成”，无需再描述一次品牌。";
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, content }]);
      }
      setIsWorking(false);
      return;
    }

    if (!existingStore && creationStep === "meituanCover") {
      setCreationStep("meituanService");
      try {
        const imageUrl = await createImage(`为${brandDraft?.name || "品牌"}生成美团店铺头图。品牌定位：${brandDraft?.positioning || "专业、可信赖"}。用户要求：${value}。画面适合商业平台首页，主体清晰，不要生成无法辨认的小字。`, "1:1", { id: "meituan-cover", name: "美团店铺主图", size: "1024×1024", platform: "meituan" });
        onStoryUpdate?.({ meituanCover: true }, "meituan");
        const reply = await askAgent("美团店铺头图已生成，询问下一项服务", value, "头图已经生成并同步到美团预览。\n接下来要补充一项美团服务吗？告诉我服务名称和价格即可。\n（例如：专属皮毛调理洗护168元）", "poster", imageUrl);
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, ...reply }]);
      } catch {
        setCreationStep("meituanCover");
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, content: "图片生成暂时失败，没有消耗当前流程。请稍后重试或换一种画面描述。" }]);
      }
      setIsWorking(false);
      return;
    }

    if (!existingStore && creationStep === "meituanService") {
      setCreationStep("free");
      try {
        const imageUrl = await createImage(`为${brandDraft?.name || "品牌"}生成美团服务商品图。服务内容：${value}。品牌定位：${brandDraft?.positioning || "专业、可信赖"}。突出服务主体与价格价值感，方形商业海报。`, "1:1", { id: "meituan-service", name: "美团服务主图", size: "1024×1024", platform: "meituan" });
        onStoryUpdate?.({ meituanService: true }, "meituan");
        const reply = await askAgent("美团服务物料已生成，建议选择下一个平台", value, "服务名称、价格和视觉主图已经加入美团主页。\n接下来想把品牌内容延展到哪个平台？", "poster", imageUrl);
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, ...reply }]);
      } catch {
        setCreationStep("meituanService");
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, content: "服务图生成失败，请稍后重试。" }]);
      }
      setIsWorking(false);
      return;
    }

    if (!existingStore && creationStep === "xhsProfile") {
      setCreationStep("xhsPoster");
      try {
        const imageUrl = await createImage(`为${brandDraft?.name || "品牌"}生成小红书账号主页视觉图。品牌定位：${brandDraft?.positioning || "清晰、有辨识度"}。用户要求：${value}。横向4:3构图，适合作为主页头图，不要堆叠小字。`, "4:3", { id: "xhs-profile", name: "小红书账号主页", size: "1024×768", platform: "xiaohongshu" });
        onStoryUpdate?.({ xhsProfile: true }, "xiaohongshu");
        const content = brandType === "store"
          ? "小红书账号主页已经完成，店铺特色和品牌气质现在更统一了。\n这次营销海报主要想传达什么？"
          : brandType === "personal"
            ? "小红书账号主页已经完成，你的专业定位和视觉气质现在更统一了。\n第一篇内容主要想传达什么？"
            : "小红书发布主页已经完成，产品价值和视觉表达现在更统一了。\n第一篇内容主要想传达什么？";
        const reply = await askAgent("小红书主页图已生成，询问第一篇内容主题", value, content, "poster", imageUrl);
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, ...reply }]);
      } catch {
        setCreationStep("xhsProfile");
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, content: "主页图暂未生成完成，可能仍在供应商队列中。当前步骤已经保留，请稍后重试，或换一种更简洁的画面描述。" }]);
      }
      setIsWorking(false);
      return;
    }

    if (!existingStore && creationStep === "xhsPoster") {
      setCreationStep("free");
      try {
        const imageUrl = await createImage(`为${brandDraft?.name || "品牌"}生成小红书营销海报。品牌定位：${brandDraft?.positioning || "清晰、有辨识度"}。内容主题：${value}。3:4竖版，移动端视觉冲击力强，主体清晰。`, "3:4", { id: "xhs-note", name: "小红书营销海报", size: "1024×1365", platform: "xiaohongshu" });
        onStoryUpdate?.({ xhsPoster: true }, "xiaohongshu");
        const reply = await askAgent("小红书营销海报已生成，建议下一步渠道", value, "推广海报已经完成，并作为第一篇笔记同步到小红书主页。\n如果还要覆盖熟客和私域顾客，我们也可以继续完善微信内容。", "poster", imageUrl);
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, ...reply }]);
      } catch {
        setCreationStep("xhsPoster");
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, content: "营销海报暂未生成完成，当前步骤已经保留，请稍后重试。" }]);
      }
      setIsWorking(false);
      return;
    }

    if (!existingStore && creationStep === "wechatBundle") {
      setCreationStep("free");
      try {
        const imageUrl = await createImage(`为${brandDraft?.name || "品牌"}生成微信朋友圈推广海报。品牌定位：${brandDraft?.positioning || "可信赖、有温度"}。推广主题：${value}。9:16竖版，适合手机朋友圈浏览，主体明确。`, "9:16", { id: "wechat-poster", name: "朋友圈营销海报", size: "1024×1820", platform: "wechat" });
        onGeneratedAsset?.({ id: "wechat-cover", name: "微信账号主图", size: "1024×768", platform: "wechat", url: imageUrl });
        onStoryUpdate?.({ wechatCover: true, wechatPoster: true }, "wechat");
        const reply = await askAgent("微信推广物料已生成，总结完成内容", value, "微信账号主图和朋友圈推广物料已经生成，并同步到了微信预览。", "poster", imageUrl);
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, ...reply }]);
      } catch {
        setCreationStep("wechatBundle");
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, content: "微信物料暂未生成完成，当前步骤已经保留，请稍后重试。" }]);
      }
      setIsWorking(false);
      return;
    }

    if (!existingStore && (creationStep === "free" || creationStep === "done")) {
      if (value.includes("小红书")) {
        setCreationStep("xhsProfile");
        onPlatform("xiaohongshu");
        const subject = brandType === "store" ? "店铺特色" : brandType === "personal" ? "你的专业价值" : "产品的核心价值";
        window.setTimeout(() => setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, content: `可以。为了让内容和账号形象保持一致，我建议先完成小红书账号主页图。\n主页图最需要突出${subject}的哪一部分？` }]), 420);
        setIsWorking(false);
        return;
      }
      if (value.includes("微信") || value.includes("朋友圈")) {
        window.setTimeout(() => {
          onStoryUpdate?.({ wechatCover: true, wechatPoster: true }, "wechat");
          setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, content: "微信账号主图和朋友圈推广物料已经一起生成，并同步到了微信预览。", attachment: "poster" }]);
        }, 420);
        setIsWorking(false);
        return;
      }
    }

    if (platform) onPlatform(platform);
    const fallback = platform ? `已切换到${PLATFORM_LABELS[platform]}，右侧预览已同步更新。\n我也把品牌色、字体和语气规范应用到了新内容中。` : "收到。我会结合当前品牌定位继续处理这条需求。";
    const reply = await askAgent("自由品牌咨询与下一步建议", value, fallback);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, ...reply }]);
    setIsWorking(false);
  };

  const selectStyle = (style: (typeof STYLE_OPTIONS)[number]) => {
    const time = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    setCreationStep("logo");
    setMessages((current) => [...current,
      { id: crypto.randomUUID(), role: "user", content: style.name, time },
      { id: crypto.randomUUID(), role: "assistant", content: `「${style.name}」和当前定位很匹配：既有辨识度，也不会削弱专业感。\n色彩与排版体系已经建立，接下来我们完成品牌 Logo。\n你希望 Logo 更偏向字母标、抽象符号，还是图形标？也可以直接描述想要的感觉。`, time, attachment: "brand" },
    ]);
    onAssetsReady?.(style.id);
  };

  const selectTaskPlatform = (platform: Platform) => {
    const time = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    const storePrompts: Record<Platform, string> = {
      meituan: "美团主页最先影响顾客判断的是店铺头图，我们先把它做好。\n您希望画面突出什么？\n（例如：可爱的宠物特写）",
      xiaohongshu: "建议先生成小红书账号主页图。\n您希望主页图体现怎样的内容？",
      wechat: "可以同时生成微信账号主图和朋友圈推广物料。\n请直接描述本次推广主题。",
    };
    const prompts: Record<Platform, string> = brandType === "store" ? storePrompts : {
      meituan: "当前品牌类型不需要美团页面，建议优先建立小红书或微信表达。",
      xiaohongshu: brandType === "personal" ? "建议先完成小红书账号主页，让头像、简介和内容栏目保持一致。\n你希望主页首先传达哪项专业能力？" : "建议先完成产品的小红书发布形象。\n你希望用户第一眼记住产品的哪项价值？",
      wechat: brandType === "personal" ? "我们可以继续生成微信账号主图与朋友圈介绍物料。\n这次希望重点介绍你的专业身份，还是一项具体服务？" : "我们可以继续生成微信发布主图与推广物料。\n这次希望重点介绍产品价值，还是发布活动？",
    };
    onPlatform(platform);
    setCreationStep(platform === "meituan" ? "meituanCover" : platform === "xiaohongshu" ? "xhsProfile" : "wechatBundle");
    setMessages((current) => [...current,
      { id: crypto.randomUUID(), role: "user", content: platform === "meituan" ? "美团" : PLATFORM_LABELS[platform], time },
      { id: crypto.randomUUID(), role: "assistant", content: prompts[platform], time },
    ]);
  };

  const continueWithLettermark = () => {
    const time = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    setCreationStep("platform");
    setMessages((current) => [...current, {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "已先使用品牌名称首字作为临时标志，后续生成成功后会自动替换。现在请选择要优先落地的平台。",
      time,
    }]);
  };

  return (
    <section className={`flex h-full min-w-0 flex-col border-r border-[var(--border)] bg-[var(--panel)] pb-8 pt-10 ${expanded ? "w-[430px] shrink-0 px-6" : "w-full px-12"}`}>
      <div className="mb-7 flex items-center justify-between"><BrandMark /><span className="flex items-center gap-1.5 rounded-full border border-[#F3DDD6] bg-[#FFF6F3] px-3 py-1.5 text-[9px] font-semibold text-[var(--brand)]"><span className="size-1.5 rounded-full bg-[var(--brand)]" />品牌搭建中</span></div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {messages.map((message) => (
          <div key={message.id} className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
            <div className={`max-w-[94%] whitespace-pre-line rounded-2xl px-4 py-3 text-[12px] leading-[1.75] shadow-[0_2px_7px_#2C1C1808] ${message.role === "user" ? "rounded-br-md bg-[#F2E7DF] text-[var(--ink)]" : "rounded-bl-md border border-[var(--border)] bg-white text-[var(--secondary)]"}`}>
              {message.content}
              {message.attachment === "brand" && <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#F7F5F2] p-3"><div className="grid size-9 place-items-center rounded-lg bg-[#FFF0E8] text-[var(--brand)]"><Palette size={16} /></div><div><div className="text-[11px] font-bold text-[var(--ink)]">品牌视觉体系</div><div className="mt-0.5 text-[9px] text-[var(--muted)]">色彩 · 字体规范</div></div></div>}
              {message.attachment === "poster" && <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#F7F5F2] p-3"><div className="grid size-9 place-items-center rounded-lg bg-[#FFF0E8] text-[var(--brand)]"><ImageIcon size={16} /></div><div><div className="text-[11px] font-bold text-[var(--ink)]">营销物料已生成</div><div className="mt-0.5 text-[9px] text-[var(--muted)]">可在右侧查看真实平台效果</div></div></div>}
              {message.imageUrl && <img src={message.imageUrl} alt="AI 生成的品牌物料" className="mt-3 max-h-56 w-full rounded-xl bg-[#F4F1ED] object-contain" />}
            </div>
            <span className="mt-1.5 px-1 text-[9px] text-[#B3ACA8]">{message.time}</span>
          </div>
        ))}
        {creationStep === "style" && <div className="grid grid-cols-3 gap-2">
          {STYLE_OPTIONS.map((style) => <button key={style.id} type="button" onClick={() => selectStyle(style)} className="rounded-xl border border-[var(--border)] bg-white p-3 text-left transition hover:border-[var(--brand)] hover:bg-[#FFF8F5]"><div className="mb-2 flex gap-1">{STYLE_COLORS[style.id].slice(0, 3).map(color => <span key={color.value} className="h-3 flex-1 rounded-full border border-black/5" style={{ backgroundColor: color.value }} />)}</div><b className="block text-[11px] text-[var(--ink)]">{style.name}</b><span className="mt-1.5 block text-[8px] leading-4 text-[var(--muted)]">{style.desc}</span></button>)}
        </div>}
        {creationStep === "logo" && <div className="flex flex-wrap gap-2">
          <button type="button" disabled={isWorking} onClick={() => setInput("重新生成")} className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-[10px] font-normal leading-[1.75] text-[var(--secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:opacity-50">重新生成</button>
          <button type="button" disabled={isWorking} onClick={continueWithLettermark} className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-[10px] font-normal leading-[1.75] text-[var(--secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:opacity-50">暂用字母标</button>
        </div>}
        {creationStep === "platform" && <div className="flex flex-wrap gap-2">
          {((brandType === "store" ? ["meituan", "xiaohongshu", "wechat"] : ["xiaohongshu", "wechat"]) as Platform[]).map(platform => <button key={platform} type="button" onClick={() => selectTaskPlatform(platform)} className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-[10px] font-normal leading-[1.75] text-[var(--secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]">{PLATFORM_LABELS[platform]}</button>)}
        </div>}
        <div ref={bottomRef} />
      </div>
      <div className="mt-5 flex h-12 shrink-0 items-center rounded-full border border-[var(--border)] bg-white pl-4 pr-1.5 shadow-sm focus-within:border-[#D7B0A4]">
        <input value={input} disabled={isWorking} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void send()} placeholder={isWorking ? "智能体正在处理..." : "在此输入回复（随时可输入）..."} className="min-w-0 flex-1 bg-transparent text-[11px] text-[var(--ink)] outline-none placeholder:text-[#B5AEAA] disabled:cursor-wait" />
        <button type="button" disabled={isWorking} onClick={() => void send()} aria-label="发送" className="grid size-9 place-items-center rounded-full bg-[var(--ink)] text-white transition hover:bg-[var(--brand)] disabled:cursor-wait disabled:opacity-50"><Send size={14} /></button>
      </div>
    </section>
  );
}

function CardTitle({ icon: Icon, children }: { icon: typeof Palette; children: React.ReactNode }) {
  return <div className="flex items-center gap-2 text-[12px] font-bold text-[var(--ink)]"><Icon size={15} className="text-[var(--brand)]" />{children}</div>;
}

async function downloadOriginalAsset(asset: BrandAsset) {
  try {
    const response = await fetch(`/api/download?id=${encodeURIComponent(asset.id)}&url=${encodeURIComponent(asset.url)}&name=${encodeURIComponent(asset.name)}`);
    if (!response.ok) throw new Error("download failed");
    const blob = await response.blob();
    const extension = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `${asset.name}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    window.alert("原图下载失败，请稍后重试。");
  }
}

function BrandAssetsPanel({ empty = false, onClose, styleId = "playful", materials = BRAND.assets, brandDraft, usePetIdentity = true, logoUrl, brandId }: { empty?: boolean; onClose?: () => void; styleId?: StyleId; materials?: BrandAsset[]; brandDraft?: BrandDraft; usePetIdentity?: boolean; logoUrl?: string; brandId?: string }) {
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const colors = STYLE_COLORS[styleId];
  const displayName = usePetIdentity ? BRAND.name : brandDraft?.name || BRAND_TYPE_LABELS[brandDraft?.type || "personal"];
  const displayCategory = usePetIdentity ? BRAND.category : BRAND_TYPE_LABELS[brandDraft?.type || "personal"];
  const displayPositioning = usePetIdentity ? BRAND.positioning : brandDraft?.positioning || "等待补充品牌定位";
  const displaySlogan = usePetIdentity ? BRAND.slogan : brandDraft?.type === "personal" ? "让专业被看见，让信任持续发生" : "把产品价值转化为清晰表达";
  const initials = displayName.trim().slice(0, 2) || "SP";
  return (
    <section className="h-full w-[440px] shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--panel)] px-6 py-10 [scrollbar-width:thin] [scrollbar-color:#B8B0AA_transparent]">
      {knowledgeOpen ? <KnowledgePanel brandId={brandId} onClose={() => setKnowledgeOpen(false)} /> : <>
      <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2 text-[15px] font-extrabold text-[var(--ink)]"><Layers3 size={19} />品牌资产</div><div className="flex items-center gap-2">{onClose && <button type="button" onClick={onClose} aria-label="收起品牌资产" className="grid size-7 place-items-center rounded-full border border-[var(--border)] bg-white text-[var(--secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)]"><ChevronRight size={13} /></button>}<button type="button" onClick={() => setKnowledgeOpen(true)} aria-label="打开品牌知识库" title="品牌知识库" className="grid size-7 place-items-center rounded-full border border-[var(--border)] bg-white text-[var(--secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)]"><Plus size={13} /></button></div></div>
      {empty ? <div className="grid h-[calc(100%-52px)] min-h-[620px] place-items-center rounded-2xl border border-dashed border-[#D9D0C7] bg-white/60 px-12 text-center"><div><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#F2EFEB] text-[var(--muted)]"><Layers3 size={22} /></div><h2 className="mt-5 text-[14px] font-bold text-[var(--ink)]">品牌资产等待生成</h2><p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">完成品牌命名与价值定位后<br />系统将在这里建立视觉体系</p></div></div> :
      <div className="space-y-4">
        <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_2px_5px_#2C1C1808]">
          <div className="flex items-center gap-4"><div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#FFF1E9]">{usePetIdentity ? <img src={IMAGES.logo} alt="爱宠品牌标志" className="h-full w-full object-cover" /> : logoUrl ? <img src={logoUrl} alt={`${displayName} 品牌标志`} className="h-full w-full object-cover" /> : <span className="text-[18px] font-extrabold tracking-[-0.04em] text-[var(--brand)]">{initials}</span>}</div><div className="min-w-0"><h2 className="text-[17px] font-bold text-[var(--ink)]">{displayName}</h2><p className="mt-1 truncate text-[11px] text-[var(--secondary)]">{displaySlogan}</p><div className="mt-3 flex gap-2"><span className="rounded-full bg-[#F7F5F2] px-2.5 py-1 text-[9px] text-[var(--secondary)]">{displayCategory}</span><span className="max-w-44 truncate rounded-full bg-[#F7F5F2] px-2.5 py-1 text-[9px] text-[var(--secondary)]">{displayPositioning}</span></div></div></div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_2px_5px_#2C1C1808]">
          <CardTitle icon={Palette}>色彩体系</CardTitle>
          <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4">
            {colors.map((color) => <div key={color.name} className="flex items-center gap-3"><span className="size-11 shrink-0 rounded-xl border border-black/5 shadow-sm" style={{ background: color.value }} /><div><div className="text-[10px] font-semibold text-[var(--ink)]">{color.name}</div><div className="mt-1 text-[9px] text-[var(--muted)]">{color.value}</div></div></div>)}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_2px_5px_#2C1C1808]">
          <CardTitle icon={Type}>排版规范</CardTitle>
          <div className="mt-4 grid grid-cols-2 gap-3"><div className="grid h-28 place-items-center rounded-xl bg-[#F7F7F7] text-center"><div><div className="text-[34px] font-extrabold tracking-[-0.06em]">Ag</div><div className="text-[10px] font-bold">标题字体</div><div className="mt-1 text-[9px] text-[#999]">Sans-serif Heavy</div></div></div><div className="grid h-28 place-items-center rounded-xl bg-[#F7F7F7] text-center"><div><div className="text-[32px] font-normal">Ag</div><div className="text-[10px] font-bold">正文字体</div><div className="mt-1 text-[9px] text-[#999]">Sans-serif Regular</div></div></div></div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_2px_5px_#2C1C1808]">
          <CardTitle icon={ImageIcon}>已生成物料</CardTitle>
          {materials.length > 0 ? <div className="mt-3 space-y-2">
            {materials.map(asset => <button key={asset.id} type="button" onClick={() => void downloadOriginalAsset(asset)} aria-label={`下载${asset.name}原图`} title="下载原图" className="group flex w-full items-center gap-3 rounded-xl bg-[#F8F7F5] p-3 text-left transition hover:bg-[#F3F0EC]"><span className="grid size-10 shrink-0 place-items-center rounded-lg border border-[#F3D8C8] bg-[#FFF7F1] text-[#D98665]"><Store size={16} /></span><span className="min-w-0 flex-1"><b className="block truncate text-[10px] text-[var(--ink)]">{asset.name}</b><span className="mt-1 block text-[9px] text-[var(--muted)]">{asset.size}</span></span><Download size={15} className="text-[#B8B1AC] transition group-hover:text-[var(--brand)]" /></button>)}
          </div> : <div className="mt-3 grid h-[70px] place-items-center rounded-xl border border-[var(--border)] bg-[#F8F7F5] text-[10px] text-[var(--muted)]">暂无成型物料</div>}
        </article>
      </div>}</>}
    </section>
  );
}

function CollapsedAssetsRail({ ready, onExpand }: { ready: boolean; onExpand: () => void }) {
  const LockIcon = ready ? LockKeyholeOpen : LockKeyhole;
  return <aside className="flex h-full w-12 flex-col items-center justify-between border-r border-[var(--border)] bg-[var(--panel)] py-8">
    <button type="button" disabled={!ready} onClick={onExpand} aria-label={ready ? "展开品牌资产" : "品牌资产尚未生成"} className={`grid size-7 place-items-center rounded-full border border-[var(--border)] bg-white ${ready ? "text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)]" : "cursor-not-allowed text-[var(--muted)]"}`}><ChevronLeft size={14} /></button>
    <button type="button" disabled={!ready} onClick={onExpand} className={`flex flex-col items-center gap-3 ${ready ? "text-[var(--ink)]" : "cursor-not-allowed text-[var(--ink)]"}`}>
      <LockIcon size={18} className={ready ? "text-[#7CA282]" : "text-[var(--muted)]"} />
      {["品", "牌", "资", "产"].map(char => <span key={char} className="text-[18px] font-bold">{char}</span>)}
    </button>
    <span className="h-7" />
  </aside>;
}

function PlatformPicker({ platform, onSelect }: { platform: Platform; onSelect: (platform: Platform) => void }) {
  const [expanded, setExpanded] = useState(false);
  const platforms: Platform[] = ["meituan", "xiaohongshu", "wechat"];
  return (
    <div
      className={`absolute left-1/2 top-3 z-50 flex h-11 -translate-x-1/2 items-center overflow-hidden rounded-full border transition-[width,background-color,border-color,box-shadow] duration-300 ease-out ${expanded ? "w-[290px] border-[var(--border)] bg-white shadow-[0_8px_24px_#2C1C1810]" : "w-[92px] border-transparent bg-transparent shadow-none"}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocusCapture={() => setExpanded(true)}
      onBlurCapture={() => setExpanded(false)}
      aria-label={`${PLATFORM_LABELS[platform]}预览切换`}
    >
      <div className={`absolute inset-0 flex items-center justify-center gap-4 transition-opacity duration-150 ${expanded ? "pointer-events-none opacity-0" : "opacity-100"}`} aria-hidden={expanded}>
        {platforms.map((item) => <span key={item} className="size-3 rounded-full transition-opacity duration-200" style={{ backgroundColor: PLATFORM_COLORS[item], opacity: platform === item ? 1 : 0.05 }} />)}
      </div>
      <div className={`flex w-full items-center justify-center gap-1 px-2 transition-opacity delay-75 duration-200 ${expanded ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        {platforms.map((item) => <button key={item} type="button" tabIndex={expanded ? 0 : -1} onClick={() => onSelect(item)} className="flex h-8 flex-1 items-center justify-center whitespace-nowrap rounded-full px-4 text-[11px] font-semibold transition-colors" style={platform === item ? { color: PLATFORM_COLORS[item], backgroundColor: `${PLATFORM_COLORS[item]}12` } : { color: "#746D68" }}>{PLATFORM_LABELS[item]}</button>)}
      </div>
    </div>
  );
}

export function Workspace({ brandType = "store", initialCategory = "宠物店", existingStore = true, progress, onProgressChange }: { brandType?: BrandType; initialCategory?: string; existingStore?: boolean; progress: StoryProgress; onProgressChange: (progress: StoryProgress) => void }) {
  const [platform, setPlatform] = useState<Platform>(brandType === "store" ? "meituan" : "xiaohongshu");
  const [xhsDetail, setXhsDetail] = useState(false);
  const [assetsExpanded, setAssetsExpanded] = useState(existingStore);
  const [selectedStyle, setSelectedStyle] = useState<StyleId>("playful");
  const [brandDraft, setBrandDraft] = useState<BrandDraft>({ type: brandType, name: existingStore ? BRAND.name : "", positioning: existingStore ? BRAND.positioning : "" });
  const [generatedAssets, setGeneratedAssets] = useState<BrandAsset[]>([]);
  const [knowledgeBrandId, setKnowledgeBrandId] = useState<string>();
  const assetsReady = progress.brandReady;
  const fallbackMaterials = brandType === "store" ? assetsFromProgress(progress) : [];
  const materials = fallbackMaterials.map((asset) => generatedAssets.find((generated) => generated.id === asset.id) || asset).concat(generatedAssets.filter((generated) => !fallbackMaterials.some((asset) => asset.id === generated.id)));
  const assetUrls = {
    meituanCover: generatedAssets.find((asset) => asset.id === "meituan-cover")?.url,
    meituanService: generatedAssets.find((asset) => asset.id === "meituan-service")?.url,
    xhsProfile: generatedAssets.find((asset) => asset.id === "xhs-profile")?.url,
    xhsPoster: generatedAssets.find((asset) => asset.id === "xhs-note")?.url,
    wechatCover: generatedAssets.find((asset) => asset.id === "wechat-cover")?.url,
    wechatPoster: generatedAssets.find((asset) => asset.id === "wechat-poster")?.url,
  };
  const logoUrl = generatedAssets.find((asset) => asset.id === "brand-logo")?.url;
  const previewActivated = brandType === "store" ? materials.length > 0 : assetsReady;
  const selectPlatform = (next: Platform) => { setPlatform(next); if (next !== "xiaohongshu") setXhsDetail(false); };
  if (!existingStore) {
    return <main className={`workspace-drawer-grid grid h-full min-w-0 flex-1 grid-rows-1 overflow-hidden bg-[var(--paper)] ${assetsExpanded ? "grid-cols-[minmax(430px,1fr)_440px_500px]" : "grid-cols-[minmax(780px,1fr)_48px_500px]"}`}>
      <div className="col-start-1 row-start-1 h-full min-w-0"><AgentDialoguePanel brandType={brandType} initialCategory={initialCategory} onSessionChange={(session) => {
        setKnowledgeBrandId(session.id);
        setBrandDraft({ type: brandType, name: session.brand.name, positioning: session.brand.positioning });
        if (session.brand.style) setSelectedStyle(session.brand.style);
        if (session.brand.platform) selectPlatform(session.brand.platform);
        setGeneratedAssets(session.assets.map(({ id, name, size, platform: assetPlatform, url }) => ({ id, name, size, platform: assetPlatform, url })));
        onProgressChange(session.progress);
      }} /></div>
      <div className="col-start-2 row-start-1 h-full min-w-0">{assetsExpanded ? <BrandAssetsPanel onClose={() => setAssetsExpanded(false)} styleId={selectedStyle} materials={materials} brandDraft={brandDraft} usePetIdentity={brandType === "store"} logoUrl={logoUrl} brandId={knowledgeBrandId} /> : <CollapsedAssetsRail ready={assetsReady} onExpand={() => setAssetsExpanded(true)} />}</div>
      <section className="relative col-start-3 row-start-1 flex h-full items-center justify-center overflow-hidden bg-[var(--panel)] p-8">{previewActivated ? <><PlatformPicker platform={platform} onSelect={selectPlatform} /><PhonePreview platform={platform} progress={progress} assetUrls={assetUrls} brandDraft={brandDraft} brandType={brandType} logoUrl={logoUrl} xhsDetail={xhsDetail} onOpenXhsPost={() => setXhsDetail(true)} onBackXhsPost={() => setXhsDetail(false)} /></> : <EmptyBrandPreview />}</section>
    </main>;
  }

  return (
    <main className="flex h-full min-w-0 flex-1 overflow-hidden bg-[var(--paper)]">
      <DialoguePanel brandType={brandType} onPlatform={selectPlatform} initialCategory={initialCategory} existingStore={existingStore} expanded />
      <BrandAssetsPanel materials={materials} brandDraft={brandDraft} usePetIdentity />
      <section className="relative flex min-w-[535px] flex-1 items-center justify-center overflow-hidden bg-[var(--panel)] px-6 py-12">
        <PlatformPicker platform={platform} onSelect={selectPlatform} /><PhonePreview platform={platform} progress={progress} xhsDetail={xhsDetail} onOpenXhsPost={() => setXhsDetail(true)} onBackXhsPost={() => setXhsDetail(false)} /><div className="absolute bottom-4 right-5 flex items-center gap-1 text-[9px] text-[var(--muted)]"><WandSparkles size={12} />预览效果将随品牌资产实时更新</div>
      </section>
    </main>
  );
}
