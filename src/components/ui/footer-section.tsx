"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Send, Mail, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SocialLink } from "@/data/socials";
import SocialMark from "@/components/ui/social-mark";

export type FooterLink = { label: string; href: string };

type Props = {
  logo: string;
  companyName: string;
  about: string;
  /** заголовки колонок */
  titles: { company: string; contacts: string; social: string; subscribe: string };
  subscribe: { text: string; placeholder: string; done: string; error: string };
  links: FooterLink[];
  address: string;
  phones: string[];
  email: string;
  socials: SocialLink[];
  copyright: string;
  className?: string;
};

/** Светлый подвал: колонка о компании с быстрой заявкой, ссылки, контакты, соцсети. */
export default function FooterSection({
  logo,
  companyName,
  about,
  titles,
  subscribe,
  links,
  address,
  phones,
  email,
  socials,
  copyright,
  className,
}: Props) {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const socialLinks = socials.filter((item) => item.url?.trim());

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!phone.trim()) return;
    setState("sending");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName ? "Заявка из подвала" : "Заявка",
          phone,
          message: "",
          source: "footer",
          page: window.location.pathname,
          locale: document.documentElement.lang || "ru",
        }),
      });
      if (!res.ok) throw new Error("failed");
      setState("sent");
      setPhone("");
    } catch {
      setState("error");
    }
  }

  return (
    <footer
      id="contacts"
      className={cn("relative border-t border-slate-200 bg-white text-graphite", className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-10 hidden size-64 rounded-full bg-navy/10 blur-[120px] lg:block"
      />

      <div className="mx-auto max-w-[1200px] px-5 py-14 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* о компании + быстрая заявка */}
          <div>
            <Image
              src={logo}
              alt={companyName}
              width={200}
              height={36}
              className="site-logo h-8 w-auto object-contain"
            />
            <p className="mt-5 text-[14px] font-light leading-[24px] text-slate-500">{about}</p>

            <p className="mt-6 text-[13px] font-semibold text-navy">{titles.subscribe}</p>
            <p className="mt-1 text-[13px] text-slate-500">{subscribe.text}</p>

            <form onSubmit={send} className="relative mt-3">
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (state !== "idle") setState("idle");
                }}
                placeholder={subscribe.placeholder}
                className="h-11 w-full rounded-full border border-slate-200 bg-white pl-4 pr-12 text-[14px] outline-none transition-colors placeholder:text-slate-400 focus:border-navy"
              />
              <button
                type="submit"
                disabled={state === "sending"}
                aria-label={subscribe.text}
                className="absolute right-1 top-1 flex size-9 items-center justify-center rounded-full bg-navy text-white transition hover:scale-105 disabled:opacity-60"
              >
                <Send className="size-4" />
              </button>
            </form>

            {state === "sent" && (
              <p className="mt-2 text-[13px] font-semibold text-navy">{subscribe.done}</p>
            )}
            {state === "error" && <p className="mt-2 text-[13px] text-red-600">{subscribe.error}</p>}
          </div>

          {/* ссылки */}
          <div>
            <h3 className="text-[15px] font-bold uppercase tracking-[1px] text-navy">
              {titles.company}
            </h3>
            <nav className="mt-4 space-y-2.5 text-[14px]">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-slate-600 transition-colors hover:text-navy"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* контакты */}
          <div>
            <h3 className="text-[15px] font-bold uppercase tracking-[1px] text-navy">
              {titles.contacts}
            </h3>
            <ul className="mt-4 space-y-3 text-[14px] not-italic">
              <li className="flex gap-2.5 text-slate-600">
                <MapPin className="mt-0.5 size-4 shrink-0 text-navy/60" />
                <span>{address}</span>
              </li>
              {phones.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Phone className="mt-0.5 size-4 shrink-0 text-navy/60" />
                  <a
                    href={`tel:${item.replace(/[^+\d]/g, "")}`}
                    className="font-semibold text-navy transition-colors hover:text-gold"
                  >
                    {item}
                  </a>
                </li>
              ))}
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-navy/60" />
                <a
                  href={`mailto:${email}`}
                  className="text-slate-600 transition-colors hover:text-navy"
                >
                  {email}
                </a>
              </li>
            </ul>
          </div>

          {/* соцсети */}
          <div>
            <h3 className="text-[15px] font-bold uppercase tracking-[1px] text-navy">
              {titles.social}
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {socialLinks.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  title={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-[13px] font-semibold text-navy transition hover:-translate-y-0.5 hover:border-navy hover:bg-navy hover:text-white"
                >
                  <SocialMark social={item} className="size-4" />
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-7 text-center md:flex-row md:text-left">
          <p className="text-[13px] text-slate-500">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
