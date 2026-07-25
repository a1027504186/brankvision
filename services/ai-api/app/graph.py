from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph
from sqlalchemy.ext.asyncio import AsyncSession

from .rag import retrieve
from .router import route_intent
from .schemas import RetrievalResponse, RouteDecision


class RuntimeState(TypedDict, total=False):
    message: str
    stage: str
    payload: dict[str, Any]
    brand_id: str | None
    db: AsyncSession
    route: RouteDecision
    retrieval: RetrievalResponse


async def route_node(state: RuntimeState) -> RuntimeState:
    route = await route_intent(state["message"], state["stage"], state["payload"])
    return {"route": route}


async def retrieve_node(state: RuntimeState) -> RuntimeState:
    result = await retrieve(
        state["db"],
        state["message"],
        brand_id=state.get("brand_id"),
        top_k=4,
    )
    return {"retrieval": result}


def finish_node(_: RuntimeState) -> RuntimeState:
    return {}


runtime_graph = (
    StateGraph(RuntimeState)
    .add_node("route_intent", route_node)
    .add_node("retrieve_context", retrieve_node)
    .add_node("finish", finish_node)
    .add_edge(START, "route_intent")
    .add_edge("route_intent", "retrieve_context")
    .add_edge("retrieve_context", "finish")
    .add_edge("finish", END)
    .compile()
)

