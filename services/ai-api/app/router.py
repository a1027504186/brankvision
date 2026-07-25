import json
import re

import httpx

from .config import get_settings
from .schemas import RouteDecision

PLATFORM_PATTERNS = {
    "meituan": r"美团",
    "xiaohongshu": r"小红书|红薯",
    "wechat": r"微信|朋友圈|公众号",
}


def local_route(message: str, stage: str, pending_asset: str | None = None) -> RouteDecision:
    platform = next(
        (name for name, pattern in PLATFORM_PATTERNS.items() if re.search(pattern, message)),
        None,
    )
    retry = bool(re.search(r"重试|重新生成|再生成|再来一次", message))
    question = bool(re.search(r"[？?]|为什么|怎么|是否|失败|没有生成|不对|不是", message))
    skip = bool(re.search(r"跳过|暂用|先不生成|暂时不做", message))
    generating = bool(re.search(r"生成|制作|设计|创建|做一张|做一个", message))

    asset_kind = None
    if platform == "wechat":
        asset_kind = "wechat-poster" if re.search(r"朋友圈|海报|推广", message) else "wechat-cover"
    elif platform == "xiaohongshu":
        asset_kind = "xhs-note" if re.search(r"笔记|海报|推广", message) else "xhs-profile"
    elif platform == "meituan":
        asset_kind = "meituan-service" if re.search(r"服务|项目|商品", message) else "meituan-cover"

    if retry:
        return RouteDecision(route="retry", confidence=0.99, reason="检测到明确重试指令")
    if question:
        return RouteDecision(route="question", confidence=0.92, reason="用户正在追问当前状态")
    if skip:
        return RouteDecision(route="skip", confidence=0.96, reason="检测到跳过或暂缓指令")
    if generating and (asset_kind or pending_asset):
        return RouteDecision(
            route="generate_asset",
            platform=platform,
            asset_kind=asset_kind or pending_asset,
            confidence=0.94,
            reason="检测到明确物料生成指令",
        )
    if platform and re.search(r"切换|查看|预览|打开|进入", message):
        return RouteDecision(
            route="switch_platform",
            platform=platform,
            confidence=0.95,
            reason="用户只要求切换或查看平台",
        )
    return RouteDecision(route="workflow", confidence=0.72, reason=f"按当前阶段 {stage} 推进")


async def route_intent(message: str, stage: str, payload: dict) -> RouteDecision:
    fallback = local_route(message, stage, payload.get("pendingAsset"))
    if fallback.route in {"retry", "skip", "switch_platform", "generate_asset"}:
        return fallback
    settings = get_settings()
    if not settings.deepseek_api_key:
        return fallback

    try:
        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.post(
                f"{settings.deepseek_base_url.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {settings.deepseek_api_key}"},
                json={
                    "model": settings.deepseek_model,
                    "temperature": 0,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "你是品牌智能体的意图路由器。只返回 JSON。"
                                "route 只能是 workflow、question、retry、skip、"
                                "switch_platform、generate_asset；同时返回 platform、"
                                "asset_kind、confidence、reason。"
                                "生成物料绝不能误判为只切换平台。"
                            ),
                        },
                        {
                            "role": "user",
                            "content": json.dumps(
                                {"stage": stage, "state": payload, "message": message},
                                ensure_ascii=False,
                            ),
                        },
                    ],
                },
            )
            response.raise_for_status()
            parsed = json.loads(response.json()["choices"][0]["message"]["content"])
            return RouteDecision.model_validate(parsed)
    except Exception:
        return fallback
