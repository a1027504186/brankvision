import { CalendarDays, Layers3, MessageSquare, Settings, UserRound } from "lucide-react";
import type { AppView } from "./types";
import { SpectrumSidebarMark } from "./SpectrumLogo";

type SidebarProps = {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
};

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  const navItems = [
    { label: "品牌向导", icon: MessageSquare, active: activeView === "dashboard" || activeView === "workspace", action: () => onNavigate("dashboard") },
    { label: "品牌资产", icon: Layers3, active: activeView === "gallery", action: () => onNavigate("gallery") },
    { label: "内容日历", icon: CalendarDays, active: false, action: () => undefined },
    { label: "设置", icon: Settings, active: false, action: () => undefined },
  ];
  return (
    <aside className="flex h-full w-[72px] shrink-0 flex-col items-center justify-between border-r border-[var(--border)] bg-[var(--panel)] py-8">
      <button type="button" onClick={() => onNavigate("dashboard")} aria-label="返回首页" className="rounded-xl shadow-sm"><SpectrumSidebarMark /></button>
      <nav className="flex flex-col items-center gap-6" aria-label="主导航">
        {navItems.map(({ label, icon: Icon, active, action }) => <button key={label} type="button" title={label} aria-label={label} aria-current={active ? "page" : undefined} onClick={action} className={`grid size-11 place-items-center rounded-xl transition-colors ${active ? "bg-[#F2EFEB] text-[var(--ink)]" : "text-[#9E9793] hover:bg-[#F6F3EF]"}`}><Icon size={20} strokeWidth={1.8} /></button>)}
      </nav>
      <div className="grid size-9 place-items-center rounded-full bg-[#D9D0C7] text-[var(--ink)]"><UserRound size={18} /></div>
    </aside>
  );
}
