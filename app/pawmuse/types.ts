export type Platform = "meituan" | "xiaohongshu" | "wechat";

export type AppView = "dashboard" | "workspace" | "gallery";

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  time?: string;
  attachment?: "brand" | "poster";
};

export type BrandAsset = {
  id: string;
  name: string;
  size: string;
  platform: Platform;
  url: string;
};

export type StoryProgress = {
  brandReady: boolean;
  meituanCover: boolean;
  meituanService: boolean;
  xhsProfile: boolean;
  xhsPoster: boolean;
  wechatCover: boolean;
  wechatPoster: boolean;
};

export const EMPTY_STORY_PROGRESS: StoryProgress = {
  brandReady: false,
  meituanCover: false,
  meituanService: false,
  xhsProfile: false,
  xhsPoster: false,
  wechatCover: false,
  wechatPoster: false,
};

export const COMPLETE_STORY_PROGRESS: StoryProgress = {
  brandReady: true,
  meituanCover: true,
  meituanService: true,
  xhsProfile: true,
  xhsPoster: true,
  wechatCover: true,
  wechatPoster: true,
};

export type Product = {
  title: string;
  subtitle: string;
  price: string;
  originalPrice: string;
  sales: string;
  tone: "mint" | "peach" | "yellow";
};

export type XiaohongshuPost = {
  title: string;
  image: string;
  likes: number;
};

export type BrandProfile = {
  name: string;
  slogan: string;
  category: string;
  positioning: string;
  colors: Array<{ name: string; value: string }>;
  assets: BrandAsset[];
};
