import { redirect } from "next/navigation";
import { isAuthenticated, adminIsLocked } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // на боевом сервере без своего пароля вход закрыт — иначе админку откроет кто угодно
  if (adminIsLocked()) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="max-w-[460px] rounded-2xl border border-slate-200 bg-white p-6">
          <h1 className="text-[18px] font-extrabold text-slate-900">Админка выключена</h1>
          <p className="mt-2 text-[14px] leading-[22px] text-slate-600">
            Чтобы включить её на этом сервере, задайте в настройках проекта переменную{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[13px]">
              ADMIN_PASSWORD
            </code>{" "}
            со своим паролем и перезапустите сайт.
          </p>
          <p className="mt-3 text-[13px] text-slate-500">
            На своём компьютере админка работает как обычно.
          </p>
        </div>
      </div>
    );
  }

  if (await isAuthenticated()) redirect("/admin");
  return <LoginForm />;
}
