"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import AdminNav from "./AdminNav";

/** Куда страницы подмешивают свои инструменты: язык, разделы, сохранение. */
export const RAIL_TARGET_ID = "admin-rail-page";

/**
 * Оболочка админки: тонкая шапка, слева колонка с разделами, справа содержимое
 * и инструментами открытой страницы. На узких экранах колонка превращается
 * в строку разделов над содержимым.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f3f5f8] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-navy text-[13px] font-extrabold text-white">
              SF
            </span>
            <span className="text-[15px] font-extrabold tracking-[0.5px]">Smart Facade</span>
            <span className="hidden rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[1px] text-slate-500 sm:inline">
              админка
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1">
            <a
              href="/ru"
              target="_blank"
              rel="noreferrer"
              className="hidden min-h-[40px] items-center rounded-xl px-3 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
            >
              Открыть сайт ↗
            </a>
            <button
              type="button"
              onClick={logout}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="size-4" strokeWidth={1.8} aria-hidden />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-8 xl:py-8">
        {/* на узких экранах разделы идут строкой над содержимым */}
        <div className="min-w-0 xl:hidden">
          <AdminNav variant="chips" />
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-[72px] space-y-4">
            {/* сюда страница подмешивает свои инструменты — они выше списка разделов */}
            <div id={RAIL_TARGET_ID} />
            <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
              <AdminNav variant="rail" />
            </div>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
