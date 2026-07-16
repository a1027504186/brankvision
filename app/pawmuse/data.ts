import type { BrandProfile, ChatMessage, Product, XiaohongshuPost } from "./types";

export const IMAGES = {
  logo: "https://github.com/user-attachments/assets/42612de6-2f00-4891-a8bc-c4f63baf30e0",
  meituanCover: "https://github.com/user-attachments/assets/f94b005d-ea65-49c1-aace-a041ced9e3ab",
  xhsCover: "https://github.com/user-attachments/assets/0d17b64f-b735-4208-9653-3c5375a1d72e",
  wechatCover: "https://github.com/user-attachments/assets/768bd141-edeb-4b12-841d-4a44df1e4b67",
  wechatPoster: "https://github.com/user-attachments/assets/783169d8-d37d-4c52-9579-6e018e57fb0a",
  xhsPoster: "https://github.com/user-attachments/assets/0e8972e4-bf88-49c3-9ff4-6707df121c1a",
  works: [
    "https://github.com/user-attachments/assets/32b7ff44-db14-4709-982a-7d889c52ed58",
    "https://github.com/user-attachments/assets/aeadf92e-e83c-4645-8c26-d67762a18f2e",
    "https://github.com/user-attachments/assets/f3dd7d7e-d024-4114-9385-50fdeac36b9a",
    "https://github.com/user-attachments/assets/6022e083-146d-4e79-b5a4-0c9e9097082c",
  ],
} as const;

export const BRAND: BrandProfile = {
  name: "爱宠",
  slogan: "人宠共悦的美好生活提案",
  category: "宠物店",
  positioning: "高端商场里的宠物 SPA",
  colors: [
    { name: "品牌主色", value: "#FF9900" },
    { name: "辅助色", value: "#0066FF" },
    { name: "点缀色", value: "#FFD700" },
    { name: "背景色", value: "#FFFFFF" },
    { name: "文字色", value: "#333333" },
  ],
  assets: [
    { id: "meituan-cover", name: "美团店铺主图", size: "800×800", platform: "meituan", url: IMAGES.meituanCover },
    { id: "meituan-service", name: "美团服务主图", size: "800×800", platform: "meituan", url: IMAGES.works[0] },
    { id: "xhs-profile", name: "小红书账号主页", size: "1080×810", platform: "xiaohongshu", url: IMAGES.xhsCover },
    { id: "xhs-note", name: "小红书营销海报", size: "1080×1440", platform: "xiaohongshu", url: IMAGES.xhsPoster },
    { id: "wechat-cover", name: "微信账号主图", size: "1080×810", platform: "wechat", url: IMAGES.wechatCover },
    { id: "wechat-poster", name: "朋友圈营销海报", size: "1080×1920", platform: "wechat", url: IMAGES.wechatPoster },
  ],
};

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "你好！我是 SPECTRUM 品牌向导。\n用 10 分钟，我将帮你打造一家专业且有温度的品牌形象 ✨",
    time: "17:08",
  },
  { id: "type", role: "assistant", content: "首先，请问您的店铺主营什么业务类型？", time: "17:08" },
  { id: "answer-type", role: "user", content: "宠物店", time: "17:08" },
  {
    id: "name",
    role: "assistant",
    content: "收到，主要业务为「宠物店」。\n接下来，请问您的店铺叫什么名字？",
    time: "17:08",
  },
  { id: "answer-name", role: "user", content: "爱宠", time: "17:08" },
  {
    id: "position",
    role: "assistant",
    content: "太棒了，「爱宠」是个很有温度的名字！\n结合高端商场宠物 SPA 的定位，品牌视觉体系已经建立。",
    time: "17:08",
    attachment: "brand",
  },
];

export const PRODUCTS: Product[] = [
  { title: "[犬猫体检] 壹元基础体检", subtitle: "挂号 / 粪检 / 耳道检查", price: "¥1", originalPrice: "¥120", sales: "年售60+", tone: "mint" },
  { title: "专属皮毛调理洗护", subtitle: "温和低压洗护 · 一宠一浴", price: "¥168", originalPrice: "¥238", sales: "已售128", tone: "peach" },
  { title: "宠物 SPA 深度护理", subtitle: "专业皮毛调理 · 焕发光泽", price: "¥268", originalPrice: "¥328", sales: "已售86", tone: "yellow" },
];

export const XHS_POSTS: XiaohongshuPost[] = [
  { title: "商场里藏着一家宠物 SPA 🐾", image: IMAGES.xhsPoster, likes: 128 },
  { title: "一宠一浴，认真呵护每一位小朋友", image: IMAGES.works[0], likes: 86 },
  { title: "毛孩子的精致生活也要有仪式感", image: IMAGES.works[1], likes: 235 },
  { title: "低压洗护到底有多舒服？", image: IMAGES.works[2], likes: 99 },
];

export const XHS_NOTE = `谁说精致生活只能属于人类呀🥹
现在的小朋友也值得拥有一次认真呵护～

带 TA 来体验了一次【爱宠 SPA】
像走进了一家宠物专属的高级护理会所✨

🫧 猫狗独立洗护空间
🧴 温和低压洗护流程
🤍 一宠一浴·安心护理
✨ 专业皮毛调理，让毛孩子焕发光泽

#宠物SPA #高端养宠 #宠物美容 #精致养宠`;

export const WECHAT_COPY = `🐾 新店体验开启｜爱宠 SPA

给 TA 一个小小的仪式感✨

高级洗护 · 皮毛调理 · SPA护理

我们关注的不只是“洗干净”，更希望每一次护理，都让 TA 感受到安全、舒适和被照顾。

✨ 新客体验价 ¥168 起`;
