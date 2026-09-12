"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { locales, localeNames, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { openContactModal } from "@/components/ContactModal";
import ThemeToggle from "@/components/ui/theme-toggle";
import GlowButton from "@/components/ui/glow-button";

type Props = { locale: Locale; dict: Dictionary; logo: string };

/** Плавающая «капсула» сверху: появляется при загрузке, прячется при скролле вниз. */
export default function Header({ locale, dict, logo }: Props) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const lastY = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    lastY.current = window.scrollY;
    const appear = window.setTimeout(() => setMounted(true), 80);

    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);

      if (y < 90) {
        setHidden(false);
      } else if (y > lastY.current + 8) {
        setHidden(true);
        setOpen(false);
      } else if (y < lastY.current - 8) {
        setHidden(false);
      }
      lastY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(appear);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // «Проекты» и «Партнёры» временно убраны из меню — страницы остались доступны
  // по прямым ссылкам, вернём пункты после съёмки объектов в Ташкенте
  const links = [
    { href: "", label: dict.nav.home },
    { href: "/about", label: dict.nav.about },
    { href: "/services", label: dict.nav.services },
    { href: "#materials", label: dict.nav.materials },
    { href: "/contacts", label: dict.nav.contacts },
  ].map((link) => ({ ...link, url: `/${locale}${link.href}` }));

  // Путь без префикса локали — чтобы переключатель языка оставался на той же странице
  const rest = pathname.replace(/^\/[a-z]{2}/, "");

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-5 sm:pt-4",
        !mounted || hidden ? "-translate-y-[160%]" : "translate-y-0"
      )}
    >
      <div className="mx-auto max-w-[1200px]">
        <div
          className={cn(
            "flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/90 px-4 py-2.5 backdrop-blur-xl transition-shadow duration-300 sm:gap-3 sm:px-6",
            scrolled
              ? "shadow-[0_20px_45px_-26px_rgba(8,19,36,0.6)]"
              : "shadow-[0_12px_32px_-24px_rgba(8,19,36,0.45)]"
          )}
        >
          {/* логотип может быть широким — на узком экране ограничиваем, иначе он
              выдавливает кнопку меню за край */}
          <Link href={`/${locale}`} className="min-w-0 shrink">
            <Image
              src={logo}
              alt="Smart Facade"
              width={220}
              height={40}
              className="site-logo h-[24px] w-auto max-w-[46vw] object-contain object-left sm:h-[28px] sm:max-w-none md:h-[32px]"
              priority
            />
          </Link>

          <nav className="mx-auto hidden lg:block">
            <ul className="flex items-center gap-1">
              {links.map((link) => {
                const active = pathname === link.url;
                return (
                  <li key={link.url}>
                    <Link
                      href={link.url}
                      className={cn(
                        "block rounded-full px-4 py-2 text-[14px] transition-colors",
                        active ? "font-semibold text-navy" : "text-slate-600 hover:text-navy"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* на телефоне языки переехали внутрь меню — в узкой шапке им нет места */}
          <div className="ml-auto hidden items-center gap-1 sm:flex lg:ml-0">
            {locales.map((code) => (
              <Link
                key={code}
                href={`/${code}${rest}`}
                className={cn(
                  "px-1.5 py-1 text-[12px] font-semibold uppercase transition-colors",
                  code === locale ? "text-navy" : "text-slate-400 hover:text-navy"
                )}
              >
                {localeNames[code]}
              </Link>
            ))}
          </div>

          <ThemeToggle className="ml-auto shrink-0 sm:ml-0" />

          <GlowButton
            onClick={openContactModal}
            radius={62}
            className="hidden shrink-0 items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 sm:inline-flex"
            glowClassName="[--glow-color:rgba(197,164,126,0.85)]"
          >
            <MessageCircle className="size-4" strokeWidth={1.8} />
            {dict.nav.contactButton}
          </GlowButton>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-[5px] lg:hidden"
          >
            <span
              className={cn(
                "h-[2px] w-5 bg-navy transition-transform",
                open && "translate-y-[7px] rotate-45"
              )}
            />
            <span className={cn("h-[2px] w-5 bg-navy transition-opacity", open && "opacity-0")} />
            <span
              className={cn(
                "h-[2px] w-5 bg-navy transition-transform",
                open && "-translate-y-[7px] -rotate-45"
              )}
            />
          </button>
        </div>

        {open && (
          <nav className="mt-2 rounded-3xl border border-black/[0.06] bg-white/95 p-2 shadow-[0_20px_45px_-26px_rgba(8,19,36,0.6)] backdrop-blur-xl lg:hidden">
            <ul>
              {links.map((link) => (
                <li key={link.url}>
                  <Link
                    href={link.url}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-2xl px-4 py-3 text-[15px] transition-colors hover:bg-mist",
                      pathname === link.url ? "font-semibold text-navy" : "text-slate-600"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    openContactModal();
                  }}
                  className="mt-1 block w-full rounded-2xl bg-ink px-4 py-3 text-left text-[15px] font-semibold text-white"
                >
                  {dict.nav.contactButton}
                </button>
              </li>

              {/* языки: в узкой шапке для них нет места, поэтому они здесь */}
              <li className="mt-2 flex items-center gap-2 border-t border-black/[0.06] px-2 pt-3 sm:hidden">
                {locales.map((code) => (
                  <Link
                    key={code}
                    href={`/${code}${rest}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[13px] font-semibold uppercase transition-colors",
                      code === locale ? "bg-navy text-white" : "bg-mist text-slate-600"
                    )}
                  >
                    {localeNames[code]}
                  </Link>
                ))}
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
