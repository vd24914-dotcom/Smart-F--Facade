"use client";

import { useState } from "react";
import type { ContactsContent, SiteContent, TextsContent } from "@/content/store";
import { locales, type Locale } from "@/i18n/config";
import { Block, ContentProvider, PageShell, T, useContentState, useSaveAll } from "./page-kit";
import { Button, Card, Field, IconButton, SaveBar, StringList } from "./ui";

const linkTypes: { value: ContactsContent["blocks"][number]["link"]; label: string }[] = [
  { value: "none", label: "обычный текст" },
  { value: "tel", label: "телефон (кликабельный)" },
  { value: "mail", label: "почта (кликабельная)" },
  { value: "url", label: "ссылка" },
];

const empty = () => ({
  id: `block-${Date.now()}`,
  title: { ru: "", uz: "", en: "" } as Record<Locale, string>,
  items: { ru: [""], uz: [""], en: [""] } as Record<Locale, string[]>,
  link: "none" as const,
});

/** Страница «Контакты»: тексты формы и разделы с адресами — в одном месте. */
export default function ContactsEditor({
  contacts,
  texts,
  site,
}: {
  contacts: ContactsContent;
  texts: TextsContent;
  site: SiteContent;
}) {
  const [blocks, setBlocks] = useState(contacts.blocks);
  const store = useContentState(texts, site);
  const { state, message, saveAll } = useSaveAll();
  const locale = store.locale;

  const patch = (
    index: number,
    updater: (block: ContactsContent["blocks"][number]) => ContactsContent["blocks"][number]
  ) => setBlocks((prev) => prev.map((b, i) => (i === index ? updater(b) : b)));

  const move = (index: number, delta: number) =>
    setBlocks((prev) => {
      const next = [...prev];
      const j = index + delta;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });

  const save = () =>
    saveAll([
      { file: "contacts", data: { blocks } },
      { file: "texts", data: store.texts, base: store.base.texts },
    ]);

  return (
    <ContentProvider api={store.api}>
      <PageShell
        title="Контакты"
        lead="Телефоны, почта и соцсети меняются в разделе «Общее» — они нужны всему сайту."
        preview="/contacts"
        bar={<SaveBar state={state} message={message} onSave={save} />}
      >
        <Block title="Заголовки страницы">
          <T path="pages.contacts.heading" label="Заголовок страницы" />
          <T path="pages.contacts.socialTitle" label="Заголовок «Мы в соцсетях»" />
        </Block>

        <Block title="Форма заявки" hint="Эти же подписи используются в модальном окне «Контакты».">
          <T path="pages.contacts.formTitle" label="Заголовок формы" />
          <div className="grid gap-4 sm:grid-cols-2">
            <T path="pages.contacts.name" label="Поле «Имя»" />
            <T path="pages.contacts.phone" label="Поле «Телефон»" />
            <T path="pages.contacts.message" label="Поле «Комментарий»" />
            <T path="pages.contacts.submit" label="Кнопка отправки" />
          </div>
        </Block>

        <div className="flex items-center gap-3">
          <h2 className="text-[15px] font-bold text-slate-900">Разделы на странице «Контакты»</h2>
          <Button onClick={() => setBlocks((prev) => [...prev, empty()])}>+ Добавить раздел</Button>
        </div>

        {blocks.map((block, index) => (
          <Card key={block.id}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-500">Раздел {index + 1}</span>
              <div className="ml-auto flex gap-2">
                <IconButton title="Выше" onClick={() => move(index, -1)}>
                  ↑
                </IconButton>
                <IconButton title="Ниже" onClick={() => move(index, 1)}>
                  ↓
                </IconButton>
                <IconButton
                  title="Удалить"
                  danger
                  onClick={() => setBlocks((prev) => prev.filter((_, i) => i !== index))}
                >
                  ✕
                </IconButton>
              </div>
            </div>

            <Field
              label={`Заголовок (${locale.toUpperCase()})`}
              value={block.title[locale] ?? ""}
              onChange={(value) =>
                patch(index, (b) => ({ ...b, title: { ...b.title, [locale]: value } }))
              }
            />

            <StringList
              label={`Строки (${locale.toUpperCase()})`}
              values={block.items[locale] ?? []}
              onChange={(values) =>
                patch(index, (b) => ({ ...b, items: { ...b.items, [locale]: values } }))
              }
            />

            <label className="block max-w-[280px]">
              <span className="mb-1 block text-[13px] font-semibold text-slate-700">
                Как оформить строки
              </span>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14px]"
                value={block.link}
                onChange={(e) =>
                  patch(index, (b) => ({
                    ...b,
                    link: e.target.value as ContactsContent["blocks"][number]["link"],
                  }))
                }
              >
                {linkTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            {locales.some((l) => !(block.items[l] ?? []).length || !block.title[l]) && (
              <p className="text-[12px] text-amber-700">
                Заполните раздел на всех языках — переключайте RU / UZ / EN сверху.
              </p>
            )}
          </Card>
        ))}
      </PageShell>
    </ContentProvider>
  );
}
