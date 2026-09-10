"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { SiteContent, TextsContent } from "@/content/store";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Area, Button, Card, Field, IconButton, ImageField, LocaleTabs, Preview, StringList } from "./ui";

/* ─────────────── работа с вложенными путями ─────────────── */

function get(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);
}

function set<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split(".");
  const copy = structuredClone(obj) as Record<string, unknown>;
  let node: Record<string, unknown> = copy;
  keys.slice(0, -1).forEach((key) => {
    node[key] = { ...(node[key] as Record<string, unknown>) };
    node = node[key] as Record<string, unknown>;
  });
  node[keys[keys.length - 1]] = value;
  return copy as T;
}

/* ─────────────── общий контекст раздела ─────────────── */

type Api = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dict: Dictionary;
  texts: TextsContent;
  site: SiteContent;
  /** прочитать текст текущего языка по пути вида "hero.title" */
  tx: (path: string) => unknown;
  /** записать текст текущего языка */
  setTx: (path: string, value: unknown) => void;
  /** изменить список во всех языках сразу — чтобы длины не разъезжались */
  setTxEveryLocale: (path: string, mutate: (list: string[]) => string[]) => void;
  setImage: (key: keyof SiteContent["images"], value: string) => void;
  setIcons: (group: keyof SiteContent["icons"], value: string[]) => void;
  setSite: React.Dispatch<React.SetStateAction<SiteContent>>;
};

const Ctx = createContext<Api | null>(null);

export function useContent() {
  const api = useContext(Ctx);
  if (!api) throw new Error("useContent вне ContentProvider");
  return api;
}

/** Держит тексты и site.json вместе, чтобы блок правился в одном месте. */
export function useContentState(initialTexts: TextsContent, initialSite: SiteContent) {
  const [texts, setTexts] = useState(initialTexts);
  const [site, setSite] = useState(initialSite);
  const [locale, setLocale] = useState<Locale>("ru");

  const api = useMemo<Api>(
    () => ({
      locale,
      setLocale,
      dict: texts[locale],
      texts,
      site,
      tx: (path) => get(texts[locale], path),
      setTx: (path, value) =>
        setTexts((prev) => ({ ...prev, [locale]: set(prev[locale], path, value) })),
      setTxEveryLocale: (path, mutate) =>
        setTexts((prev) => {
          const next = { ...prev };
          (Object.keys(prev) as Locale[]).forEach((loc) => {
            const current = ((get(prev[loc], path) as string[]) ?? []).slice();
            next[loc] = set(prev[loc], path, mutate(current));
          });
          return next;
        }),
      setImage: (key, value) =>
        setSite((prev) => ({ ...prev, images: { ...prev.images, [key]: value } })),
      setIcons: (group, value) =>
        setSite((prev) => ({ ...prev, icons: { ...prev.icons, [group]: value } })),
      setSite,
    }),
    [texts, site, locale]
  );

  return { api, texts, site, setSite, setTexts, locale, setLocale };
}

