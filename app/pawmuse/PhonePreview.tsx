import { ArrowLeft, Camera, Heart, Home, MapPin, MessageCircle, MoreHorizontal, Search, Share2, ShoppingBag, Star } from "lucide-react";
import { BRAND, IMAGES, WECHAT_COPY, XHS_NOTE, XHS_POSTS } from "./data";
import { COMPLETE_STORY_PROGRESS, type BrandDraft, type BrandType, type Platform, type StoryProgress } from "./types";

type PhonePreviewProps = {
  platform: Platform;
  xhsDetail?: boolean;
  compact?: boolean;
  onOpenXhsPost?: () => void;
  onBackXhsPost?: () => void;
  progress?: StoryProgress;
  brandDraft?: BrandDraft;
  brandType?: BrandType;
  logoUrl?: string;
  assetUrls?: Partial<Record<"meituanCover" | "meituanService" | "xhsProfile" | "xhsPoster" | "wechatCover" | "wechatPoster", string>>;
};

type PreviewIdentity = {
  name: string;
  positioning: string;
  slogan: string;
  tags: string[];
  logoUrl?: string;
  usePetIdentity: boolean;
};

function getIdentity(brandDraft?: BrandDraft, brandType: BrandType = "store", logoUrl?: string): PreviewIdentity {
  const usePetIdentity = brandType === "store";
  const name = usePetIdentity ? BRAND.name : brandDraft?.name || "品牌名称";
  const positioning = usePetIdentity ? BRAND.positioning : brandDraft?.positioning || "品牌定位尚待完善";
  return {
    name,
    positioning,
    slogan: usePetIdentity ? BRAND.slogan : positioning,
    tags: usePetIdentity ? ["宠物SPA", "高端养宠", "一宠一浴"] : brandType === "personal" ? ["专业观点", "个人成长", "产品服务"] : ["产品价值", "使用方法", "用户故事"],
    logoUrl: usePetIdentity ? IMAGES.logo : logoUrl,
    usePetIdentity,
  };
}

function IdentityAvatar({ identity, className }: { identity: PreviewIdentity; className: string }) {
  if (identity.logoUrl) return <img src={identity.logoUrl} alt={`${identity.name} logo`} className={`${className} object-contain`} />;
  return <div className={`${className} grid place-items-center bg-[#2C3E50] text-[12px] font-extrabold text-white`}>{identity.name.slice(0, 2)}</div>;
}

function StatusBar({ light = false }: { light?: boolean }) {
  return (
    <div className={`absolute inset-x-0 top-0 z-30 flex h-7 items-center justify-between px-5 text-[9px] font-semibold ${light ? "text-white" : "text-[#202020]"}`}>
      <span>9:41</span><span className="tracking-[0.1em]">● ◒ ▰</span>
    </div>
  );
}

function EmptyPlatformScreen({ label }: { label: string }) {
  return <div className="relative grid h-full place-items-center overflow-hidden rounded-[30px] bg-[#F5F3F0] text-center text-[#A9A19C]"><StatusBar /><div><div className="mx-auto grid size-20 place-items-center rounded-3xl border border-[#E4DED8] bg-white"><Camera size={30} /></div><p className="mt-5 text-[13px] font-bold text-[#6E6762]">{label}内容尚未生成</p><p className="mt-2 text-[10px]">完成对应物料后将在这里显示</p></div></div>;
}

