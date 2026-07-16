import { ArrowRight } from "lucide-react";
import { PhonePreview } from "./PhonePreview";
import type { Platform, StoryProgress } from "./types";
import { SpectrumLogo } from "./SpectrumLogo";

type GalleryProps = { onOpenWorkspace: (platform?: Platform) => void; progress: StoryProgress };

const SHOWCASES: Array<{ platform: Platform; label: string; eyebrow: string }> = [
  { platform: "wechat", label: "微信朋友圈", eyebrow: "SOCIAL STORY" },
  { platform: "xiaohongshu", label: "小红书账号", eyebrow: "CONTENT PROFILE" },
  { platform: "meituan", label: "美团店铺", eyebrow: "LOCAL COMMERCE" },
];

export function Gallery({ onOpenWorkspace, progress }: GalleryProps) {
  return (
    <main className="h-full min-w-0 flex-1 overflow-auto bg-[var(--paper)] px-12 py-10">
      <header className="mx-auto flex max-w-[1280px] items-center justify-between">
        <SpectrumLogo compact />
        <button type="button" onClick={() => onOpenWorkspace()} className="flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-[11px] font-semibold text-white">返回品牌工作台 <ArrowRight size={13} /></button>
      </header>
      <section className="mx-auto mt-9 max-w-[1280px]">
        <div className="mb-8 text-center"><p className="text-[10px] font-semibold tracking-[0.24em] text-[var(--brand)]">BRAND IN CONTEXT</p><h1 className="mt-3 text-[32px] font-extrabold tracking-[-0.04em] text-[var(--ink)]">同一个品牌，完整地抵达每个场景</h1><p className="mt-3 text-[12px] text-[var(--secondary)]">视觉资产、内容语气与平台体验保持一致，同时尊重每个平台的原生习惯。</p></div>
        <div className="flex items-start justify-center gap-12">
          {SHOWCASES.map((item) => <button type="button" key={item.platform} onClick={() => onOpenWorkspace(item.platform)} className="group text-left"><div className="mb-4 flex items-end justify-between px-1"><div><div className="text-[8px] font-bold tracking-[0.18em] text-[var(--muted)]">{item.eyebrow}</div><div className="mt-1 text-[13px] font-bold text-[var(--ink)]">{item.label}</div></div><ArrowRight size={14} className="text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-[var(--brand)]" /></div><div className="rounded-[52px] transition duration-300 group-hover:-translate-y-1 group-hover:drop-shadow-[0_24px_30px_#2C1C1814]"><PhonePreview platform={item.platform} compact progress={progress} /></div></button>)}
        </div>
      </section>
    </main>
  );
}
