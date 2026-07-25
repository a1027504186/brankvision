export type BrandStyleId = "warm" | "playful" | "premium";

export type BrandStyleSystem = {
  name: string;
  mood: string;
  colors: Array<{ name: string; value: string }>;
  typography: {
    heading: string;
    body: string;
  };
  imageDirection: string;
};

export const BRAND_STYLE_SYSTEMS: Record<BrandStyleId, BrandStyleSystem> = {
  warm: {
    name: "温馨治愈",
    mood: "柔和、亲近、有人情味，画面留白充足，避免冰冷与强刺激",
    colors: [
      { name: "品牌主色", value: "#D49887" },
      { name: "辅助色", value: "#F5DFD6" },
      { name: "点缀色", value: "#A3B19B" },
      { name: "背景色", value: "#FFFAF0" },
      { name: "文字色", value: "#4A3C31" },
    ],
    typography: { heading: "Sans-serif Heavy", body: "Sans-serif Regular" },
    imageDirection: "soft natural light, warm editorial photography, rounded geometry, calm negative space",
  },
  playful: {
    name: "活力俏皮",
    mood: "年轻、醒目、积极、有趣，使用清晰的大色块和轻快的视觉节奏",
    colors: [
      { name: "品牌主色", value: "#FF9900" },
      { name: "辅助色", value: "#0066FF" },
      { name: "点缀色", value: "#FFD700" },
      { name: "背景色", value: "#FFFFFF" },
      { name: "文字色", value: "#333333" },
    ],
    typography: { heading: "Sans-serif Heavy", body: "Sans-serif Regular" },
    imageDirection: "bright commercial photography, bold color blocking, energetic composition, crisp mobile-first hierarchy",
  },
  premium: {
    name: "专业严谨",
    mood: "克制、可信、专业、现代，结构明确，避免廉价科技感和过度装饰",
    colors: [
      { name: "品牌主色", value: "#2C3E50" },
      { name: "辅助色", value: "#BDC3C7" },
      { name: "点缀色", value: "#E07A5F" },
      { name: "背景色", value: "#F8F9FA" },
      { name: "文字色", value: "#2C3E50" },
    ],
    typography: { heading: "Sans-serif Heavy", body: "Sans-serif Regular" },
    imageDirection: "restrained editorial design, precise grid, premium corporate photography, generous negative space",
  },
};

export function getBrandStyleSystem(style?: BrandStyleId) {
  return BRAND_STYLE_SYSTEMS[style || "premium"];
}
