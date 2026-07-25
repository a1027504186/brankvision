import json
from datetime import timedelta
from typing import Any

from redis.asyncio import Redis

from .config import get_settings


class StateCache:
    def __init__(self) -> None:
        self._redis: Redis | None = None
        self._memory: dict[str, str] = {}

    async def connect(self) -> None:
        url = get_settings().redis_url
        if not url:
            return
        try:
            redis = Redis.from_url(url, decode_responses=True)
            await redis.ping()
            self._redis = redis
        except Exception:
            self._redis = None

    async def close(self) -> None:
        if self._redis:
            await self._redis.aclose()

    async def get_json(self, key: str) -> Any | None:
        raw = await self._redis.get(key) if self._redis else self._memory.get(key)
        return json.loads(raw) if raw else None

    async def set_json(self, key: str, value: Any, ttl: timedelta = timedelta(hours=2)) -> None:
        raw = json.dumps(value, ensure_ascii=False)
        if self._redis:
            await self._redis.set(key, raw, ex=int(ttl.total_seconds()))
        else:
            self._memory[key] = raw

    async def set_progress(self, task_id: str, status: str, percent: int, detail: str = "") -> None:
        await self.set_json(
            f"task:{task_id}",
            {"task_id": task_id, "status": status, "percent": percent, "detail": detail},
            timedelta(hours=24),
        )


state_cache = StateCache()

