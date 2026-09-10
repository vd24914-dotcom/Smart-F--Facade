"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";

export default function ContactForm({ dict }: { dict: Dictionary; email?: string }) {
  const t = dict.pages.contacts;
  const [form, setForm] = useState({ name: "", phone: "", message: "", company: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source: "contacts",
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
    "w-full border border-hairline/40 bg-white px-4 py-3 text-[16px] text-graphite outline-none transition-colors focus:border-gold";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-[24px] font-extrabold uppercase leading-[1.25] text-black-soft">{t.formTitle}</h2>
      <div className="rule-gold" />

      <input
        required
        className={field}
        placeholder={t.name}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        required
        type="tel"
        className={field}
        placeholder={t.phone}
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <textarea
        rows={4}
        className={field}
        placeholder={t.message}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
      />

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
        className="inline-flex items-center gap-2.5 rounded-full bg-navy px-6 py-3.5 text-[14px] font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
      >
        <Send className="size-4" strokeWidth={1.8} />
        {state === "sending" ? "…" : state === "sent" ? "✓" : t.submit}
      </button>

      {state === "sent" && (
        <p className="text-[14px] font-semibold text-navy">Спасибо! Мы свяжемся с вами.</p>
      )}
      {state === "error" && (
        <p className="text-[13px] text-red-600">Не удалось отправить. Позвоните нам или напишите в WhatsApp.</p>
      )}
    </form>
  );
}
