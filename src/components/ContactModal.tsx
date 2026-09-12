"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import CalcForm from "@/components/ui/calc-form";
import type { Dictionary } from "@/i18n/dictionaries";
import type { SiteContent } from "@/content/store";
import { findSocial } from "@/data/socials";

export const CONTACT_MODAL_EVENT = "smartfacade:open-contact";

/** Открыть модалку из любого места: openContactModal() */
export function openContactModal() {
  window.dispatchEvent(new CustomEvent(CONTACT_MODAL_EVENT));
}

export default function ContactModal({ dict, site }: { dict: Dictionary; site: SiteContent }) {
  const t = dict.calc;
  const [open, setOpen] = useState(false);

  // быстрые кнопки — ищем нужные соцсети в общем списке
  const whatsapp = findSocial(site.socials, "whatsapp", "wa.me");
  const telegram = findSocial(site.socials, "telegram", "t.me");
  const instagram = findSocial(site.socials, "instagram");

  useEffect(() => {
    const onOpen = () => setOpen(true);
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t.button}
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

        <h2 className="pr-10 text-[18px] font-extrabold leading-[1.3] text-navy sm:text-[20px]">
          {t.title}
        </h2>
        <div className="mt-4 h-[3px] w-20 rounded-full bg-gradient-to-r from-gold to-gold/10" />
        {t.lead?.trim() && (
          <p className="mt-4 text-[14px] font-light leading-[22px] text-graphite">{t.lead}</p>
        )}

        <CalcForm
          dict={dict}
          source="modal"
          showTitle={false}
          className="mt-2 bg-transparent p-0 shadow-none sm:p-0"
        />

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
            {telegram && (
              <a
                href={telegram.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#2AABEE] px-5 py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Send className="size-4" strokeWidth={1.8} />
                Telegram
              </a>
            )}
            {whatsapp && (
              <a
                href={whatsapp.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-whatsapp px-5 py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                {dict.hero.whatsapp}
              </a>
            )}
            {instagram && (
              <a
                href={instagram.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full px-5 py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundImage: "linear-gradient(28.9deg, #e83b68 20%, #f2c141 94%)" }}
              >
                {dict.hero.instagram}
              </a>
            )}
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
