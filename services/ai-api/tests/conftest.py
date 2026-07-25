import os
from pathlib import Path

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

TEST_DB = Path(__file__).parent / "test-spectrum.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{TEST_DB.as_posix()}"
os.environ.pop("REDIS_URL", None)


@pytest_asyncio.fixture
async def client():
    from app.cache import state_cache
    from app.database import create_schema, engine
    from app.main import app

    await create_schema()
    await state_cache.connect()
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as test_client:
        yield test_client
    await state_cache.close()
    await engine.dispose()
    TEST_DB.unlink(missing_ok=True)
