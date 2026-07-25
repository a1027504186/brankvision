import io
import re
from pathlib import Path

from docx import Document
from pypdf import PdfReader


def parse_document(filename: str, content_type: str, data: bytes) -> str:
    suffix = Path(filename).suffix.lower()
    if content_type == "application/pdf" or suffix == ".pdf":
        reader = PdfReader(io.BytesIO(data))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    elif content_type.endswith("wordprocessingml.document") or suffix == ".docx":
        document = Document(io.BytesIO(data))
        text = "\n".join(paragraph.text for paragraph in document.paragraphs)
    elif suffix in {".md", ".markdown", ".txt"} or content_type.startswith("text/"):
        text = data.decode("utf-8", errors="replace")
    else:
        raise ValueError("UNSUPPORTED_DOCUMENT_TYPE")
    text = re.sub(r"\r\n?", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_text(text: str, chunk_size: int = 700, overlap: int = 120) -> list[str]:
    if not text:
        return []
    paragraphs = [item.strip() for item in re.split(r"\n\s*\n", text) if item.strip()]
    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        if len(current) + len(paragraph) + 1 <= chunk_size:
            current = f"{current}\n{paragraph}".strip()
            continue
        if current:
            chunks.append(current)
        tail = current[-overlap:] if current and overlap else ""
        current = f"{tail}\n{paragraph}".strip()
        while len(current) > chunk_size:
            chunks.append(current[:chunk_size])
            current = current[chunk_size - overlap :]
    if current:
        chunks.append(current)
    return chunks

