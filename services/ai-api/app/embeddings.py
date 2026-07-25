import hashlib
import math
import re
from collections import Counter

import httpx

from .config import get_settings


def _tokens(text: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", text.lower()).strip()
    words = re.findall(r"[a-z0-9]+", normalized)
    chinese = re.findall(r"[\u4e00-\u9fff]", normalized)
    return words + chinese + ["".join(chinese[index : index + 2]) for index in range(len(chinese) - 1)]


def _normalize(vector: list[float]) -> list[float]:
    norm = math.sqrt(sum(value * value for value in vector)) or 1.0
    return [value / norm for value in vector]


class EmbeddingService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if self.settings.embedding_base_url and self.settings.embedding_api_key:
            async with httpx.AsyncClient(timeout=45) as client:
                response = await client.post(
                    f"{self.settings.embedding_base_url.rstrip('/')}/embeddings",
                    headers={"Authorization": f"Bearer {self.settings.embedding_api_key}"},
                    json={"model": self.settings.embedding_model, "input": texts},
                )
                response.raise_for_status()
                data = response.json()["data"]
                return [item["embedding"] for item in sorted(data, key=lambda item: item["index"])]
        return [self._hash_embedding(text) for text in texts]

    def _hash_embedding(self, text: str) -> list[float]:
        dimensions = self.settings.embedding_dimensions
        vector = [0.0] * dimensions
        counts = Counter(_tokens(text))
        for token, count in counts.items():
            digest = hashlib.blake2b(token.encode("utf-8"), digest_size=16).digest()
            index = int.from_bytes(digest[:8], "big") % dimensions
            sign = 1.0 if digest[8] % 2 == 0 else -1.0
            vector[index] += sign * (1.0 + math.log(count))
        return _normalize(vector)


embedding_service = EmbeddingService()


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or len(left) != len(right):
        return 0.0
    return sum(a * b for a, b in zip(left, right, strict=True))

