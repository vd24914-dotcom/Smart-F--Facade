"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { isActivePath, navGroups } from "./nav-data";

/**
 * Навигация по админке.
 * `rail` — вертикальный список в правой колонке на широких экранах,
 * `chips` — одна прокручиваемая строка на телефоне и планшете.
 */
export default function AdminNav({ variant = "rail" }: { variant?: "rail" | "chips" }) {
  const pathname = usePathname();

  if (variant === "chips") {
    return (
      <nav aria-label="Разделы" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
        <ul className="flex w-max gap-1.5">
          {navGroups.flatMap((group) => group.items).map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-[40px] items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition",
                    active
                      ? "border-navy bg-navy text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  )}
                >
                  <item.icon className="size-4" strokeWidth={1.8} aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Разделы" className="space-y-5">
      {navGroups.map((group) => (
        <div key={group.title}>
          <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[1.5px] text-slate-400">{group.title}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-[40px] items-center gap-2.5 rounded-xl px-3 text-[14px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40",
                      active ? "bg-navy text-white" : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <item.icon className="size-[18px] shrink-0" strokeWidth={1.8} aria-hidden />
                    {item.label}
                    {active && <BadgeCheck className="ml-auto size-4 opacity-70" strokeWidth={2} aria-hidden />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="border-t border-slate-200 pt-4">
        <a
          href="/ru"
          target="_blank"
          rel="noreferrer"
          className="flex min-h-[40px] items-center gap-2.5 rounded-xl px-3 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <Globe className="size-[18px]" strokeWidth={1.8} aria-hidden />
          Открыть сайт
        </a>
      </div>
    </nav>
  );
}