function MeituanScreen({ progress, assetUrls = {}, identity }: { progress: StoryProgress; assetUrls?: PhonePreviewProps["assetUrls"]; identity: PreviewIdentity }) {
  if (!progress.meituanCover) return <EmptyPlatformScreen label="美团" />;
  return (
    <div className="relative flex h-full flex-col overflow-y-auto rounded-[30px] bg-[#F5F5F5] text-[#111] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <StatusBar light />
      <div className="relative w-full overflow-hidden bg-white">
        <img src={assetUrls.meituanCover || IMAGES.meituanCover} alt="爱宠门店主图" className="block h-auto w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/20" />
        <div className="absolute left-4 right-4 top-9 flex items-center justify-between text-white">
          <ArrowLeft size={18} /><div className="flex gap-3"><Search size={17} /><Share2 size={17} /><MoreHorizontal size={18} /></div>
        </div>
        <div className="absolute bottom-4 left-4 flex gap-2">
          {['宠物店', '洗护', 'SPA'].map((tag) => <span key={tag} className="rounded-full bg-white/90 px-2 py-1 text-[9px] font-semibold text-[#397C51]">{tag}</span>)}
        </div>
      </div>

      <div className="relative z-10 -mt-6 px-3 pb-16">
        <div className="rounded-xl bg-white p-4 shadow-[0_3px_14px_#00000010]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><h3 className="text-[16px] font-extrabold">{identity.name}</h3><p className="mt-1 truncate text-[10px] text-[#777]">{identity.positioning} · 距您500m</p></div>
            <span className="flex items-center gap-1 rounded-md border border-[#FFD2BE] bg-[#FFF4EE] px-2 py-1 text-[11px] font-bold text-[#FF6A28]"><Star size={11} fill="currentColor" /> 5.0分</span>
          </div>
          <div className="mt-3 flex items-center gap-3 border-t border-[#F0F0F0] pt-3 text-[9px] text-[#666]"><MapPin size={12} /><span className="flex-1">世纪广场 L2 层 · 营业至22:00</span><span>电话</span></div>
        </div>

        <div className="mt-3 flex items-center gap-5 rounded-t-xl bg-white px-4 pt-3 text-[11px]">
          {['团购', '人员', '案例', '评价', '更多推荐'].map((tab, i) => <span key={tab} className={`pb-2 ${i === 0 ? "border-b-2 border-[#FF7A00] font-bold text-[#FF7A00]" : "text-[#555]"}`}>{tab}</span>)}
        </div>
        <div className="rounded-b-xl bg-white px-4 pb-4">
          <div className="flex h-10 items-center gap-4 text-[10px]"><span className="font-bold text-[#FF7A00]">全部</span><span>洗护</span><span>SPA</span><span>护理</span><span>套餐</span></div>
          {progress.meituanService ? <div className="flex gap-3">
            <img src={assetUrls.meituanService || IMAGES.works[0]} alt="专属皮毛调理洗护服务图" className="size-20 shrink-0 rounded-md border border-[#FFD0C4] object-cover" />
            <div className="flex h-20 min-w-0 flex-1 flex-col justify-between"><div><div className="truncate text-[10px] font-bold">专属皮毛调理洗护</div><div className="mt-1 text-[8px] text-[#999]">温和低压洗护 · 一宠一浴</div></div><div className="text-right text-[8px] text-[#999]">新客专享</div><div className="flex items-center justify-between"><span className="text-[14px] font-bold text-[#FF7A00]">¥168</span><button className="rounded-full bg-[#FF7A00] px-4 py-1.5 text-[9px] font-bold text-white">抢购</button></div></div>
          </div> : <div className="grid h-32 place-items-center rounded-lg border border-dashed border-[#DDD] text-[10px] text-[#AAA]">暂无服务，生成后自动添加</div>}
        </div>
      </div>
      <div className="sticky inset-x-0 bottom-0 z-30 mt-auto flex h-14 shrink-0 items-center border-t border-[#EEE] bg-white px-4">
        <div className="flex flex-1 justify-around text-[#777]"><Home size={16} /><ShoppingBag size={16} /><MessageCircle size={16} /></div>
        <button className="w-40 rounded-full bg-[#FF7A00] py-2.5 text-[11px] font-bold text-white">在线咨询</button>
      </div>
    </div>
  );
}

function XiaohongshuProfile({ onOpenPost, progress, assetUrls = {}, identity }: { onOpenPost?: () => void; progress: StoryProgress; assetUrls?: PhonePreviewProps["assetUrls"]; identity: PreviewIdentity }) {
  if (!progress.xhsProfile && !progress.xhsPoster) return <EmptyPlatformScreen label="小红书" />;
  return (
    <div className="relative h-full overflow-hidden rounded-[30px] bg-white text-[#222]">
      <StatusBar light />
      <div className="relative h-[325px] overflow-hidden bg-[#181818] text-white">
        {progress.xhsProfile ? <img src={assetUrls.xhsProfile || IMAGES.xhsCover} alt="小红书主页背景" className="absolute inset-0 h-full w-full object-cover opacity-45" /> : <div className="absolute inset-0 bg-[linear-gradient(135deg,#2C3E50_0%,#2C3E50_58%,#BDC3C7_58%,#BDC3C7_78%,#E07A5F_78%)] opacity-90" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-[#181818]" />
        <div className="absolute left-4 right-4 top-9 flex items-center justify-between"><ArrowLeft size={18} /><MoreHorizontal size={20} /></div>
        <div className="absolute inset-x-4 bottom-5">
          <div className="flex items-center gap-3">
            <div className="grid size-16 place-items-center overflow-hidden rounded-full border-2 border-white bg-white"><IdentityAvatar identity={identity} className="h-full w-full rounded-full" /></div>
            <div><h3 className="text-[16px] font-bold">{identity.name}</h3><p className="mt-1 text-[9px] text-white/65">小红书号：88888888</p></div>
          </div>
          <p className="mt-3 line-clamp-2 text-[10px] text-white/85">{identity.slogan}</p>
          <div className="mt-3 flex gap-2">{identity.tags.map(tag => <span key={tag} className="rounded-full bg-white/10 px-2 py-1 text-[8px]">{tag}</span>)}</div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-5 text-center text-[9px]"><span><b className="block text-[12px]">38</b>关注</span><span><b className="block text-[12px]">2.8万</b>粉丝</span><span><b className="block text-[12px]">4.2万</b>获赞与收藏</span></div>
            <div className="flex gap-2"><button className="rounded-full bg-[#FF2442] px-5 py-2 text-[10px] font-bold">关注</button><button className="rounded-full border border-white/30 px-4 py-2 text-[10px]">私信</button></div>
          </div>
        </div>
      </div>
      <div className="flex h-12 items-center justify-around border-b border-[#EEE] text-[11px]"><span className="border-b-2 border-[#FF2442] px-8 py-4 font-bold">笔记</span><span>收藏</span><span>赞过</span></div>
      {progress.xhsPoster ? <div className="grid grid-cols-2 gap-x-1.5 gap-y-3 p-1.5">
        {XHS_POSTS.slice(0, 1).map((post, index) => (
          <button key={post.title} type="button" onClick={index === 0 ? onOpenPost : undefined} className="overflow-hidden rounded-md bg-white text-left">
            <div className={`overflow-hidden bg-[#EEF1ED] ${index % 3 === 0 ? "h-40" : "h-32"}`}><img src={assetUrls.xhsPoster || post.image} alt="笔记封面" className="h-full w-full object-cover" /></div>
            <div className="p-2"><p className="line-clamp-2 text-[10px] font-semibold leading-4">{identity.usePetIdentity ? post.title : identity.positioning}</p><div className="mt-2 flex items-center justify-between text-[8px] text-[#888]"><span className="flex items-center gap-1"><IdentityAvatar identity={identity} className="size-4 rounded-full" />{identity.name}</span><span>♡ {post.likes}</span></div></div>
          </button>
        ))}
      </div> : <div className="grid h-48 place-items-center text-center text-[10px] text-[#AAA]"><div><Camera size={24} className="mx-auto mb-3" /><p>暂无笔记</p><p className="mt-1">生成营销海报后自动发布</p></div></div>}
    </div>
  );
}

function XiaohongshuNote({ onBack, imageUrl, identity }: { onBack?: () => void; imageUrl?: string; identity: PreviewIdentity }) {
  return (
    <div className="relative h-full overflow-y-auto rounded-[30px] bg-white text-[#222] [scrollbar-width:none]">
      <StatusBar />
      <div className="sticky top-0 z-20 mt-7 flex h-[60px] items-center justify-between border-b border-[#EEE] bg-white px-4">
        <button type="button" onClick={onBack} aria-label="返回小红书主页" className="grid size-8 place-items-center rounded-full transition hover:bg-[#F5F5F5]"><ArrowLeft size={19} /></button><div className="flex flex-1 items-center gap-2 pl-2"><IdentityAvatar identity={identity} className="size-8 rounded-full" /><span className="text-[11px] font-semibold">{identity.name}</span></div><button className="rounded-full bg-[#FF2442] px-4 py-2 text-[10px] font-bold text-white">关注</button><MoreHorizontal size={18} className="ml-3" />
      </div>
      <div className="relative w-full overflow-hidden bg-[#ECEBE8]"><img src={imageUrl || IMAGES.xhsPoster} alt="小红书笔记大图" className="block h-auto w-full" /></div>
      <div className="px-4 pb-20"><h2 className="text-[15px] font-bold leading-6">{identity.usePetIdentity ? "✨ 商场里藏着一家宠物 SPA，终于找到宠物的“高级护理空间”🐾" : identity.positioning}</h2><p className="mt-3 whitespace-pre-line text-[11px] leading-[1.75]">{identity.usePetIdentity ? XHS_NOTE : `这是 ${identity.name} 的第一篇品牌内容。\n\n围绕专业价值、方法与真实经验，持续建立清晰、可信赖的表达。`}</p><p className="mt-4 border-t border-[#EEE] pt-3 text-[9px] text-[#AAA]">编辑于 1分钟前 · 上海</p></div>
      <div className="sticky bottom-0 flex h-14 items-center gap-4 border-t border-[#EEE] bg-white px-3"><div className="flex-1 rounded-full bg-[#F4F4F4] px-4 py-2.5 text-[10px] text-[#999]">说点什么...</div><Heart size={19} /><MessageCircle size={19} /><Star size={19} /></div>
    </div>
  );
}

function WechatScreen({ progress, assetUrls = {}, identity }: { progress: StoryProgress; assetUrls?: PhonePreviewProps["assetUrls"]; identity: PreviewIdentity }) {
  if (!progress.wechatCover) return <EmptyPlatformScreen label="微信" />;
  return (
    <div className="relative h-full overflow-y-auto rounded-[30px] bg-white text-[#222] [scrollbar-width:none]">
      <StatusBar light />
      <div className="relative h-[325px] overflow-hidden bg-gradient-to-br from-[#4DB6C8] to-[#65BF77]">
        <img src={assetUrls.wechatCover || IMAGES.wechatCover} alt="微信朋友圈封面" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute left-4 right-4 top-9 flex justify-between text-white"><ArrowLeft size={18} /><Camera size={19} /></div>
        <div className="absolute -bottom-5 right-4 flex items-end gap-3"><span className="mb-7 text-[13px] font-bold text-white">{identity.name}</span><IdentityAvatar identity={identity} className="size-16 rounded-lg border-2 border-white bg-white shadow" /></div>
      </div>
      {progress.wechatPoster ? <div className="px-4 pb-4 pt-9">
        <div className="flex gap-3"><IdentityAvatar identity={identity} className="size-9 rounded-md bg-white" /><div className="min-w-0 flex-1"><div className="text-[11px] font-bold text-[#576B95]">{identity.name}</div><p className="mt-1 whitespace-pre-line text-[10px] leading-[1.6]">{identity.usePetIdentity ? WECHAT_COPY : `${identity.positioning}\n\n从今天开始，持续分享专业观点、方法与实践。`}</p><img src={assetUrls.wechatPoster || IMAGES.wechatPoster} alt="朋友圈活动海报" className="mt-2 w-44 rounded-md object-contain" /><div className="mt-2 flex justify-between text-[8px] text-[#AAA]"><span>1分钟前</span><MoreHorizontal size={14} className="rounded bg-[#F3F3F3] px-0.5 text-[#576B95]" /></div></div></div>
      </div> : <div className="grid h-48 place-items-center pt-8 text-center text-[10px] text-[#AAA]"><div><Camera size={24} className="mx-auto mb-3" /><p>暂无朋友圈内容</p><p className="mt-1">生成推广物料后自动发布</p></div></div>}
    </div>
  );
}

export function PhonePreview({ platform, xhsDetail = false, compact = false, onOpenXhsPost, onBackXhsPost, progress = COMPLETE_STORY_PROGRESS, assetUrls = {}, brandDraft, brandType = "store", logoUrl }: PhonePreviewProps) {
  const identity = getIdentity(brandDraft, brandType, logoUrl);
  const screen = platform === "meituan" ? <MeituanScreen progress={progress} assetUrls={assetUrls} identity={identity} /> : platform === "wechat" ? <WechatScreen progress={progress} assetUrls={assetUrls} identity={identity} /> : xhsDetail && progress.xhsPoster ? <XiaohongshuNote onBack={onBackXhsPost} imageUrl={assetUrls.xhsPoster} identity={identity} /> : <XiaohongshuProfile onOpenPost={onOpenXhsPost} progress={progress} assetUrls={assetUrls} identity={identity} />;
  const phone = <div className="phone-shell"><div className="h-full overflow-hidden rounded-[31px] bg-white">{screen}</div></div>;
  if (compact) return <div className="relative h-[636px] w-[318px]"><div className="absolute left-0 top-0 origin-top-left scale-[0.76]">{phone}</div></div>;
  return phone;
}
