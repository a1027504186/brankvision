"use client";

import { BookOpen, FileText, LoaderCircle, Search, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type KnowledgeDocument = {
  id: string;
  title: string;
  source_name: string;
  status: string;
  chunks: number;
  created_at: string;
};

type Citation = {
  chunk_id: string;
  title: string;
  source_name: string;
  excerpt: string;
  score: number;
};

export function KnowledgePanel({ brandId, onClose }: { brandId?: string; onClose: () => void }) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [query, setQuery] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    const suffix = brandId ? `?brandId=${encodeURIComponent(brandId)}` : "";
    const response = await fetch(`/api/knowledge${suffix}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "知识库暂时不可用");
    setDocuments(data);
  }, [brandId]);

  useEffect(() => {
    loadDocuments().catch((error) => setMessage(error instanceof Error ? error.message : "知识库暂时不可用"));
  }, [loadDocuments]);

  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setMessage("");
    const form = new FormData();
    form.append("file", file);
    form.append("title", file.name.replace(/\.[^.]+$/, ""));
    if (brandId) form.append("brand_id", brandId);
    try {
      const response = await fetch("/api/knowledge", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.detail || "文档解析失败");
      setMessage(`已完成解析：${data.chunks} 个知识片段`);
      await loadDocuments();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "文档上传失败");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const search = async () => {
    if (!query.trim() || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/knowledge/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), brand_id: brandId || null, top_k: 4 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.detail || "检索失败");
      setAnswer(data.answer_context || "");
      setCitations(data.citations || []);
      if (!(data.citations || []).length) setMessage("没有找到相关品牌依据，可以先上传品牌手册或内容资料。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "检索失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-[15px] font-extrabold text-[var(--ink)]"><BookOpen size={19} />品牌知识库</div>
          <p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">上传品牌手册、产品资料和内容规范，智能体生成前会自动检索引用。</p>
        </div>
        <button type="button" onClick={onClose} aria-label="返回品牌资产" className="grid size-7 place-items-center rounded-full border border-[var(--border)] bg-white text-[var(--secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)]"><X size={13} /></button>
      </div>

      <input ref={fileRef} type="file" accept=".pdf,.docx,.md,.markdown,.txt" className="hidden" onChange={(event) => void upload(event.target.files?.[0])} />
      <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#D8CEC7] bg-white px-4 py-5 text-[11px] font-semibold text-[var(--secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:opacity-50">
        {busy ? <LoaderCircle size={15} className="animate-spin" /> : <Upload size={15} />}
        上传 PDF、DOCX、Markdown 或 TXT
      </button>

      {message && <div className="rounded-xl bg-[#FFF6F3] px-3 py-2.5 text-[9px] leading-4 text-[var(--brand)]">{message}</div>}

      <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_2px_5px_#2C1C1808]">
        <div className="text-[11px] font-bold text-[var(--ink)]">已收录资料</div>
        <div className="mt-3 space-y-2">
          {documents.length ? documents.map((document) => (
            <div key={document.id} className="flex items-center gap-3 rounded-xl bg-[#F8F7F5] p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[var(--brand)]"><FileText size={15} /></span>
              <span className="min-w-0 flex-1"><b className="block truncate text-[10px] text-[var(--ink)]">{document.title}</b><span className="mt-1 block text-[8px] text-[var(--muted)]">{document.chunks} 个片段 · {document.status === "ready" ? "可检索" : document.status}</span></span>
            </div>
          )) : <div className="grid h-16 place-items-center rounded-xl bg-[#F8F7F5] text-[9px] text-[var(--muted)]">还没有上传品牌资料</div>}
        </div>
      </article>

      <article className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_2px_5px_#2C1C1808]">
        <div className="text-[11px] font-bold text-[var(--ink)]">验证检索依据</div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[#FAF9F7] px-3">
          <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void search()} placeholder="例如：Logo 可以变形吗？" className="h-10 min-w-0 flex-1 bg-transparent text-[10px] outline-none placeholder:text-[#B9B2AE]" />
          <button type="button" disabled={busy || !query.trim()} onClick={() => void search()} aria-label="检索知识库" className="grid size-7 place-items-center rounded-full bg-[var(--ink)] text-white disabled:opacity-30"><Search size={13} /></button>
        </div>
        {answer && <p className="mt-3 max-h-24 overflow-y-auto whitespace-pre-line rounded-xl bg-[#F8F7F5] p-3 text-[9px] leading-4 text-[var(--secondary)]">{answer}</p>}
        {citations.length > 0 && <div className="mt-3 space-y-2">{citations.map((citation, index) => (
          <div key={citation.chunk_id} className="rounded-xl border border-[var(--border)] p-3">
            <div className="flex items-center justify-between text-[9px]"><b className="truncate text-[var(--ink)]">[{index + 1}] {citation.title}</b><span className="text-[var(--muted)]">{Math.round(citation.score * 100)}%</span></div>
            <p className="mt-1.5 line-clamp-3 text-[8px] leading-4 text-[var(--muted)]">{citation.excerpt}</p>
          </div>
        ))}</div>}
      </article>
    </div>
  );
}
