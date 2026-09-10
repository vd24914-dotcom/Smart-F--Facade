import { redirect } from "next/navigation";
import { isAuthenticated, adminLockReason } from "@/lib/auth";
import { cloudEnabled } from "@/content/storage";
import LoginForm from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[13px]">{children}</code>
  );
}

export default async function LoginPage() {
  // на боевом сервере без своего пароля вход закрыт — иначе админку откроет кто угодно
  const lock = adminLockReason();

  if (lock !== "none") {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="max-w-[520px] rounded-2xl border border-slate-200 bg-white p-6">
          <h1 className="text-[18px] font-extrabold text-slate-900">Админка выключена</h1>

          {lock === "default-password" ? (
            <>
              <p className="mt-2 text-[14px] leading-[22px] text-slate-600">
                Переменная <Code>ADMIN_PASSWORD</Code> задана, но в ней стоит пароль по умолчанию —
                он записан в исходниках, а репозиторий открыт, то есть его видит кто угодно.
              </p>
              <p className="mt-2 text-[14px] leading-[22px] text-slate-600">
                Впишите в <Code>ADMIN_PASSWORD</Code> любой другой пароль и перезапустите сайт
                (Deployments → «…» → Redeploy).
              </p>
            </>
          ) : (
            <p className="mt-2 text-[14px] leading-[22px] text-slate-600">
              Чтобы включить её на этом сервере, задайте в настройках проекта переменную{" "}
              <Code>ADMIN_PASSWORD</Code> со своим паролем и перезапустите сайт (Deployments → «…» →
              Redeploy).
            </p>
          )}

          <p className="mt-3 text-[13px] text-slate-500">
            На своём компьютере админка работает как обычно.
          </p>

          <p className="mt-4 border-t border-slate-100 pt-3 text-[13px] text-slate-500">
            Хранилище картинок и текстов:{" "}
            {cloudEnabled() ? (
              <b className="text-emerald-700">подключено</b>
            ) : (
              <b className="text-amber-700">не подключено</b>
            )}
          </p>
        </div>
      </div>
    );
  }

  if (await isAuthenticated()) redirect("/admin");
  return <LoginForm />;
}
