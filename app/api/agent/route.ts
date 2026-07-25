type AgentMessage = {
  role: "user" | "assistant";
  content: string;
};

type AgentRequest = {
  messages?: AgentMessage[];
  brandType?: "personal" | "store" | "product";
  stage?: string;
  brand?: {
    name?: string;
    positioning?: string;
    style?: string;
    platform?: string;
  };
};

const TYPE_LABELS = {
  personal: "个人品牌",
  store: "店铺品牌",
  product: "产品品牌",
} as const;

function systemPrompt(input: AgentRequest) {
  const type = input.brandType ?? "personal";
  const brand = input.brand ?? {};
  return `你是 SPECTRUM 品牌智能体，服务个人创业者、小微商家和独立创作者。
当前任务：协助用户建立${TYPE_LABELS[type]}。
当前阶段：${input.stage ?? "品牌梳理"}。
已知品牌资料：名称=${brand.name || "未确定"}；定位=${brand.positioning || "未确定"}；风格=${brand.style || "未确定"}；平台=${brand.platform || "未确定"}。

回复要求：
1. 使用自然、专业、有判断力的中文，不要像机械表单。
2. 每次只推进一个关键问题，正文控制在 120 字以内。
3. 已经明确的信息不要重复询问。
4. 可以给一个简短示例，但不要替用户做未经确认的关键决定。
5. 不要声称已经生成图片或保存资产，除非上下文明确说明工具已经成功执行。
6. 只输出给用户看的回复正文，不输出 JSON、标题或分析过程。`;
}

export async function POST(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return Response.json({ error: "DeepSeek API 尚未配置" }, { status: 503 });

  let input: AgentRequest;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "请求格式无效" }, { status: 400 });
  }

  const messages = (input.messages ?? [])
    .filter((message) => message && (message.role === "user" || message.role === "assistant") && typeof message.content === "string")
    .slice(-16)
    .map((message) => ({ role: message.role, content: message.content.slice(0, 4000) }));

  if (!messages.length) return Response.json({ error: "缺少对话内容" }, { status: 400 });

  const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
      messages: [{ role: "system", content: systemPrompt(input) }, ...messages],
      max_tokens: 260,
      temperature: 0.7,
      thinking: { type: "disabled" },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("DeepSeek request failed", response.status, detail.slice(0, 500));
    return Response.json({ error: "品牌智能体暂时无法响应" }, { status: 502 });
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) return Response.json({ error: "品牌智能体未返回有效内容" }, { status: 502 });

  return Response.json({ reply, model: data.model });
}
