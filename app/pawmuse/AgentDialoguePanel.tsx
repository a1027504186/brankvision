"use client";

import { Image as ImageIcon, Palette, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AgentSession } from "@/lib/agent/types";
import type { BrandType } from "./types";
import { SpectrumLogo } from "./SpectrumLogo";

type AgentResponse = { session: AgentSession; options: string[]; error?: string };

export function AgentDialoguePanel({ brandType, initialCategory, onSessionChange }: {
  brandType: BrandType;
  initialCategory: string;
  onSessionChange: (session: AgentSession) => void;
}) {
  const [session, setSession] = useState<AgentSession | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [working, setWorking] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onSessionChange);

  useEffect(() => {
    callbackRef.current = onSessionChange;
  }, [onSessionChange]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/agent/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandType, category: initialCategory }),
        });
        const data = await response.json() as AgentResponse;
        if (!response.ok) throw new Error(data.error || "智能体启动失败");
        if (active) {
          setSession(data.session);
          setOptions(data.options || []);
          callbackRef.current(data.session);
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "智能体启动失败");
      } finally {
        if (active) setWorking(false);
      }
    })();
    return () => { active = false; };
  }, [brandType, initialCategory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages.length, working]);

  const send = async (preset?: string) => {
    const message = (preset ?? input).trim();
    if (!message || !session || working) return;
    setInput("");
    const optimisticMessage = {
      id: `pending-${crypto.randomUUID()}`,
      role: "user" as const,
      content: message,
      createdAt: new Date().toISOString(),
    };
    setSession((current) => current ? { ...current, messages: [...current.messages, optimisticMessage] } : current);
    setWorking(true);
    setError("");
    try {
      const response = await fetch("/api/agent/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, message }),
      });
      const data = await response.json() as AgentResponse;
      if (!response.ok) throw new Error(data.error || "智能体暂时没有完成这一步");
      setSession(data.session);
      setOptions(data.options || []);
      callbackRef.current(data.session);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "智能体暂时没有完成这一步");
    } finally {
      setWorking(false);
    }
  };

  return (
    <section className="flex h-full w-full min-w-0 flex-col border-r border-[var(--border)] bg-[var(--panel)] px-12 pb-8 pt-10">
      <div className="mb-7 flex items-center justify-between">
        <SpectrumLogo compact />
        <span className="flex items-center gap-1.5 rounded-full border border-[#F3DDD6] bg-[#FFF6F3] px-3 py-1.5 text-[9px] font-semibold text-[var(--brand)]"><span className={`size-1.5 rounded-full ${working ? "animate-pulse bg-[var(--brand)]" : "bg-[#71A47A]"}`} />{working ? "智能体工作中" : "智能体已连接"}</span>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {session?.messages.filter((message) => message.role !== "tool").map((message) => {
          const time = new Date(message.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
          return <div key={message.id} className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
            <div className={`max-w-[94%] whitespace-pre-line rounded-2xl px-4 py-3 text-[12px] leading-[1.75] shadow-[0_2px_7px_#2C1C1808] ${message.role === "user" ? "rounded-br-md bg-[#F2E7DF] text-[var(--ink)]" : "rounded-bl-md border border-[var(--border)] bg-white text-[var(--secondary)]"}`}>
              {message.content}
              {message.attachment === "brand" && <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#F7F5F2] p-3"><div className="grid size-9 place-items-center rounded-lg bg-[#FFF0E8] text-[var(--brand)]"><Palette size={16} /></div><div><div className="text-[11px] font-bold text-[var(--ink)]">品牌视觉体系</div><div className="mt-0.5 text-[9px] text-[var(--muted)]">色彩 · 字体 · Logo</div></div></div>}
              {message.attachment === "poster" && <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#F7F5F2] p-3"><div className="grid size-9 place-items-center rounded-lg bg-[#FFF0E8] text-[var(--brand)]"><ImageIcon size={16} /></div><div><div className="text-[11px] font-bold text-[var(--ink)]">物料生成完成</div><div className="mt-0.5 text-[9px] text-[var(--muted)]">已同步到资产与平台预览</div></div></div>}
              {message.imageUrl && <img src={message.imageUrl} alt="智能体生成的品牌物料" className="mt-3 max-h-56 w-full rounded-xl bg-[#F4F1ED] object-contain" />}
            </div>
            <span className="mt-1.5 px-1 text-[9px] text-[#B3ACA8]">{time}</span>
          </div>;
        })}
        {working && session && <div className="w-fit rounded-2xl rounded-bl-md border border-[var(--border)] bg-white px-4 py-3 text-[11px] text-[var(--muted)]"><span className="animate-pulse">正在识别意图并选择执行路径…</span></div>}
        {error && <div className="w-fit max-w-[94%] rounded-2xl border border-[#F0C9BE] bg-[#FFF6F3] px-4 py-3 text-[11px] text-[var(--brand)]">{error}</div>}
        {!working && options.length > 0 && <div className="flex flex-wrap gap-2">
          {options.map((option) => <button key={option} type="button" onClick={() => void send(option)} className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-[10px] leading-[1.75] text-[var(--secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]">{option}</button>)}
        </div>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="mt-5 flex h-12 shrink-0 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 shadow-[0_2px_8px_#2C1C1810]">
        <input value={input} onChange={(event) => setInput(event.target.value)} disabled={working || !session} placeholder={working ? "智能体正在处理…" : "在此输入回复（随时可输入）…"} className="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--ink)] outline-none placeholder:text-[#B9B2AE] disabled:opacity-60" />
        <button type="submit" disabled={working || !session || !input.trim()} aria-label="发送" className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-white transition hover:bg-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-35"><Send size={15} /></button>
      </form>
    </section>
  );
}
