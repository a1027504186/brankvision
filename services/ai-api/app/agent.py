from datetime import UTC, datetime
from time import perf_counter
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .cache import state_cache
from .graph import runtime_graph
from .models import AgentSession, AgentTrace, Brand, User
from .schemas import BrandCreate, MessageInput, RouteDecision, TurnResponse

STYLE_MAP = {"温馨治愈": "warm", "活力俏皮": "playful", "专业严谨": "premium"}
PLATFORM_LABELS = {"meituan": "美团", "xiaohongshu": "小红书", "wechat": "微信"}


def initial_payload(brand: Brand) -> dict:
    now = datetime.now(UTC).isoformat()
    labels = {"personal": "个人品牌", "store": "店铺品牌", "product": "产品品牌"}
    questions = {
        "personal": "先告诉我，你希望用什么名字被记住？可以是本名、昵称或个人品牌名。",
        "store": "先告诉我店铺叫什么名字。如果有 Slogan，也可以一起告诉我。",
        "product": "先告诉我产品叫什么名字；没有正式名称也可以先用项目代号。",
    }
    return {
        "id": "",
        "brandType": brand.brand_type,
        "category": brand.category,
        "stage": "name",
        "brand": {"name": "", "positioning": ""},
        "messages": [
            {
                "id": str(uuid4()),
                "role": "assistant",
                "content": (
                    "你好，我是 SPECTRUM 品牌智能体。"
                    "我会梳理定位、建立视觉体系，并按需生成品牌资产。"
                ),
                "createdAt": now,
            },
            {
                "id": str(uuid4()),
                "role": "assistant",
                "content": f"收到，我们先建立一个「{labels[brand.brand_type]}」。{questions[brand.brand_type]}",
                "createdAt": now,
            },
        ],
        "assets": [],
        "progress": {
            "brandReady": False,
            "meituanCover": False,
            "meituanService": False,
            "xhsProfile": False,
            "xhsPoster": False,
            "wechatCover": False,
            "wechatPoster": False,
        },
    }


async def create_agent_session(db: AsyncSession, request: BrandCreate) -> AgentSession:
    user_id = None
    if request.user_external_id:
        user = await db.scalar(select(User).where(User.external_id == request.user_external_id))
        if not user:
            user = User(external_id=request.user_external_id)
            db.add(user)
            await db.flush()
        user_id = user.id

    brand = Brand(user_id=user_id, brand_type=request.brand_type, category=request.category)
    db.add(brand)
    await db.flush()
    payload = initial_payload(brand)
    session = AgentSession(brand_id=brand.id, stage="name", payload=payload)
    db.add(session)
    await db.flush()
    payload["id"] = session.id
    session.payload = payload
    await db.commit()
    await db.refresh(session)
    await state_cache.set_json(f"session:{session.id}", payload)
    return session


async def get_session(db: AsyncSession, session_id: str) -> AgentSession | None:
    return await db.get(AgentSession, session_id)


def options_for(stage: str, brand_type: str) -> list[str]:
    if stage == "style":
        return ["温馨治愈", "活力俏皮", "专业严谨"]
    if stage == "logo":
        return ["字母标与抽象符号", "图形标", "暂用字母标"]
    if stage == "platform":
        return ["美团", "小红书", "微信"] if brand_type == "store" else ["小红书", "微信"]
    return []


def _append(payload: dict, role: str, content: str) -> None:
    payload.setdefault("messages", []).append(
        {
            "id": str(uuid4()),
            "role": role,
            "content": content,
            "createdAt": datetime.now(UTC).isoformat(),
        }
    )


def _workflow_step(payload: dict, message: str, route: RouteDecision) -> str:
    stage = payload["stage"]
    if route.route == "question":
        return "我会先回答这个问题，不推进当前流程。当前状态和已生成资产均保持不变。"
    if route.route == "switch_platform" and route.platform:
        payload["brand"]["platform"] = route.platform
        return f"已切换到{PLATFORM_LABELS[route.platform]}预览，不会因此生成新物料。"
    if route.route == "skip":
        if stage == "logo":
            payload["stage"] = "platform"
            return "已暂时跳过 Logo，之后可以随时补做。接下来请选择优先落地的平台。"
        return "已保留当前结果并跳过本轮操作。"
    if route.route == "retry":
        return "已保留当前品牌状态，我会按原任务重新执行，不重复推进流程。"
    if route.route == "generate_asset":
        payload["pendingAsset"] = route.asset_kind
        payload["stage"] = "asset_brief"
        return (
            "已识别为物料生成任务。生成会沿用当前品牌视觉方案，"
            "完成后同步到资产库和平台预览。"
        )
    if stage == "name":
        payload["brand"]["name"] = message.split("，")[0].strip()[:80]
        payload["stage"] = "positioning"
        return (
            f"「{payload['brand']['name']}」已经记录。"
            "接下来请描述目标人群、核心价值和希望被怎样记住。"
        )
    if stage == "positioning":
        payload["brand"]["positioning"] = message[:500]
        payload["stage"] = "style"
        return "定位已经记录。请选择最接近你想法的品牌视觉风格。"
    if stage == "style":
        selected = next((value for label, value in STYLE_MAP.items() if label in message), "premium")
        payload["brand"]["style"] = selected
        payload["progress"]["brandReady"] = True
        payload["stage"] = "logo"
        return "色彩与排版体系已经建立。接下来我们完成品牌 Logo。"
    if stage == "logo":
        payload["stage"] = "platform"
        return "Logo 方向已经记录，接下来请选择优先落地的平台。"
    if stage == "platform":
        platform = next((key for key, label in PLATFORM_LABELS.items() if label in message), "xiaohongshu")
        payload["brand"]["platform"] = platform
        payload["stage"] = "asset_brief"
        return f"已选择{PLATFORM_LABELS[platform]}。请描述第一项物料要表达的内容与氛围。"
    return "需求已记录，我会基于当前品牌定位、视觉方案和知识库继续处理。"


async def run_turn(db: AsyncSession, session: AgentSession, request: MessageInput) -> TurnResponse:
    started = perf_counter()
    payload = dict(session.payload)
    _append(payload, "user", request.message)
    graph_result = await runtime_graph.ainvoke(
        {
            "message": request.message,
            "stage": session.stage,
            "payload": payload,
            "brand_id": session.brand_id,
            "db": db,
        }
    )
    route = graph_result["route"]
    retrieval = graph_result["retrieval"]
    reply = _workflow_step(payload, request.message, route)
    if retrieval.citations and route.route in {"question", "workflow"}:
        reply += f"\n\n我参考了 {len(retrieval.citations)} 条品牌知识，来源已附在本轮结果中。"
    _append(payload, "assistant", reply)

    session.stage = payload["stage"]
    session.payload = payload
    session.updated_at = datetime.now(UTC)
    trace = AgentTrace(
        session_id=session.id,
        route=route.route,
        input_text=request.message,
        action=route.asset_kind or route.platform,
        status="passed",
        checks=["session-updated", "retrieval-completed"],
        retrieval=[citation.model_dump() for citation in retrieval.citations],
        duration_ms=int((perf_counter() - started) * 1000),
    )
    db.add(trace)
    await db.commit()
    await db.refresh(session)
    await state_cache.set_json(f"session:{session.id}", payload)
    return TurnResponse(
        session=session,
        route=route,
        reply=reply,
        citations=retrieval.citations,
        options=options_for(session.stage, payload["brandType"]),
        trace_id=trace.id,
    )