export function ContentProvider({ api, children }: { api: Api; children: React.ReactNode }) {
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

/* ─────────────── поля, привязанные к текстам ─────────────── */

export function T({
  path,
  label,
  kind = "text",
  hint,
  rows,
  placeholder,
}: {
  path: string;
  label: string;
  kind?: "text" | "area" | "list";
  hint?: string;
  rows?: number;
  placeholder?: string;
}) {
  const { tx, setTx } = useContent();
  const value = tx(path);

  if (kind === "list") {
    return (
      <StringList
        label={label}
        values={(value as string[]) ?? []}
        onChange={(v) => setTx(path, v)}
        placeholder={placeholder}
      />
    );
  }
  if (kind === "area") {
    return (
      <Area label={label} rows={rows} value={(value as string) ?? ""} onChange={(v) => setTx(path, v)} />
    );
  }
  return <Field label={label} hint={hint} value={(value as string) ?? ""} onChange={(v) => setTx(path, v)} />;
}

/** Картинка из site.json */
export function Img({
  imgKey,
  label,
  hint,
  aspect,
}: {
  imgKey: keyof SiteContent["images"];
  label: string;
  hint?: string;
  aspect?: number;
}) {
  const { site, setImage } = useContent();
  return (
    <ImageField
      label={label}
      hint={hint}
      aspect={aspect}
      value={site.images[imgKey]}
      onChange={(value) => setImage(imgKey, value)}
    />
  );
}

/* ─────────────── карточка блока ─────────────── */

export function Block({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card title={title}>
      {hint && <p className="-mt-1 text-[13px] leading-[19px] text-slate-500">{hint}</p>}
      {children}
    </Card>
  );
}

/* ─────────────── соцсети ─────────────── */

/**
 * Список соцсетей: название, ссылка и своя иконка.
 * Строк можно добавлять сколько угодно — они хранятся в site.json.
 */
export function SocialRows({ hint }: { hint?: string }) {
  const { site, setSite } = useContent();
  const rows = site.socials ?? [];

  const update = (next: SiteContent["socials"]) => setSite((prev) => ({ ...prev, socials: next }));

  const setField = (index: number, key: "label" | "url" | "icon", value: string) =>
    update(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));

  const move = (index: number, delta: number) => {
    const j = index + delta;
    if (j < 0 || j >= rows.length) return;
    const next = rows.slice();
    [next[index], next[j]] = [next[j], next[index]];
    update(next);
  };

  const remove = (index: number) => update(rows.filter((_, i) => i !== index));

  const add = () =>
    update([
      ...rows,
      { id: `social-${Date.now()}-${rows.length}`, label: "", url: "", icon: "" },
    ]);

  return (
    <div className="space-y-3">
      {hint && <p className="text-[13px] leading-[19px] text-slate-500">{hint}</p>}

      {rows.map((row, index) => (
        <div key={row.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[13px] font-bold text-slate-700">
              {row.label?.trim() || `Соцсеть ${index + 1}`}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <IconButton title="Выше" onClick={() => move(index, -1)}>
                ↑
              </IconButton>
              <IconButton title="Ниже" onClick={() => move(index, 1)}>
                ↓
              </IconButton>
              <IconButton title="Удалить" danger onClick={() => remove(index)}>
                ✕
              </IconButton>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Название"
                hint="Показывается в подвале и во всплывающей подсказке"
                value={row.label ?? ""}
                onChange={(value) => setField(index, "label", value)}
              />
              <Field
                label="Ссылка"
                hint="Полный адрес, например https://t.me/smartfacade"
                value={row.url ?? ""}
                onChange={(value) => setField(index, "url", value)}
              />
            </div>
            <ImageField
              label="Иконка (необязательно)"
              hint="SVG или PNG на прозрачном фоне. Если не загружать — подставится простой значок."
              value={row.icon ?? ""}
              onChange={(value) => setField(index, "icon", value)}
            />
          </div>
        </div>
      ))}

      <Button variant="ghost" onClick={add}>
        + Добавить соцсеть
      </Button>
    </div>
  );
}

/* ─────────────── иконка + подпись одной строкой ─────────────── */

/**
 * Пары «иконка + текст»: иконки лежат в site.icons, подписи — в текстах.
 * Добавление и удаление меняет обе стороны сразу, поэтому список не разъезжается.
 */
export function IconTextRows({
  group,
  path,
  itemLabel,
  addLabel,
  hint,
}: {
  group: keyof SiteContent["icons"];
  /** путь до массива подписей в текстах, например "about.specs" */
  path: string;
  itemLabel: string;
  addLabel: string;
  hint?: string;
}) {
  const { site, setIcons, tx, setTx, setTxEveryLocale } = useContent();
  const icons = site.icons[group];
  const labels = (tx(path) as string[]) ?? [];
  const count = Math.max(icons.length, labels.length);

  const pad = (list: string[]) => Array.from({ length: count }, (_, i) => list[i] ?? "");

  const setLabel = (index: number, value: string) =>
    setTx(
      path,
      pad(labels).map((item, i) => (i === index ? value : item))
    );

  const setIcon = (index: number, value: string) =>
    setIcons(
      group,
      pad(icons).map((item, i) => (i === index ? value : item))
    );

  const move = (index: number, delta: number) => {
    const j = index + delta;
    if (j < 0 || j >= count) return;

    const nextIcons = pad(icons);
    [nextIcons[index], nextIcons[j]] = [nextIcons[j], nextIcons[index]];
    setIcons(group, nextIcons);

    setTxEveryLocale(path, (list) => {
      const next = Array.from({ length: count }, (_, i) => list[i] ?? "");
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const remove = (index: number) => {
    setIcons(
      group,
      pad(icons).filter((_, i) => i !== index)
    );
    setTxEveryLocale(path, (list) =>
      Array.from({ length: count }, (_, i) => list[i] ?? "").filter((_, i) => i !== index)
    );
  };

  const add = () => {
    setIcons(group, [...pad(icons), ""]);
    setTxEveryLocale(path, (list) => [...Array.from({ length: count }, (_, i) => list[i] ?? ""), ""]);
  };

  return (
    <div className="space-y-3">
      {hint && <p className="text-[13px] leading-[19px] text-slate-500">{hint}</p>}

      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[13px] font-bold text-slate-700">
              {itemLabel} {index + 1}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <IconButton title="Выше" onClick={() => move(index, -1)}>
                ↑
              </IconButton>
              <IconButton title="Ниже" onClick={() => move(index, 1)}>
                ↓
              </IconButton>
              <IconButton title="Удалить" danger onClick={() => remove(index)}>
                ✕
              </IconButton>
            </div>
          </div>

          <div className="space-y-3">
            <ImageField
              label="Иконка"
              hint="SVG или PNG на прозрачном фоне"
              value={icons[index] ?? ""}
              onChange={(value) => setIcon(index, value)}
            />
            <Field label="Подпись" value={labels[index] ?? ""} onChange={(value) => setLabel(index, value)} />
          </div>
        </div>
      ))}

      <Button variant="ghost" onClick={add}>
        + {addLabel}
      </Button>
    </div>
  );
}

/**
 * Преимущества: иконка из site.icons.advantages + заголовок и текст из текстов.
 * Всё правится одной карточкой, добавление и удаление синхронно.
 */
export function AdvantageRows({ hint }: { hint?: string }) {
  const path = "pages.about.advantages";
  const group = "advantages" as const;
  const { site, setIcons, dict, setTx, setTxEveryLocale } = useContent();

  const icons = site.icons[group];
  const items = dict.pages.about.advantages ?? [];
  const count = Math.max(icons.length, items.length);

  const padIcons = () => Array.from({ length: count }, (_, i) => icons[i] ?? "");
  const padItems = () =>
    Array.from({ length: count }, (_, i) => items[i] ?? { title: "", text: "" });

  const setField = (index: number, key: "title" | "text", value: string) =>
    setTx(
      path,
      padItems().map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );

  const setIcon = (index: number, value: string) =>
    setIcons(
      group,
      padIcons().map((item, i) => (i === index ? value : item))
    );

  // элементы преимуществ — объекты, поэтому синхронизируем длину через приведение типов
  const mutateEvery = (mutate: (list: unknown[]) => unknown[]) =>
    setTxEveryLocale(path, (list) => mutate(list as unknown[]) as string[]);

  const move = (index: number, delta: number) => {
    const j = index + delta;
    if (j < 0 || j >= count) return;

    const nextIcons = padIcons();
    [nextIcons[index], nextIcons[j]] = [nextIcons[j], nextIcons[index]];
    setIcons(group, nextIcons);

    mutateEvery((list) => {
      const next = Array.from({ length: count }, (_, i) => list[i] ?? { title: "", text: "" });
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const remove = (index: number) => {
    setIcons(
      group,
      padIcons().filter((_, i) => i !== index)
    );
    mutateEvery((list) =>
      Array.from({ length: count }, (_, i) => list[i] ?? { title: "", text: "" }).filter(
        (_, i) => i !== index
      )
    );
  };

  const add = () => {
    setIcons(group, [...padIcons(), ""]);
    mutateEvery((list) => [
      ...Array.from({ length: count }, (_, i) => list[i] ?? { title: "", text: "" }),
      { title: "", text: "" },
    ]);
  };

  return (
    <div className="space-y-3">
      {hint && <p className="text-[13px] leading-[19px] text-slate-500">{hint}</p>}

      {padItems().map((item, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[13px] font-bold text-slate-700">Преимущество {index + 1}</span>
            <div className="ml-auto flex items-center gap-2">
              <IconButton title="Выше" onClick={() => move(index, -1)}>
                ↑
              </IconButton>
              <IconButton title="Ниже" onClick={() => move(index, 1)}>
                ↓
              </IconButton>
              <IconButton title="Удалить" danger onClick={() => remove(index)}>
                ✕
              </IconButton>
            </div>
          </div>

          <div className="space-y-3">
            <ImageField
              label="Иконка"
              hint="SVG или PNG на прозрачном фоне"
              value={icons[index] ?? ""}
              onChange={(value) => setIcon(index, value)}
            />
            <Field
              label="Заголовок"
              value={item.title}
              onChange={(value) => setField(index, "title", value)}
            />
            <Area
              label="Текст"
              rows={3}
              value={item.text}
              onChange={(value) => setField(index, "text", value)}
            />
          </div>
        </div>
      ))}

      <Button variant="ghost" onClick={add}>
        + Добавить преимущество
      </Button>
    </div>
  );
}

/** Цифры «200 клиентов в год»: значение и подпись. */
export function StatRows() {
  const { dict, setTx, setTxEveryLocale } = useContent();
  const stats = dict.stats ?? [];

  const mutateEvery = (mutate: (list: unknown[]) => unknown[]) =>
    setTxEveryLocale("stats", (list) => mutate(list as unknown[]) as string[]);

  return (
    <div className="space-y-3">
      {stats.map((stat, index) => (
        <div key={index} className="grid gap-3 sm:grid-cols-[170px_1fr_44px]">
          <Field
            label="Значение"
            value={stat.value}
            onChange={(v) =>
              setTx(
                "stats",
                stats.map((s, i) => (i === index ? { ...s, value: v } : s))
              )
            }
          />
          <Field
            label="Подпись"
            value={stat.label}
            onChange={(v) =>
              setTx(
                "stats",
                stats.map((s, i) => (i === index ? { ...s, label: v } : s))
              )
            }
          />
          <div className="flex items-end">
            <IconButton
              title="Удалить"
              danger
              onClick={() => mutateEvery((list) => list.filter((_, i) => i !== index))}
            >
              ✕
            </IconButton>
          </div>
        </div>
      ))}
      <Button
        variant="ghost"
        onClick={() => mutateEvery((list) => [...list, { value: "", label: "" }])}
      >
        + Добавить цифру
      </Button>
    </div>
  );
}

/* ─────────────── шапка раздела и сохранение ─────────────── */

export function PageShell({
  title,
  lead,
  preview,
  children,
  bar,
}: {
  title: string;
  lead?: string;
  /** путь предпросмотра, например "/about" */
  preview: string;
  children: React.ReactNode;
  bar: React.ReactNode;
}) {
  const { locale, setLocale } = useContent();

  return (
    <div className="grid gap-6 pb-10 xl:grid-cols-[minmax(0,1fr)_520px]">
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-3">
          <h1 className="text-[20px] font-extrabold text-slate-900">{title}</h1>
          <LocaleTabs value={locale} onChange={setLocale} />
        </div>
        {lead && <p className="mb-4 text-[13px] text-slate-500">{lead}</p>}

        <div className="space-y-5">{children}</div>

        {bar}
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <Preview path={preview} />
      </div>
    </div>
  );
}

/** Сохранение нескольких файлов контента одной кнопкой. */
export function useSaveAll() {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function saveAll(parts: { file: string; data: unknown }[]) {
    setState("saving");
    setMessage("");
    try {
      for (const part of parts) {
        const res = await fetch("/api/admin/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(part),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Не удалось сохранить");
      }
      setState("saved");
      setTimeout(() => setState("idle"), 2500);
    } catch (e) {
      setState("error");
      setMessage(e instanceof Error ? e.message : "Ошибка");
    }
  }

  return { state, message, saveAll };
}
