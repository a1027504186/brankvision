"use client";

import { ChevronLeft, ChevronRight, Download, Image as ImageIcon, Layers3, LockKeyhole, LockKeyholeOpen, Palette, Plus, Send, Store, Type, WandSparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BRAND, IMAGES, INITIAL_MESSAGES } from "./data";
import { EmptyBrandPreview } from "./EmptyBrandPreview";
import { PhonePreview } from "./PhonePreview";
import type { BrandAsset, ChatMessage, Platform, StoryProgress } from "./types";
import { SpectrumLogo } from "./SpectrumLogo";

const PLATFORM_LABELS: Record<Platform, string> = { meituan: "美团", xiaohongshu: "小红书", wechat: "微信" };
const PLATFORM_COLORS: Record<Platform, string> = { meituan: "#F5C400", xiaohongshu: "#FF2442", wechat: "#07C160" };
type StyleId = "warm" | "playful" | "premium";
const STYLE_OPTIONS: Array<{ id: StyleId; name: string; desc: string }> = [
  { id: "warm", name: "温馨治愈", desc: "暖粉 · 米色 · 柔和亲近" },
  { id: "playful", name: "活力俏皮", desc: "明黄 · 亮蓝 · 年轻醒目" },
  { id: "premium", name: "专业严谨", desc: "藏蓝 · 银灰 · 克制可靠" },
];
const STYLE_COLORS: Record<StyleId, Array<{ name: string; value: string }>> = {
  warm: [{ name: "品牌主色", value: "#D49887" }, { name: "辅助色", value: "#F5DFD6" }, { name: "点缀色", value: "#A3B19B" }, { name: "背景色", value: "#FFFAF0" }, { name: "文字色", value: "#4A3C31" }],
  playful: BRAND.colors,
  premium: [{ name: "品牌主色", value: "#2C3E50" }, { name: "辅助色", value: "#BDC3C7" }, { name: "点缀色", value: "#E07A5F" }, { name: "背景色", value: "#F8F9FA" }, { name: "文字色", value: "#2C3E50" }],
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

function DialoguePanel({ onPlatform, initialCategory, existingStore, expanded = false, onAssetsReady, onStoryUpdate }: { onPlatform: (platform: Platform) => void; initialCategory: string; existingStore: boolean; expanded?: boolean; onAssetsReady?: (styleId: StyleId) => void; onStoryUpdate?: (patch: Partial<StoryProgress>, platform: Platform) => void }) {
  const guidedMessages: ChatMessage[] = existingStore ? INITIAL_MESSAGES : [
    INITIAL_MESSAGES[0],
    INITIAL_MESSAGES[1],
    { id: "selected-category", role: "user", content: initialCategory, time: "17:08" },
    { id: "ask-store-name", role: "assistant", content: `收到，您要开一家「${initialCategory}」。\n接下来，请问您的店铺叫什么名字？\n（如果有 Slogan 也可以一起告诉我）`, time: "17:08" },
  ];
  const [messages, setMessages] = useState<ChatMessage[]>(guidedMessages);
  const [input, setInput] = useState("");
  const [creationStep, setCreationStep] = useState<"name" | "positioning" | "style" | "platform" | "meituanCover" | "meituanService" | "xhsProfile" | "xhsPoster" | "wechatBundle" | "free" | "done">(existingStore ? "done" : "name");
  const [draftStoreName, setDraftStoreName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const value = input.trim();
    if (!value) return;
    const platform: Platform | null = value.includes("小红书") ? "xiaohongshu" : value.includes("微信") || value.includes("朋友圈") ? "wechat" : value.includes("美团") ? "meituan" : null;
    const time = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: value, time }]);
    setInput("");

    if (!existingStore && creationStep === "name") {
      const name = value.split(/[,，]/)[0].trim() || "新店铺";
      setDraftStoreName(name);
      setCreationStep("positioning");
      window.setTimeout(() => setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, content: `「${name}」听起来亲切又有记忆点，我先记下了。\n为了让品牌真正贴合顾客，请再说说店铺面向的人群和特色定位。\n（例如：高端商场里的宠物 SPA）` }]), 420);
      return;
    }

    if (!existingStore && creationStep === "positioning") {
      setCreationStep("style");
      window.setTimeout(() => {
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, content: `这个定位很清晰：既要有高端护理的专业感，也要保留宠物品牌的亲和力。\n接下来请选择更符合您想法的视觉风格，我会据此建立色彩与排版体系。\n（例如：活力俏皮）` }]);
      }, 420);
      return;
    }

    if (!existingStore && creationStep === "meituanCover") {
      setCreationStep("meituanService");
      window.setTimeout(() => {
        onStoryUpdate?.({ meituanCover: true }, "meituan");
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, content: "头图已经生成，活泼的宠物形象和品牌色现在能更快抓住顾客注意力。\n接下来要补充一项美团服务吗？告诉我服务名称和价格即可。\n（例如：专属皮毛调理洗护168元）", attachment: "poster" }]);
      }, 420);
      return;
    }

    if (!existingStore && creationStep === "meituanService") {
      setCreationStep("free");
      window.setTimeout(() => {
        onStoryUpdate?.({ meituanService: true }, "meituan");
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, content: "服务已经整理好了：名称、价格和视觉主图都已加入美团主页。\n接下来想把品牌内容延展到哪个平台？", attachment: "poster" }]);
      }, 420);
      return;
    }

    if (!existingStore && creationStep === "xhsProfile") {
      setCreationStep("xhsPoster");
      window.setTimeout(() => {
        onStoryUpdate?.({ xhsProfile: true }, "xiaohongshu");
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, content: "小红书账号主页已经完成，店铺特色和品牌气质现在更统一了。\n这次营销海报主要想传达什么？", attachment: "poster" }]);
      }, 420);
      return;
    }

    if (!existingStore && creationStep === "xhsPoster") {
      setCreationStep("free");
      window.setTimeout(() => {
        onStoryUpdate?.({ xhsPoster: true }, "xiaohongshu");
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, content: "推广海报已经完成，并作为第一篇笔记同步到小红书主页。\n如果还要覆盖熟客和私域顾客，我们也可以继续完善微信内容。", attachment: "poster" }]);
      }, 420);
      return;
    }

    if (!existingStore && creationStep === "wechatBundle") {
      setCreationStep("free");
      window.setTimeout(() => {
        onStoryUpdate?.({ wechatCover: true, wechatPoster: true }, "wechat");
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, content: "微信账号主图和朋友圈推广物料已经一起生成，并同步到了微信预览。", attachment: "poster" }]);
      }, 420);
      return;
    }

    if (!existingStore && (creationStep === "free" || creationStep === "done")) {
      if (value.includes("小红书")) {
        setCreationStep("xhsProfile");
        onPlatform("xiaohongshu");
        window.setTimeout(() => setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, content: "可以。为了让海报和账号形象保持一致，我建议先完成小红书账号主页图。\n主页图最需要突出店铺的哪一部分？" }]), 420);
        return;
      }
      if (value.includes("微信") || value.includes("朋友圈")) {
        window.setTimeout(() => {
          onStoryUpdate?.({ wechatCover: true, wechatPoster: true }, "wechat");
          setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", time, content: "微信账号主图和朋友圈推广物料已经一起生成，并同步到了微信预览。", attachment: "poster" }]);
        }, 420);
        return;
      }
    }

    if (platform) onPlatform(platform);
    window.setTimeout(() => {
      setMessages((current) => [...current, {
        id: crypto.randomUUID(), role: "assistant", time,
        content: platform ? `已切换到${PLATFORM_LABELS[platform]}，右侧预览已同步更新。\n我也把品牌色、字体和语气规范应用到了新内容中。` : "收到。我已按照当前品牌视觉体系整理这条需求，并同步更新到品牌资产工作流。",
        attachment: platform === "xiaohongshu" || platform === "wechat" ? "poster" : undefined,
      }]);
    }, 420);
  };

  const selectStyle = (style: (typeof STYLE_OPTIONS)[number]) => {
    const time = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    setCreationStep("platform");
    setMessages((current) => [...current,
      { id: crypto.randomUUID(), role: "user", content: style.name, time },
      { id: crypto.randomUUID(), role: "assistant", content: `「${style.name}」和当前定位很匹配：既有辨识度，也不会削弱专业感。\n色彩与排版体系已经建立，品牌资产现在可以展开查看。\n接下来先选择要落地的平台。`, time, attachment: "brand" },
    ]);
    onAssetsReady?.(style.id);
  };

  const selectTaskPlatform = (platform: Platform) => {
    const time = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    const prompts: Record<Platform, string> = {
      meituan: "美团主页最先影响顾客判断的是店铺头图，我们先把它做好。\n您希望画面突出什么？\n（例如：可爱的宠物特写）",
      xiaohongshu: "建议先生成小红书账号主页图。\n您希望主页图体现怎样的内容？",
      wechat: "可以同时生成微信账号主图和朋友圈推广物料。\n请直接描述本次推广主题。",
    };
    onPlatform(platform);
    setCreationStep(platform === "meituan" ? "meituanCover" : platform === "xiaohongshu" ? "xhsProfile" : "wechatBundle");
    setMessages((current) => [...current,
      { id: crypto.randomUUID(), role: "user", content: platform === "meituan" ? "美团店铺主页" : PLATFORM_LABELS[platform], time },
      { id: crypto.randomUUID(), role: "assistant", content: prompts[platform], time },
    ]);
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
            </div>
            <span className="mt-1.5 px-1 text-[9px] text-[#B3ACA8]">{message.time}</span>
          </div>
        ))}
        {creationStep === "style" && <div className="grid grid-cols-3 gap-2">
          {STYLE_OPTIONS.map((style) => <button key={style.id} type="button" onClick={() => selectStyle(style)} className="rounded-xl border border-[var(--border)] bg-white p-3 text-left transition hover:border-[var(--brand)] hover:bg-[#FFF8F5]"><div className="mb-2 flex gap-1">{STYLE_COLORS[style.id].slice(0, 3).map(color => <span key={color.value} className="h-3 flex-1 rounded-full border border-black/5" style={{ backgroundColor: color.value }} />)}</div><b className="block text-[11px] text-[var(--ink)]">{style.name}</b><span className="mt-1.5 block text-[8px] leading-4 text-[var(--muted)]">{style.desc}</span></button>)}
        </div>}
        {creationStep === "platform" && <div className="flex flex-wrap gap-2">
          {(["meituan", "xiaohongshu", "wechat"] as Platform[]).map(platform => <button key={platform} type="button" onClick={() => selectTaskPlatform(platform)} className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-[10px] font-normal leading-[1.75] text-[var(--secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]">{PLATFORM_LABELS[platform]}</button>)}
        </div>}
        <div ref={bottomRef} />
      </div>
      <div className="mt-5 flex h-12 shrink-0 items-center rounded-full border border-[var(--border)] bg-white pl-4 pr-1.5 shadow-sm focus-within:border-[#D7B0A4]">
        <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder="在此输入回复（随时可输入）..." className="min-w-0 flex-1 bg-transparent text-[11px] text-[var(--ink)] outline-none placeholder:text-[#B5AEAA]" />
        <button type="button" onClick={send} aria-label="发送" className="grid size-9 place-items-center rounded-full bg-[var(--ink)] text-white transition hover:bg-[var(--brand)]"><Send size={14} /></button>
      </div>
    </section>
  );
}

function CardTitle({ icon: Icon, children }: { icon: typeof Palette; children: React.ReactNode }) {
  return <div className="flex items-center gap-2 text-[12px] font-bold text-[var(--ink)]"><Icon size={15} className="text-[var(--brand)]" />{children}</div>;
}

async function downloadOriginalAsset(asset: BrandAsset) {
  try {
    const response = await fetch(`/api/download?id=${encodeURIComponent(asset.id)}`);
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

function BrandAssetsPanel({ empty = false, onClose, styleId = "playful", materials = BRAND.assets }: { empty?: boolean; onClose?: () => void; styleId?: StyleId; materials?: BrandAsset[] }) {
  const colors = STYLE_COLORS[styleId];
  return (
    <section className="h-full w-[440px] shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--panel)] px-6 py-10 [scrollbar-width:thin] [scrollbar-color:#B8B0AA_transparent]">
      <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2 text-[15px] font-extrabold text-[var(--ink)]"><Layers3 size={19} />品牌资产</div><div className="flex items-center gap-2">{onClose && <button type="button" onClick={onClose} aria-label="收起品牌资产" className="grid size-7 place-items-center rounded-full border border-[var(--border)] bg-white text-[var(--secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)]"><ChevronRight size={13} /></button>}<button type="button" className="grid size-7 place-items-center rounded-full border border-[var(--border)] bg-white text-[var(--secondary)]"><Plus size={13} /></button></div></div>
      {empty ? <div className="grid h-[calc(100%-52px)] min-h-[620px] place-items-center rounded-2xl border border-dashed border-[#D9D0C7] bg-white/60 px-12 text-center"><div><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#F2EFEB] text-[var(--muted)]"><Layers3 size={22} /></div><h2 className="mt-5 text-[14px] font-bold text-[var(--ink)]">品牌资产等待生成</h2><p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">完成店铺命名与特色定位后<br />系统将在这里建立视觉体系</p></div></div> :
      <div className="space-y-4">
        <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_2px_5px_#2C1C1808]">
          <div className="flex items-center gap-4"><div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#FFF1E9]"><img src={IMAGES.logo} alt="爱宠品牌标志" className="h-full w-full object-cover" /></div><div className="min-w-0"><h2 className="text-[17px] font-bold text-[var(--ink)]">{BRAND.name}</h2><p className="mt-1 truncate text-[11px] text-[var(--secondary)]">{BRAND.slogan}</p><div className="mt-3 flex gap-2"><span className="rounded-full bg-[#F7F5F2] px-2.5 py-1 text-[9px] text-[var(--secondary)]">{BRAND.category}</span><span className="max-w-44 truncate rounded-full bg-[#F7F5F2] px-2.5 py-1 text-[9px] text-[var(--secondary)]">{BRAND.positioning}</span></div></div></div>
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
      </div>}
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

export function Workspace({ initialCategory = "宠物店", existingStore = true, progress, onProgressChange }: { initialCategory?: string; existingStore?: boolean; progress: StoryProgress; onProgressChange: (progress: StoryProgress) => void }) {
  const [platform, setPlatform] = useState<Platform>("meituan");
  const [xhsDetail, setXhsDetail] = useState(false);
  const [assetsExpanded, setAssetsExpanded] = useState(existingStore);
  const [selectedStyle, setSelectedStyle] = useState<StyleId>("playful");
  const assetsReady = progress.brandReady;
  const materials = assetsFromProgress(progress);
  const previewActivated = materials.length > 0;
  const selectPlatform = (next: Platform) => { setPlatform(next); if (next !== "xiaohongshu") setXhsDetail(false); };
  const updateStory = (patch: Partial<StoryProgress>, next: Platform) => {
    selectPlatform(next);
    onProgressChange({ ...progress, ...patch });
  };

  if (!existingStore) {
    return <main className={`workspace-drawer-grid grid h-full min-w-0 flex-1 grid-rows-1 overflow-hidden bg-[var(--paper)] ${assetsExpanded ? "grid-cols-[minmax(430px,1fr)_440px_500px]" : "grid-cols-[minmax(780px,1fr)_48px_500px]"}`}>
      <div className="col-start-1 row-start-1 h-full min-w-0"><DialoguePanel onPlatform={selectPlatform} onStoryUpdate={updateStory} initialCategory={initialCategory} existingStore={false} onAssetsReady={(styleId) => { setSelectedStyle(styleId); onProgressChange({ ...progress, brandReady: true }); }} /></div>
      <div className="col-start-2 row-start-1 h-full min-w-0">{assetsExpanded ? <BrandAssetsPanel onClose={() => setAssetsExpanded(false)} styleId={selectedStyle} materials={materials} /> : <CollapsedAssetsRail ready={assetsReady} onExpand={() => setAssetsExpanded(true)} />}</div>
      <section className="relative col-start-3 row-start-1 flex h-full items-center justify-center overflow-hidden bg-[var(--panel)] p-8">{previewActivated ? <><PlatformPicker platform={platform} onSelect={selectPlatform} /><PhonePreview platform={platform} progress={progress} xhsDetail={xhsDetail} onOpenXhsPost={() => setXhsDetail(true)} onBackXhsPost={() => setXhsDetail(false)} /></> : <EmptyBrandPreview />}</section>
    </main>;
  }

  return (
    <main className="flex h-full min-w-0 flex-1 overflow-hidden bg-[var(--paper)]">
      <DialoguePanel onPlatform={selectPlatform} initialCategory={initialCategory} existingStore={existingStore} expanded />
      <BrandAssetsPanel materials={materials} />
      <section className="relative flex min-w-[535px] flex-1 items-center justify-center overflow-hidden bg-[var(--panel)] px-6 py-12">
        <PlatformPicker platform={platform} onSelect={selectPlatform} /><PhonePreview platform={platform} progress={progress} xhsDetail={xhsDetail} onOpenXhsPost={() => setXhsDetail(true)} onBackXhsPost={() => setXhsDetail(false)} /><div className="absolute bottom-4 right-5 flex items-center gap-1 text-[9px] text-[var(--muted)]"><WandSparkles size={12} />预览效果将随品牌资产实时更新</div>
      </section>
    </main>
  );
}
