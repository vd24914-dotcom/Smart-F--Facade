import Link from "next/link";
import "../globals.css";
import { isAuthenticated } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";
import ForceLight from "@/components/admin/ForceLight";
import ReadOnlyBanner from "@/components/admin/ReadOnlyBanner";

export const metadata = { title: "Админка — Smart Facade" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthenticated();

  if (!authed)
    return (
      <div className="min-h-screen bg-slate-100">
        <ForceLight />
        {children}
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <ForceLight />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-6 py-3">
          <Link href="/admin" className="text-[15px] font-extrabold uppercase tracking-[1px]">
            Smart Facade · админка
          </Link>
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <ReadOnlyBanner />
        {children}
      </main>
    </div>
  );
}
