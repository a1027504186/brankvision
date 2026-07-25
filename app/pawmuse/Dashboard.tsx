import { BriefcaseBusiness, ChevronLeft, Heart, Lock, Package, Plus, Sparkles, Store, UserRound } from "lucide-react";
import { EmptyBrandPreview } from "./EmptyBrandPreview";
import { SpectrumLogo } from "./SpectrumLogo";
import type { BrandType } from "./types";

type DashboardProps = {
  onStartBrand: (type: BrandType, category: string) => void;
  onOpenStore: () => void;
};

const BRAND_TYPES = [
  { type: "personal" as const, label: "个人品牌", category: "个人品牌", icon: UserRound },
  { type: "store" as const, label: "店铺品牌", category: "宠物店", icon: Store },
  { type: "product" as const, label: "产品品牌", category: "数字产品", icon: Package },
];

const BRAND_CASES = [
  { type: "store" as const, icon: Heart, label: "店铺品牌", name: "爱宠生活馆", subtitle: "高端商场里的宠物 SPA", status: "完整案例", surface: "bg-[#FCD2CB]" },
  { type: "personal" as const, icon: UserRound, label: "个人品牌", name: "独立顾问", subtitle: "从专业能力到可信赖的个人表达", status: "创建体验", surface: "bg-[#FCE6C1]" },
  { type: "product" as const, icon: BriefcaseBusiness, label: "产品品牌", name: "个人产品", subtitle: "从价值主张到首套发布物料", status: "创建体验", surface: "bg-[#D2E7D6]" },
];

function BrandCaseCard({ item, onOpen }: { item: (typeof BRAND_CASES)[number]; onOpen: () => void }) {
  const Icon = item.icon;
  return (
    <button type="button" onClick={onOpen} className={`flex h-[180px] w-full min-w-0 flex-col justify-between rounded-[20px] p-4 text-left transition-transform active:scale-[0.99] ${item.surface}`}>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-[30px] place-items-center rounded-full bg-white"><Icon size={15} /></span>
          <span className="text-[14px] font-bold text-[var(--ink)]">{item.label}</span>
        </div>
        <span className="rounded-full bg-white px-2.5 py-[5px] text-[10px] font-semibold text-[var(--secondary)]">{item.status}</span>
      </div>
      <h2 className="text-[30px] font-bold leading-none text-[var(--ink)]">{item.name}</h2>
      <p className="text-[13px] text-[var(--muted)]">{item.subtitle}</p>
    </button>
  );
}

export function Dashboard({ onStartBrand, onOpenStore }: DashboardProps) {
  return (
    <main className="grid h-full min-w-0 flex-1 grid-cols-[minmax(780px,1fr)_48px_500px] overflow-hidden bg-[var(--paper)]">
      <section className="flex min-w-0 flex-col justify-between border-r border-[var(--border)] bg-[var(--panel)] px-12 py-10">
        <SpectrumLogo />

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-[50px] font-bold leading-none tracking-[-0.045em] text-[var(--ink)]">把您的价值，变成品牌</h1>
            <Sparkles size={38} className="text-[#E57A64]" />
          </div>
          <p className="text-[20px] text-[var(--muted)]">从定位、视觉到内容，建立可持续经营的品牌系统</p>
        </div>

        <div className="flex gap-2.5" aria-label="品牌主体类型">
          {BRAND_TYPES.map(({ type, label, category, icon: Icon }, index) => (
            <button
              key={type}
              type="button"
              onClick={() => onStartBrand(type, category)}
              className={`flex items-center gap-3 rounded-full py-2 pl-2 pr-5 text-[15px] transition active:scale-[0.98] ${index === 0 ? "bg-[var(--ink)] font-bold text-white" : "bg-[#F2EFEB] text-[var(--ink)] hover:bg-[#EAE5E0]"}`}
            >
              <span className="grid size-8 place-items-center rounded-full bg-white text-[var(--ink)]"><Icon size={16} /></span>
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <BrandCaseCard item={BRAND_CASES[0]} onOpen={onOpenStore} />
            <BrandCaseCard item={BRAND_CASES[1]} onOpen={() => onStartBrand("personal", "个人品牌")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <BrandCaseCard item={BRAND_CASES[2]} onOpen={() => onStartBrand("product", "数字产品")} />
            <button type="button" onClick={() => onStartBrand("personal", "个人品牌")} className="flex h-[180px] w-full min-w-0 flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-[#D9D0C7] bg-white text-[var(--ink)] transition active:scale-[0.99]">
              <span className="grid size-11 place-items-center rounded-full bg-[#F2EFEB]"><Plus size={20} /></span>
              <span className="text-[15px] font-bold">创建新品牌</span>
            </button>
          </div>
        </div>

        <footer className="flex items-center justify-between text-[12px]"><span className="text-[var(--muted)]">1 个完整案例 · 3 种品牌主体</span><button type="button" className="font-bold text-[#E57A64]">查看品牌资产 →</button></footer>
      </section>

      <aside className="flex flex-col items-center justify-between border-r border-[var(--border)] bg-[var(--panel)] py-8">
        <button type="button" aria-label="展开品牌资产" className="grid size-7 place-items-center rounded-full border border-[var(--border)] bg-white"><ChevronLeft size={14} /></button>
        <div className="flex flex-col items-center gap-3"><Lock size={18} className="text-[var(--muted)]" />{["品", "牌", "资", "产"].map(char => <span key={char} className="text-[18px] font-bold">{char}</span>)}</div>
        <span className="h-7" />
      </aside>

      <section className="flex items-center justify-center overflow-hidden bg-[var(--panel)] p-8">
        <EmptyBrandPreview />
      </section>
    </main>
  );
}
