"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/leads", label: "Заявки" },
  { href: "/admin/general", label: "Общее", group: true },
  { href: "/admin/home", label: "Главная" },
  { href: "/admin/about", label: "О нас" },
  { href: "/admin/services", label: "Услуги" },
  { href: "/admin/projects", label: "Проекты" },
  { href: "/admin/partners", label: "Партнёры" },
  { href: "/admin/beforeafter", label: "До / После" },
  { href: "/admin/contacts", label: "Контакты" },
  { href: "/admin/seo", label: "SEO", group: true },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      <nav className="flex flex-wrap items-center gap-1">
        {links.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <div key={link.href} className="flex items-center">
              {link.group && <span aria-hidden className="mx-2 h-5 w-px bg-slate-200" />}
              <Link
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <a
          href="/ru"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:border-slate-500"
        >
          Открыть сайт ↗
        </a>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-slate-500 transition hover:text-slate-900"
        >
          Выйти
        </button>
      </div>
    </>
  );
}
