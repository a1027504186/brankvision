import { ChevronLeft, Heart, Lock, Plus, Scissors, ShoppingBag, Sparkles, Utensils } from "lucide-react";
import { EmptyBrandPreview } from "./EmptyBrandPreview";
import { SpectrumLogo } from "./SpectrumLogo";

type StoreCategory = "宠物店" | "理发店" | "餐饮店" | "零售店";

type DashboardProps = {
  onStartStore: (category: StoreCategory) => void;
  onOpenStore: (category: StoreCategory) => void;
};

const CATEGORY_ITEMS = [
  { label: "宠物店" as const, icon: Heart },
  { label: "理发店" as const, icon: Scissors },
  { label: "餐饮店" as const, icon: Utensils },
  { label: "零售店" as const, icon: ShoppingBag },
];

const STORE_ITEMS = [
  { category: "宠物店" as const, icon: Heart, rating: "★ 4.8", name: "爱宠生活馆", subtitle: "温馨治愈 · 社区洗护服务", surface: "bg-[#FCD2CB]" },
  { category: "餐饮店" as const, icon: Utensils, rating: "★ 4.9", name: "江西小炒", subtitle: "活力俏皮 · 潮流宠物用品", surface: "bg-[#FCE6C1]" },
  { category: "理发店" as const, icon: Scissors, rating: "★ 5.0", name: "倍源美发", subtitle: "日式精致 · 治愈猫咖主题", surface: "bg-[#D2E7D6]" },
];

function StoreCard({ item, onOpen }: { item: (typeof STORE_ITEMS)[number]; onOpen: () => void }) {
  const Icon = item.icon;
  return (
    <button type="button" onClick={onOpen} className={`flex h-[180px] w-full min-w-0 flex-col justify-between rounded-[20px] p-4 text-left ${item.surface}`}>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-[30px] place-items-center rounded-full bg-white"><Icon size={15} /></span>
          <span className="text-[14px] font-bold text-[var(--ink)]">{item.category}</span>
        </div>
        <span className="rounded-full bg-white px-2.5 py-[5px] text-[11px] font-bold text-[var(--ink)]">{item.rating}</span>
      </div>
      <h2 className="text-[30px] font-bold leading-none text-[var(--ink)]">{item.name}</h2>
      <p className="text-[13px] text-[var(--muted)]">{item.subtitle}</p>
    </button>
  );
}

export function Dashboard({ onStartStore, onOpenStore }: DashboardProps) {
  return (
    <main className="grid h-full min-w-0 flex-1 grid-cols-[minmax(780px,1fr)_48px_500px] overflow-hidden bg-[var(--paper)]">
      <section className="flex min-w-0 flex-col justify-between border-r border-[var(--border)] bg-[var(--panel)] px-12 py-10">
        <SpectrumLogo />

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-[50px] font-bold leading-none tracking-[-0.045em] text-[var(--ink)]">开启您的品牌之旅</h1>
            <Sparkles size={38} className="text-[#E57A64]" />
          </div>
          <p className="text-[20px] text-[var(--muted)]">AI 助力打造专业、一致，有温度的品牌形象</p>
        </div>

        <div className="flex gap-2.5" aria-label="商家类型">
          {CATEGORY_ITEMS.map(({ label, icon: Icon }, index) => (
            <button
              key={label}
              type="button"
              onClick={() => onStartStore(label)}
              className={`flex items-center gap-3 rounded-full py-2 pl-2 pr-5 text-[15px] transition ${index === 0 ? "bg-[var(--ink)] font-bold text-white" : "bg-[#F2EFEB] text-[var(--ink)] hover:bg-[#EAE5E0]"}`}
            >
              <span className="grid size-8 place-items-center rounded-full bg-white text-[var(--ink)]"><Icon size={16} /></span>
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <StoreCard item={STORE_ITEMS[0]} onOpen={() => onOpenStore(STORE_ITEMS[0].category)} />
            <StoreCard item={STORE_ITEMS[1]} onOpen={() => onOpenStore(STORE_ITEMS[1].category)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StoreCard item={STORE_ITEMS[2]} onOpen={() => onOpenStore(STORE_ITEMS[2].category)} />
            <button type="button" onClick={() => onStartStore("宠物店")} className="flex h-[180px] w-full min-w-0 flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-[#D9D0C7] bg-white text-[var(--ink)]">
              <span className="grid size-11 place-items-center rounded-full bg-[#F2EFEB]"><Plus size={20} /></span>
              <span className="text-[15px] font-bold">创建新店铺</span>
            </button>
          </div>
        </div>

        <footer className="flex items-center justify-between text-[12px]"><span className="text-[var(--muted)]">共 3 个店铺资产</span><button type="button" className="font-bold text-[#E57A64]">查看全部店铺 →</button></footer>
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
