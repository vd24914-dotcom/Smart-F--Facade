"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { SiteContent } from "@/content/store";

export const CONTACT_MODAL_EVENT = "smartfacade:open-contact";

/** Открыть модалку из любого места: openContactModal() */
export function openContactModal() {
  window.dispatchEvent(new CustomEvent(CONTACT_MODAL_EVENT));
}

export default function ContactModal({ dict, site }: { dict: Dictionary; site: SiteContent }) {
  const t = dict.pages.contacts;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "", company: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    const onOpen = () => {
      setState("idle");
      setOpen(true);
    };
    window.addEventListener(CONTACT_MODAL_EVENT, onOpen);
    return () => window.removeEventListener(CONTACT_MODAL_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setState("sending");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source: "modal",
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
  };

  const field =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-graphite outline-none transition-colors placeholder:text-slate-400 focus:border-navy";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t.formTitle}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => setOpen(false)}
        className="modal-backdrop absolute inset-0 cursor-default bg-ink/70 backdrop-blur-sm"
      />

      <div className="modal-card relative max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_40px_90px_-40px_rgba(8,19,36,0.75)] sm:p-8">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-mist hover:text-navy"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <h2 className="pr-10 text-[22px] font-extrabold uppercase leading-[1.2] text-navy sm:text-[26px]">
          {t.formTitle}
        </h2>
        <div className="mt-4 h-[3px] w-20 rounded-full bg-gradient-to-r from-gold to-gold/10" />

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            required
            autoFocus
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
            rows={3}
            className={field}
            placeholder={t.message}
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
            className="flex w-full items-center justify-center gap-2.5 rounded-full bg-navy px-6 py-4 text-[14px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            <Send className="size-4" strokeWidth={1.8} />
            {state === "sending" ? "…" : state === "sent" ? "✓" : t.submit}
          </button>

          {state === "sent" && (
            <p className="text-center text-[14px] font-semibold text-navy">
              Спасибо! Мы свяжемся с вами.
            </p>
          )}
          {state === "error" && (
            <p className="text-center text-[13px] text-red-600">
              Не удалось отправить. Позвоните нам или напишите в WhatsApp.
            </p>
          )}
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-[12px] font-semibold uppercase tracking-[2px] text-slate-400">
            {dict.hero.phonesLabel}
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
            {site.phones.map((phone) => (
              <li key={phone}>
                <a
                  href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                  className="text-[17px] font-semibold text-navy transition-colors hover:text-gold"
                >
                  {phone}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={site.social.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-whatsapp px-5 py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              {dict.hero.whatsapp}
            </a>
            <a
              href={site.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-5 py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundImage: "linear-gradient(28.9deg, #e83b68 20%, #f2c141 94%)" }}
            >
              {dict.hero.instagram}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="rounded-full border border-slate-200 px-5 py-3 text-[13px] font-semibold text-navy transition-colors hover:border-navy"
            >
              {site.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
