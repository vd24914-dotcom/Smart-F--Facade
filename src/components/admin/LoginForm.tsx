"use client";

import { useState } from "react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error || "Не удалось войти");
        setBusy(false);
        return;
      }

      // именно полная перезагрузка: router.push оставался на странице входа
      // из-за клиентского кеша маршрута /admin
      window.location.replace("/admin");
    } catch {
      setError("Сервер не отвечает. Проверьте, что проект запущен.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-[360px] rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-[18px] font-extrabold uppercase tracking-[1px] text-slate-900">Админка Smart Facade</h1>
        <p className="mt-1 text-[13px] text-slate-500">Введите пароль, чтобы редактировать сайт.</p>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          className="mt-5 w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] outline-none transition focus:border-slate-900"
        />
        {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {busy ? "Проверяю…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
