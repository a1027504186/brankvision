import { Sparkles } from "lucide-react";

type SpectrumLogoProps = { compact?: boolean };

export function SpectrumLogo({ compact = false }: SpectrumLogoProps) {
  return (
    <div className={`flex items-center ${compact ? "gap-3" : "gap-5"}`}>
      <div className={`relative shrink-0 ${compact ? "size-9" : "size-[60px]"}`} aria-hidden="true">
        <span className={`absolute rounded-md bg-[#E57A64]/60 rotate-[-14deg] ${compact ? "left-[8px] top-[16px] h-5 w-[18px]" : "left-[14px] top-[28px] h-8 w-[30px]"}`} />
        <span className={`absolute rounded-md bg-[#F4B860]/60 rotate-[36deg] ${compact ? "left-[12px] top-[10px] h-5 w-[18px]" : "left-[21px] top-[18px] h-8 w-[30px]"}`} />
        <span className={`absolute rounded-md bg-[#7CA282]/60 rotate-[14deg] ${compact ? "left-[7px] top-[3px] h-5 w-[18px]" : "left-[13px] top-[5px] h-8 w-[30px]"}`} />
      </div>
      <div>
        <div className={`${compact ? "text-[11px] tracking-[0.16em]" : "text-[16px] tracking-[0.125em]"} font-bold text-[var(--ink)]`}>SPECTRUM</div>
        <div className={`${compact ? "mt-0.5 text-[7px]" : "mt-1 text-[11px]"} text-[var(--muted)]`}>智能品牌视觉系统</div>
      </div>
    </div>
  );
}

export function SpectrumSidebarMark() {
  return <div className="grid size-10 place-items-center rounded-xl bg-[var(--ink)] text-white"><Sparkles size={18} /></div>;
}
