import { Bell, Image as ImageIcon, Settings } from "lucide-react";

export function EmptyBrandPreview() {
  return (
    <div className="phone-shell">
      <div className="relative flex h-full flex-col justify-between rounded-[38px] bg-[#ECE8E1] px-5 py-6">
        <span className="absolute left-1/2 top-3 h-1.5 w-[100px] -translate-x-1/2 rounded bg-[var(--ink)]" />
        <div className="flex justify-between"><Bell size={18} /><Settings size={18} /></div>
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <div className="grid size-[120px] place-items-center rounded-[32px] border border-[#F2EFEB] bg-white shadow-[0_4px_16px_#00000005]"><ImageIcon size={48} className="text-[var(--muted)]" /></div>
          <h2 className="text-[20px] font-bold">品牌视觉预览区</h2>
          <p className="text-[14px] leading-6 text-[var(--muted)]">完成品牌资产后<br />将在此实时预览效果</p>
        </div>
        <span className="mx-auto h-1 w-[100px] rounded bg-[var(--ink)]" />
      </div>
    </div>
  );
}
