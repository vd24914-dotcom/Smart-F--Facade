"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RAIL_TARGET_ID } from "./AdminShell";
import { diffChanges } from "@/lib/patch";
import type { SiteContent, TextsContent } from "@/content/store";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Area, Button, Field, FileField, IconButton, ImageField, LocaleTabs, Preview, StringList } from "./ui";

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
  /** прикреплённые файлы, например документы к карточкам */
  setFiles: (group: keyof SiteContent["files"], value: string[]) => void;
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
  // каким раздел был при открытии — с этим сравниваем при сохранении
  const base = useRef({ texts: initialTexts, site: initialSite });

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
      setFiles: (group, value) =>
        setSite((prev) => ({ ...prev, files: { ...prev.files, [group]: value } })),
      setSite,
    }),
    [texts, site, locale]
  );

  return { api, texts, site, setSite, setTexts, locale, setLocale, base: base.current };
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

/** Список картинок: добавить, заменить, переставить, удалить. */
export function ImageRows({
  values,
  onChange,
  itemLabel,
  addLabel,
  hint,
  aspect,
  imageHint,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  itemLabel: string;
  addLabel: string;
  hint?: string;
  aspect?: number;
  imageHint?: string;
}) {
  const move = (index: number, delta: number) => {
    const j = index + delta;
    if (j < 0 || j >= values.length) return;
    const next = values.slice();
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {hint && <p className="text-[13px] leading-[19px] text-slate-500">{hint}</p>}

      {values.map((value, index) => (
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
              <IconButton
                title="Удалить"
                danger
                onClick={() => onChange(values.filter((_, i) => i !== index))}
              >
                ✕
              </IconButton>
            </div>
          </div>

          <ImageField
            label=""
            hint={imageHint}
            aspect={aspect}
            value={value}
            onChange={(next) => onChange(values.map((item, i) => (i === index ? next : item)))}
          />
        </div>
      ))}

      <Button variant="ghost" onClick={() => onChange([...values, ""])}>
        + {addLabel}
      </Button>
    </div>
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
  // якорь для списка разделов в боковой колонке
  const id = "block-" + title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
  const sections = useContext(SectionsContext);
  // вне PageShell блок всегда развёрнут — так ведут себя отдельные страницы вроде заявок
  const open = sections ? sections.openId === id : true;

  return (
    <section
      id={id}
      data-admin-block={title}
      className={`scroll-mt-24 rounded-2xl border bg-white shadow-sm transition ${
        open ? "border-slate-200/80" : "border-slate-200/80 hover:border-slate-400"
      }`}
    >
      <button
        type="button"
        onClick={() => sections?.toggle(id)}
        aria-expanded={open}
        aria-controls={`${id}-body`}
        disabled={!sections}
        className="flex w-full items-start gap-3 rounded-2xl px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 disabled:cursor-default sm:px-6"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-extrabold text-slate-900">{title}</span>
          {hint && <span className="mt-1 block text-[13px] leading-[19px] text-slate-500">{hint}</span>}
        </span>
        {sections && (
          <span
            aria-hidden
            className={`mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition ${
              open ? "rotate-180 bg-navy text-white" : ""
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </button>

      {open && (
        <div id={`${id}-body`} className="space-y-4 border-t border-slate-100 px-5 pb-6 pt-5 sm:px-6">
          {children}
        </div>
      )}
    </section>
  );
}

/** Какой блок страницы развёрнут: остальные свёрнуты в одну строку, чтобы не листать. */
const SectionsContext = createContext<{ openId: string | null; toggle: (id: string) => void } | null>(null);

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

/**
 * Список карточек «заголовок + текст»: материалы, шаги работы, документы.
 * Добавление и удаление меняет список во всех языках сразу, чтобы они не разъезжались.
 */
export function TitleTextRows({
  path,
  itemLabel,
  addLabel,
  hint,
  rows = 3,
  fileGroup,
  fileLabel = "Прикреплённый файл",
  fileHint,
  iconGroup,
  iconLabel = "Иконка или фото",
  iconHint = "SVG или PNG на прозрачном фоне. Показывается маленькой иконкой в кружке. Без картинки карточка идёт без кружка.",
  extraIcons = [],
  iconAspect,
}: {
  /** путь до массива, например "materials.items" */
  path: string;
  itemLabel: string;
  addLabel: string;
  hint?: string;
  rows?: number;
  /** если задано — к каждой карточке можно прикрепить документ (site.files[group]) */
  fileGroup?: keyof SiteContent["files"];
  fileLabel?: string;
  fileHint?: string;
  /** если задано — у каждой карточки своя картинка (site.icons[group]) */
  iconGroup?: keyof SiteContent["icons"];
  iconLabel?: string;
  iconHint?: string;
  /** дополнительные картинки к каждой карточке — например сканы листов документа */
  extraIcons?: { group: keyof SiteContent["icons"]; label: string; hint?: string }[];
  /** пропорции основной картинки: если заданы — перед загрузкой открывается кадрирование */
  iconAspect?: number;
}) {
  const { tx, setTx, setTxEveryLocale, site, setFiles, setIcons } = useContent();
  const items = ((tx(path) as { title: string; text: string }[]) ?? []).slice();
  const attached = fileGroup ? site.files?.[fileGroup] ?? [] : [];

  /** все группы картинок этой карточки: основная и дополнительные */
  const groups: (keyof SiteContent["icons"])[] = [
    ...(iconGroup ? [iconGroup] : []),
    ...extraIcons.map((extra) => extra.group),
  ];
  const picturesOf = (group: keyof SiteContent["icons"]) => site.icons?.[group] ?? [];

  /** файлы хранятся отдельным списком — держим его той же длины, что и карточки */
  const padFiles = (length: number) =>
    Array.from({ length }, (_, i) => attached[i] ?? "");

  /** то же самое для картинок: их порядок обязан совпадать с порядком карточек */
  const padIcons = (group: keyof SiteContent["icons"], length: number) =>
    Array.from({ length }, (_, i) => picturesOf(group)[i] ?? "");

  const setFile = (index: number, value: string) => {
    if (!fileGroup) return;
    setFiles(
      fileGroup,
      padFiles(Math.max(items.length, index + 1)).map((item, i) => (i === index ? value : item))
    );
  };

  const setIcon = (group: keyof SiteContent["icons"], index: number, value: string) => {
    setIcons(
      group,
      padIcons(group, Math.max(items.length, index + 1)).map((item, i) => (i === index ? value : item))
    );
  };

  const mutateEvery = (mutate: (list: unknown[]) => unknown[]) =>
    setTxEveryLocale(path, (list) => mutate(list as unknown[]) as string[]);

  const setField = (index: number, key: "title" | "text", value: string) =>
    setTx(
      path,
      items.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );

  const move = (index: number, delta: number) => {
    const j = index + delta;
    if (j < 0 || j >= items.length) return;
    mutateEvery((list) => {
      const next = list.slice();
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
    if (fileGroup) {
      const next = padFiles(items.length);
      [next[index], next[j]] = [next[j], next[index]];
      setFiles(fileGroup, next);
    }
    for (const group of groups) {
      const next = padIcons(group, items.length);
      [next[index], next[j]] = [next[j], next[index]];
      setIcons(group, next);
    }
  };

  const removeRow = (index: number) => {
    mutateEvery((list) => list.filter((_, i) => i !== index));
    if (fileGroup) setFiles(fileGroup, padFiles(items.length).filter((_, i) => i !== index));
    for (const group of groups) {
      setIcons(group, padIcons(group, items.length).filter((_, i) => i !== index));
    }
  };

  const addRow = () => {
    mutateEvery((list) => [...list, { title: "", text: "" }]);
    if (fileGroup) setFiles(fileGroup, [...padFiles(items.length), ""]);
    for (const group of groups) {
      setIcons(group, [...padIcons(group, items.length), ""]);
    }
  };

  return (
    <div className="space-y-3">
      {hint && <p className="text-[13px] leading-[19px] text-slate-500">{hint}</p>}

      {items.map((item, index) => (
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
              <IconButton title="Удалить" danger onClick={() => removeRow(index)}>
                ✕
              </IconButton>
            </div>
          </div>

          <div className="space-y-3">
            {iconGroup && (
              <ImageField
                label={iconLabel}
                hint={iconHint}
                aspect={iconAspect}
                value={picturesOf(iconGroup)[index] ?? ""}
                onChange={(value) => setIcon(iconGroup, index, value)}
              />
            )}
            {extraIcons.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {extraIcons.map((extra) => (
                  <ImageField
                    key={extra.group}
                    label={extra.label}
                    hint={extra.hint}
                    value={picturesOf(extra.group)[index] ?? ""}
                    onChange={(value) => setIcon(extra.group, index, value)}
                  />
                ))}
              </div>
            )}
            <Field
              label="Заголовок"
              value={item?.title ?? ""}
              onChange={(value) => setField(index, "title", value)}
            />
            <Area
              label="Текст"
              rows={rows}
              value={item?.text ?? ""}
              onChange={(value) => setField(index, "text", value)}
            />
            {fileGroup && (
              <FileField
                label={fileLabel}
                hint={fileHint}
                value={attached[index] ?? ""}
                onChange={(value) => setFile(index, value)}
              />
            )}
          </div>
        </div>
      ))}

      <Button variant="ghost" onClick={addRow}>
        + {addLabel}
      </Button>
    </div>
  );
}

/** Цифры «200 000 м² фасадов»: значение и подпись. */
export function StatRows({ path = "stats" }: { path?: string } = {}) {
  const { tx, setTx, setTxEveryLocale } = useContent();
  const stats = ((tx(path) as { value: string; label: string }[]) ?? []).slice();

  const mutateEvery = (mutate: (list: unknown[]) => unknown[]) =>
    setTxEveryLocale(path, (list) => mutate(list as unknown[]) as string[]);

  return (
    <div className="space-y-3">
      {stats.map((stat, index) => (
        <div key={index} className="grid gap-3 sm:grid-cols-[170px_1fr_44px]">
          <Field
            label="Значение"
            value={stat.value}
            onChange={(v) =>
              setTx(
                path,
                stats.map((s, i) => (i === index ? { ...s, value: v } : s))
              )
            }
          />
          <Field
            label="Подпись"
            value={stat.label}
            onChange={(v) =>
              setTx(
                path,
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
  const body = useRef<HTMLDivElement>(null);
  const [sections, setSections] = useState<{ id: string; title: string }[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rail, setRail] = useState<HTMLElement | null>(null);
  // развёрнут только один блок: по умолчанию первый
  const [openId, setOpenId] = useState<string | null>(null);
  const scrollTo = useRef<string | null>(null);

  const toggle = (id: string) => setOpenId((current) => (current === id ? null : id));
  const openSection = (id: string) => {
    scrollTo.current = id;
    setOpenId(id);
  };

  useEffect(() => {
    if (openId === null && sections.length > 0) setOpenId(sections[0].id);
  }, [sections, openId]);

  // после раскрытия подъезжаем к блоку — иначе он остаётся ниже экрана
  useEffect(() => {
    const id = scrollTo.current;
    if (!id || openId !== id) return;
    scrollTo.current = null;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [openId]);

  // список разделов страницы собираем из самих блоков — расставлять его руками не нужно
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const read = () =>
      setSections(
        Array.from(el.querySelectorAll<HTMLElement>("[data-admin-block]")).map((node) => ({
          id: node.id,
          title: node.dataset.adminBlock ?? "",
        }))
      );
    read();
    const observer = new MutationObserver(read);
    observer.observe(el, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // правая колонка живёт в оболочке админки — подмешиваем туда инструменты страницы
  useEffect(() => {
    setRail(document.getElementById(RAIL_TARGET_ID));
  }, []);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  const tools = (withBar: boolean) => (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-slate-400">Эта страница</p>
      <p className="mt-1 text-[15px] font-extrabold text-slate-900">{title}</p>

      <div className="mt-3">
        <LocaleTabs value={locale} onChange={setLocale} />
      </div>

      {sections.length > 1 && (
        <ol className="mt-4 space-y-0.5 border-t border-slate-100 pt-3">
          {sections.map((section) => {
            const active = section.id === openId;
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => openSection(section.id)}
                  aria-current={active ? "true" : undefined}
                  className={`block w-full rounded-lg px-2 py-1.5 text-left text-[13px] leading-[18px] transition ${
                    active ? "bg-navy/10 font-semibold text-navy" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {section.title}
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
        {withBar && bar}
        <Button variant="ghost" className="w-full" onClick={() => setPreviewOpen(true)}>
          Предпросмотр
        </Button>
      </div>
    </div>
  );

  return (
    <div className="pb-10">
      <div className="mb-5">
        <h1 className="text-[22px] font-extrabold tracking-[-0.2px] text-slate-900">{title}</h1>
        {lead && <p className="mt-1 text-[14px] leading-[21px] text-slate-500">{lead}</p>}
      </div>

      {/* на узких экранах язык и разделы — над содержимым, сохранение — внизу */}
      <div className="mb-5 xl:hidden">{tools(false)}</div>

      <SectionsContext.Provider value={{ openId, toggle }}>
        <div ref={body} className="space-y-3">
          {children}
        </div>
      </SectionsContext.Provider>

      <div className="xl:hidden">{bar}</div>

      {rail && createPortal(tools(true), rail)}

      {previewOpen && (
        <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Предпросмотр">
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => setPreviewOpen(false)}
            className="absolute inset-0 cursor-default bg-slate-900/50 backdrop-blur-[2px]"
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-[860px] flex-col bg-[#f3f5f8] shadow-[-20px_0_60px_rgba(15,23,42,0.25)]">
            <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
              <p className="text-[15px] font-extrabold text-slate-900">Предпросмотр</p>
              <Button variant="ghost" className="ml-auto" onClick={() => setPreviewOpen(false)}>
                Закрыть
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <Preview path={preview} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Сохранение нескольких файлов контента одной кнопкой. */
export function useSaveAll() {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  /**
   * Отправляет только то, что человек изменил на этой странице.
   * `base` — как раздел выглядел при открытии; без него уходит файл целиком
   * (так было раньше, и так одна вкладка затирала правки другой).
   */
  async function saveAll(parts: { file: string; data: unknown; base?: unknown }[]) {
    setState("saving");
    setMessage("");
    try {
      for (const part of parts) {
        const body =
          part.base === undefined
            ? { file: part.file, data: part.data }
            : { file: part.file, changes: diffChanges(part.base, part.data) };

        const res = await fetch("/api/admin/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
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
