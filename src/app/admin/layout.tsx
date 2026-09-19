import "../globals.css";
import { isAuthenticated } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";
import ForceLight from "@/components/admin/ForceLight";
import ReadOnlyBanner from "@/components/admin/ReadOnlyBanner";

export const metadata = { title: "Админка — Smart Facade" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthenticated();

  if (!authed)
    return (
      <div className="min-h-screen bg-[#f3f5f8]">
        <ForceLight />
        {children}
      </div>
    );

  return (
    <>
      <ForceLight />
      <AdminShell>
        <ReadOnlyBanner />
        {children}
      </AdminShell>
    </>
  );
}
