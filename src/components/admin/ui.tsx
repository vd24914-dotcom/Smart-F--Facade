"use client";

import { useState } from "react";
import { locales, localeNames, type Locale } from "@/i18n/config";
import ImageEditor from "./ImageEditor";

/* ─────────────── базовые поля ─────────────── */

export function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-semibold text-slate-700">{label}</span>
      <input
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14px] text-slate-900 outline-none transition focus:border-slate-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <span className="mt-1 block text-[12px] text-slate-500">{hint}</span>}
    </label>
  );
}

export function Area({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-semibold text-slate-700">{label}</span>
      <textarea
        rows={rows}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14px] leading-[22px] text-slate-900 outline-none transition focus:border-slate-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/** Список строк: добавить / удалить / поменять местами. */
export function StringList({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const set = (i: number, v: string) => onChange(values.map((x, idx) => (idx === i ? v : x)));
  const move = (i: number, delta: number) => {
    const next = [...values];
    const j = i + delta;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <span className="mb-1 block text-[13px] font-semibold text-slate-700">{label}</span>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14px] outline-none transition focus:border-slate-900"
              value={value}
              placeholder={placeholder}
              onChange={(e) => set(index, e.target.value)}
            />
            <IconButton title="Выше" onClick={() => move(index, -1)}>
              ↑
            </IconButton>
            <IconButton title="Ниже" onClick={() => move(index, 1)}>
              ↓
            </IconButton>
            <IconButton title="Удалить" danger onClick={() => onChange(values.filter((_, i) => i !== index))}>
              ✕
            </IconButton>
          </div>
        ))}
      </div>
      <Button variant="ghost" className="mt-2" onClick={() => onChange([...values, ""])}>
        + Добавить строку
      </Button>
    </div>
  );
}

/* ─────────────── картинки ─────────────── */

export function ImageField({
  label,
  value,
  onChange,
  hint,
  aspect,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  /** пропорции блока на сайте: если задана — перед загрузкой открывается кадрирование */
  aspect?: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<{ src: string; name: string } | null>(null);
  // файла может не быть: удалили, переименовали или ссылка вписана руками
  const [missing, setMissing] = useState(false);

  const isVector = (name: string) => /\.(svg|gif)$/i.test(name);

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Не удалось загрузить");
      setMissing(false);
      onChange(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <span className="mb-2 block text-[13px] font-semibold text-slate-700">{label}</span>

      <div className="flex items-start gap-4">
        <div className="flex h-[92px] w-[130px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {value && !missing ? (
            // обычный img: превью может быть и SVG, и свежезагруженным файлом
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              className="max-h-full max-w-full object-contain"
              onError={() => setMissing(true)}
            />
          ) : (
            <span className="px-2 text-center text-[12px] leading-[16px] text-slate-400">
              {value ? "файл не найден" : "нет файла"}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] outline-none transition focus:border-slate-900"
            value={value}
            onChange={(e) => {
              setMissing(false);
              onChange(e.target.value);
            }}
            placeholder="/uploads/название-файла.png"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded-lg bg-slate-900 px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-slate-700">
              {busy ? "Загрузка…" : "Загрузить файл"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (aspect && !isVector(file.name)) {
                      setEditing({ src: URL.createObjectURL(file), name: file.name });
                    } else {
                      upload(file);
                    }
                  }
                  e.target.value = "";
                }}
              />
            </label>
            {value && aspect && !isVector(value) && (
              <Button
                variant="ghost"
                onClick={() => setEditing({ src: value, name: value.split("/").pop() || "image.jpg" })}
              >
                Кадрировать
              </Button>
            )}
            {value && (
              <Button variant="ghost" onClick={() => onChange("")}>
                Очистить
              </Button>
            )}
          </div>
          {hint && <p className="mt-1 text-[12px] text-slate-500">{hint}</p>}
          {error && <p className="mt-1 text-[12px] text-red-600">{error}</p>}
        </div>
      </div>

      {editing && (
        <ImageEditor
          src={editing.src}
          fileName={editing.name}
          aspect={aspect}
          onCancel={() => {
            if (editing.src.startsWith("blob:")) URL.revokeObjectURL(editing.src);
            setEditing(null);
          }}
          onDone={(file) => {
            if (editing.src.startsWith("blob:")) URL.revokeObjectURL(editing.src);
            setEditing(null);
            upload(file);
          }}
        />
      )}
    </div>
  );
}

/* ─────────────── кнопки, карточки, вкладки ─────────────── */

export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const styles = {
    primary: "bg-slate-900 text-white hover:bg-slate-700",
    ghost: "border border-slate-300 bg-white text-slate-700 hover:border-slate-500",
    danger: "border border-red-200 bg-red-50 text-red-700 hover:border-red-400",
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`h-9 w-9 shrink-0 rounded-lg border text-[13px] transition ${
        danger
          ? "border-red-200 bg-red-50 text-red-600 hover:border-red-400"
          : "border-slate-300 bg-white text-slate-600 hover:border-slate-500"
      }`}
    >
      {children}
    </button>
  );
}

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      {title && <h2 className="mb-4 text-[15px] font-bold text-slate-900">{title}</h2>}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function LocaleTabs({ value, onChange }: { value: Locale; onChange: (locale: Locale) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => onChange(locale)}
          className={`rounded-md px-3 py-1 text-[13px] font-semibold transition ${
            locale === value ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {localeNames[locale]}
        </button>
      ))}
    </div>
  );
}

/* ─────────────── сохранение ─────────────── */

export function useSave(file: string) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function save(data: unknown) {
    setState("saving");
    setMessage("");
    try {
      const res = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file, data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Не удалось сохранить");
      setState("saved");
      setTimeout(() => setState("idle"), 2500);
    } catch (e) {
      setState("error");
      setMessage(e instanceof Error ? e.message : "Ошибка");
    }
  }

  return { state, message, save };
}

export function SaveBar({
  state,
  message,
  onSave,
  children,
}: {
  state: "idle" | "saving" | "saved" | "error";
  message?: string;
  onSave: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-4 z-20 mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.15)]">
      <Button onClick={onSave} disabled={state === "saving"}>
        {state === "saving" ? "Сохраняю…" : "Сохранить"}
      </Button>
      {state === "saved" && <span className="text-[13px] font-semibold text-green-700">Сохранено ✓</span>}
      {state === "error" && <span className="text-[13px] font-semibold text-red-600">{message}</span>}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  );
}

/** Превью сайта в рамке — сразу видно, как выглядят правки. */
export function Preview({ path }: { path: string }) {
  const [locale, setLocale] = useState<Locale>("ru");
  const [nonce, setNonce] = useState(0);
  const url = `/${locale}${path}`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-[15px] font-bold text-slate-900">Предпросмотр</h2>
        <LocaleTabs value={locale} onChange={setLocale} />
        <Button variant="ghost" onClick={() => setNonce((n) => n + 1)}>
          Обновить
        </Button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:border-slate-500"
        >
          Открыть в новой вкладке ↗
        </a>
      </div>
      <iframe
        key={nonce}
        src={`${url}?preview=${nonce}`}
        className="h-[600px] w-full rounded-lg border border-slate-200"
        title="Предпросмотр"
      />
    </div>
  );
}
