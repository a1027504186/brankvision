export type AgentBrandType = "personal" | "store" | "product";
export type AgentPlatform = "meituan" | "xiaohongshu" | "wechat";
export type AgentStyle = "warm" | "playful" | "premium";
export type AgentStage = "name" | "positioning" | "style" | "logo" | "platform" | "asset_brief" | "free";
export type AgentAssetKind = "brand-logo" | "meituan-cover" | "meituan-service" | "xhs-profile" | "xhs-note" | "wechat-cover" | "wechat-poster";

export type AgentMessage = {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  createdAt: string;
  attachment?: "brand" | "poster";
  imageUrl?: string;
};

export type AgentAsset = {
  id: AgentAssetKind;
  name: string;
  size: string;
  platform: AgentPlatform;
  url: string;
  prompt: string;
  createdAt: string;
};

export type AgentSession = {
  id: string;
  brandType: AgentBrandType;
  category: string;
  stage: AgentStage;
  pendingAsset?: AgentAssetKind;
  brand: {
    name: string;
    positioning: string;
    style?: AgentStyle;
    platform?: AgentPlatform;
  };
  messages: AgentMessage[];
  assets: AgentAsset[];
  traces?: AgentTrace[];
  progress: {
    brandReady: boolean;
    meituanCover: boolean;
    meituanService: boolean;
    xhsProfile: boolean;
    xhsPoster: boolean;
    wechatCover: boolean;
    wechatPoster: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

export type AgentAction =
  | { type: "update_name"; value: string }
  | { type: "update_positioning"; value: string }
  | { type: "set_style"; value: AgentStyle }
  | { type: "generate_logo"; prompt: string }
  | { type: "skip_logo" }
  | { type: "select_platform"; value: AgentPlatform }
  | { type: "generate_asset"; prompt: string; kind?: Exclude<AgentAssetKind, "brand-logo"> }
  | { type: "respond" };

export type AgentDecision = {
  reply: string;
  action: AgentAction;
};

export type AgentTrace = {
  id: string;
  input: string;
  route: "workflow" | "question" | "retry" | "skip" | "switch_platform" | "generate_asset";
  action?: AgentAction["type"];
  assetKind?: AgentAssetKind;
  platform?: AgentPlatform;
  status: "running" | "passed" | "failed";
  checks: string[];
  retrieval?: string[];
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
};
