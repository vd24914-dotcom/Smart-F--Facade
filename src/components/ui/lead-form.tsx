"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Labels = {
  title: string;
  name: string;
  phone: string;
  message: string;
  submit: string;
  done: string;
  error: string;
};

/** Форма заявки: имя, телефон, комментарий. Отправляет в раздел «Заявки» админки. */
export default function LeadForm({
  labels,
  source = "cta",
  className,
}: {
  labels: Labels;
  source?: string;
  className?: string;
}) {
  const [form, setForm] = useState({ name: "", phone: "", message: "", company: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source,
          page: window.location.pathname,
          locale: document.documentElement.lang || "ru",
        }),
      });
      if (!res.ok) throw new Error("failed");
      setState("sent");
      setForm({ name: "", phone: "", message: "", company: "" });
    } catch {
      setState("error");
    }
  }

  const field =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-graphite outline-none transition-colors placeholder:text-slate-400 focus:border-navy";

  return (
    <form
      onSubmit={submit}
      className={cn(
        "rounded-2xl bg-white/95 p-6 shadow-[0_35px_80px_-45px_rgba(8,19,36,0.8)] backdrop-blur sm:p-8",
        className
      )}
    >
      <h3 className="text-[20px] font-extrabold uppercase leading-[1.2] text-navy">{labels.title}</h3>
      <div className="mt-4 h-[3px] w-20 rounded-full bg-gradient-to-r from-gold to-gold/10" />

      <div className="mt-6 space-y-3">
        <input
          required
          className={field}
          placeholder={labels.name}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          required
          type="tel"
          className={field}
          placeholder={labels.phone}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <textarea
          rows={3}
          className={field}
          placeholder={labels.message}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />

        {/* ловушка для ботов */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
        />

        <button
          type="submit"
          disabled={state === "sending" || state === "sent"}
          className="w-full rounded-full bg-navy px-6 py-4 text-[14px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {state === "sending" ? "Отправляем…" : state === "sent" ? "✓" : labels.submit}
        </button>

        {state === "sent" && (
          <p className="text-center text-[14px] font-semibold text-navy">{labels.done}</p>
        )}
        {state === "error" && <p className="text-center text-[13px] text-red-600">{labels.error}</p>}
      </div>
    </form>
  );
}
