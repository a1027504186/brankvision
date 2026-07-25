import asyncio

import httpx

from .config import get_settings


class ImageGenerationError(RuntimeError):
    pass


class ImageClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def generate(self, prompt: str, aspect_ratio: str, images: list[str] | None = None) -> str:
        if not self.settings.image_api_key:
            raise ImageGenerationError("IMAGE_API_NOT_CONFIGURED")
        headers = {"Authorization": f"Bearer {self.settings.image_api_key}"}
        payload = {
            "model": self.settings.image_api_model,
            "prompt": prompt,
            "images": (images or [])[:4],
            "aspectRatio": aspect_ratio,
            "imageSize": "1K",
            "replyType": "json",
        }
        base = self.settings.image_api_base_url.rstrip("/")
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(f"{base}/v1/api/generate", headers=headers, json=payload)
            if response.status_code >= 400:
                if "insufficient credits" in response.text.lower():
                    raise ImageGenerationError("IMAGE_CREDITS_EXHAUSTED")
                raise ImageGenerationError("IMAGE_PROVIDER_FAILED")
            data = response.json()
            if data.get("results"):
                return data["results"][0]["url"]
            task_id = data.get("id")
            if not task_id:
                raise ImageGenerationError("IMAGE_TASK_MISSING")
            for _ in range(24):
                await asyncio.sleep(2.5)
                result = await client.get(f"{base}/v1/api/result", params={"id": task_id}, headers=headers)
                if result.status_code >= 400:
                    continue
                status = result.json()
                if status.get("results"):
                    return status["results"][0]["url"]
                if status.get("status") == "failed":
                    raise ImageGenerationError("IMAGE_PROVIDER_FAILED")
        raise ImageGenerationError("IMAGE_TASK_TIMEOUT")


image_client = ImageClient()

