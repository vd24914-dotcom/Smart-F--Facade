"use client";

import { useState } from "react";
import { Button, Card, Field } from "./ui";

export default function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function save() {
    setState("saving");
    setMessage("");
    const res = await fetch("/api/admin/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setState("error");
      setMessage(json.error || "Не удалось сменить пароль");
      return;
    }
    setState("saved");
    setCurrent("");
    setNext("");
    setTimeout(() => setState("idle"), 3000);
  }

  return (
    <Card title="Пароль от админки">
      <p className="text-[13px] text-slate-500">
        Пароль хранится в файле <code className="rounded bg-slate-100 px-1">content/admin.json</code>. После смены
        вход по старому паролю перестаёт работать на всех устройствах.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Текущий пароль" value={current} onChange={setCurrent} />
        <Field label="Новый пароль" value={next} onChange={setNext} hint="Минимум 4 символа" />
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={state === "saving" || !current || !next}>
          {state === "saving" ? "Сохраняю…" : "Сменить пароль"}
        </Button>
        {state === "saved" && <span className="text-[13px] font-semibold text-green-700">Пароль обновлён ✓</span>}
        {state === "error" && <span className="text-[13px] font-semibold text-red-600">{message}</span>}
      </div>
    </Card>
  );
}
