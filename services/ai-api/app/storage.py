import asyncio
from pathlib import Path
from uuid import uuid4

import boto3
import httpx

from .config import get_settings


class ObjectStorage:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _client(self):
        if not (
            self.settings.s3_endpoint_url
            and self.settings.s3_access_key_id
            and self.settings.s3_secret_access_key
        ):
            return None
        return boto3.client(
            "s3",
            endpoint_url=self.settings.s3_endpoint_url,
            aws_access_key_id=self.settings.s3_access_key_id,
            aws_secret_access_key=self.settings.s3_secret_access_key,
        )

    async def put_bytes(self, data: bytes, content_type: str, prefix: str, filename: str) -> tuple[str, str]:
        extension = Path(filename).suffix or ".bin"
        key = f"{prefix}/{uuid4()}{extension.lower()}"
        client = self._client()
        if client:
            await asyncio.to_thread(
                client.put_object,
                Bucket=self.settings.s3_bucket,
                Key=key,
                Body=data,
                ContentType=content_type,
            )
            base = (self.settings.s3_public_base_url or self.settings.s3_endpoint_url or "").rstrip("/")
            return key, f"{base}/{self.settings.s3_bucket}/{key}"

        directory = Path("data/objects") / prefix
        directory.mkdir(parents=True, exist_ok=True)
        target = directory / f"{uuid4()}{extension.lower()}"
        await asyncio.to_thread(target.write_bytes, data)
        return str(target).replace("\\", "/"), f"/v1/objects/{target.name}?prefix={prefix}"

    async def import_remote(self, url: str, prefix: str) -> tuple[str, str]:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.get(url)
            response.raise_for_status()
        content_type = response.headers.get("content-type", "image/png")
        extension = ".png" if "png" in content_type else ".webp" if "webp" in content_type else ".jpg"
        return await self.put_bytes(response.content, content_type, prefix, f"asset{extension}")


object_storage = ObjectStorage()

