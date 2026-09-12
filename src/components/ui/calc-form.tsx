"use client";

import { useRef, useState } from "react";
import { Paperclip, Send, X } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { isValidArea, isValidName, isValidPhone, normalizePhone } from "@/lib/validate";

/** 15 МБ — столько же принимает сервер. */
const MAX_FILE = 15 * 1024 * 1024;

type Values = {
  name: string;
  company: string;
  phone: string;
  objectType: string;
  area: string;
  material: string;
  stage: string;
  /** ловушка для ботов — должна остаться пустой */
  website: string;
};

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-graphite outline-none transition-colors placeholder:text-slate-400 focus:border-navy";

const caption =
  "mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.6px] text-slate-500";

const arrow =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'><path d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>\")";

/** Поля объявлены снаружи: иначе React пересоздаёт их на каждый ввод и поле теряет фокус. */
function TextField({
  label,
  value,
  onChange,
  onBlur,
  required,
  type = "text",
  inputMode,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  type?: string;
  inputMode?: "numeric" | "tel";
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className={caption}>
        {label}
        {required && <span className="text-gold"> *</span>}
      </span>
      <input
        className={cn(field, error && "border-red-400 focus:border-red-500")}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
      />
      {error && <span className="mt-1 block text-[12px] leading-[16px] text-red-600">{error}</span>}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className={caption}>{label}</span>
      <select
        className={cn(field, "appearance-none pr-10")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          backgroundImage: arrow,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 16px center",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

const empty: Values = {
  name: "",
  company: "",
  phone: "",
  objectType: "",
  area: "",
  material: "",
  stage: "",
  website: "",
};

/**
 * Форма «Получить расчёт стоимости».
 * Восемь полей и файл чертежа; уходит в раздел «Заявки» админки и в телеграм.
 */
export default function CalcForm({
  dict,
  source = "calc",
  className,
  showTitle = true,
}: {
  dict: Dictionary;
  source?: string;
  className?: string;
  showTitle?: boolean;
}) {
  const t = dict.calc;
  const [values, setValues] = useState<Values>(empty);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  // какие поля человек уже трогал — до этого ошибки не показываем
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof Values, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // человек начал исправлять — общее сообщение об ошибке убираем
    if (state === "error") {
      setState("idle");
      setError("");
    }
  };

  const touch = (key: string) => setTouched((prev) => ({ ...prev, [key]: true }));

  /** Ошибки по полям: имя — минимум две буквы, телефон — настоящий номер. */
  const problems = {
    name: values.name.trim() && !isValidName(values.name) ? t.errName : "",
    phone: values.phone.trim() && !isValidPhone(values.phone) ? t.errPhone : "",
    area: !isValidArea(values.area) ? t.errArea : "",
  };

  const shown = (key: keyof typeof problems) =>
    touched[key] || state === "error" ? problems[key] : "";

  const canSend =
    isValidName(values.name) && isValidPhone(values.phone) && isValidArea(values.area);

  const pickFile = (chosen: File | null) => {
    if (chosen && chosen.size > MAX_FILE) {
      setError(t.fileHint);
      setState("error");
      return;
    }
    setError("");
    setFile(chosen);
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setTouched({ name: true, phone: true, area: true });

    if (!values.name.trim() || !values.phone.trim()) {
      setError(t.required);
      setState("error");
      return;
    }
    if (!canSend) {
      setError(problems.name || problems.phone || problems.area || t.required);
      setState("error");
      return;
    }

    setState("sending");
    setError("");

    try {
      const body = new FormData();
      Object.entries({ ...values, phone: normalizePhone(values.phone) }).forEach(
        ([key, value]) => body.append(key, value)
      );
      body.append("source", source);
      body.append("page", window.location.pathname);
      body.append("locale", document.documentElement.lang || "ru");
      if (file) body.append("file", file);

      const res = await fetch("/api/lead", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || t.error);

      setState("sent");
      setValues(empty);
      setTouched({});
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
      setState("error");
    }
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "rounded-2xl bg-white/95 p-6 shadow-[0_35px_80px_-45px_rgba(8,19,36,0.8)] backdrop-blur sm:p-8",
        className
      )}
    >
      {showTitle && (
        <>
          <h3 className="text-[18px] font-extrabold leading-[1.3] text-navy sm:text-[20px]">
            {t.title}
          </h3>
          <div className="mt-4 h-[3px] w-20 rounded-full bg-gradient-to-r from-gold to-gold/10" />
          {t.lead?.trim() && (
            <p className="mt-4 text-[14px] font-light leading-[22px] text-graphite">{t.lead}</p>
          )}
        </>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <TextField
          label={t.name}
          required
          value={values.name}
          onChange={(v) => set("name", v)}
          onBlur={() => touch("name")}
          error={shown("name")}
        />
        <TextField label={t.company} value={values.company} onChange={(v) => set("company", v)} />
        <TextField
          label={t.phone}
          required
          type="tel"
          inputMode="tel"
          placeholder={t.phoneHint}
          value={values.phone}
          onChange={(v) => set("phone", v.replace(/[^\d+()\-\s]/g, ""))}
          onBlur={() => touch("phone")}
          error={shown("phone")}
        />
        <TextField
          label={t.area}
          inputMode="numeric"
          value={values.area}
          onChange={(v) => set("area", v.replace(/[^\d\s.,]/g, ""))}
          onBlur={() => touch("area")}
          error={shown("area")}
        />
        <SelectField
          label={t.objectType}
          placeholder={t.choose}
          options={t.objectTypes ?? []}
          value={values.objectType}
          onChange={(v) => set("objectType", v)}
        />
        <SelectField
          label={t.material}
          placeholder={t.choose}
          options={t.materials ?? []}
          value={values.material}
          onChange={(v) => set("material", v)}
        />
        <div className="sm:col-span-2">
          <SelectField
            label={t.stage}
            placeholder={t.choose}
            options={t.stages ?? []}
            value={values.stage}
            onChange={(v) => set("stage", v)}
          />
        </div>

        <div className="sm:col-span-2">
          <span className={caption}>{t.file}</span>

          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.dwg,.dxf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.zip,.rar,.7z"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />

          {file ? (
            <div className="flex items-center gap-3 rounded-xl border border-navy/20 bg-mist px-4 py-3">
              <Paperclip className="size-4 shrink-0 text-navy" strokeWidth={1.8} />
              <span className="min-w-0 flex-1 truncate text-[14px] text-graphite">{file.name}</span>
              <button
                type="button"
                onClick={() => pickFile(null)}
                aria-label={t.fileRemove}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-navy"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-left transition-colors hover:border-navy"
            >
              <Paperclip className="size-4 shrink-0 text-navy" strokeWidth={1.8} />
              <span className="whitespace-nowrap text-[14px] font-semibold text-navy">{t.fileChoose}</span>
              <span className="ml-auto hidden text-[12px] text-slate-400 sm:block">{t.fileHint}</span>
            </button>
          )}
        </div>

        {/* ловушка для ботов */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
          value={values.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={state === "sending" || state === "sent"}
        className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-navy px-6 py-4 text-[14px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        <Send className="size-4" strokeWidth={1.8} />
        {state === "sending" ? "…" : state === "sent" ? "✓" : t.submit}
      </button>

      {state === "sent" && (
        <p className="mt-3 text-center text-[14px] font-semibold text-navy">{t.done}</p>
      )}
      {state === "error" && (
        <p className="mt-3 text-center text-[13px] text-red-600">{error || t.error}</p>
      )}
    </form>
  );
}
