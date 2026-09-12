"use client";

import { useState } from "react";
import type { BeforeAfterContent, BeforeAfterItem, SiteContent, TextsContent } from "@/content/store";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { Block, ContentProvider, PageShell, T, useContentState, useSaveAll } from "./page-kit";
import { Button, Card, ConfirmButton, Field, ImageField, SaveBar } from "./ui";

const empty = (): BeforeAfterItem => ({
  id: `ba-${Date.now()}`,
  before: "",
  after: "",
  title: { ru: "", uz: "", en: "" },
  text: { ru: "", uz: "", en: "" },
});

export default function BeforeAfterEditor({
  initial,
  texts,
  site,
}: {
  initial: BeforeAfterContent;
  texts: TextsContent;
  site: SiteContent;
}) {
  const [items, setItems] = useState<BeforeAfterItem[]>(initial.items);
  const store = useContentState(texts, site);
  const { state, message, saveAll } = useSaveAll();

  const save = () =>
    saveAll([
      { file: "beforeafter", data: { items } },
      { file: "texts", data: store.texts, base: store.base.texts },
    ]);

  const patch = (id: string, next: Partial<BeforeAfterItem>) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...next } : item)));

  const patchLocale = (
    id: string,
    field: "title" | "text",
    locale: Locale,
    value: string
  ) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: { ...item[field], [locale]: value } } : item
      )
    );

  const move = (index: number, delta: number) =>
    setItems((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  return (
    <ContentProvider api={store.api}>
      <PageShell
        title="До / После"
        lead="Блок появляется на главной, только если у пары загружены обе фотографии."
        preview=""
        bar={<SaveBar state={state} message={message} onSave={save} />}
      >
        <Block title="Заголовки блока" hint="Показываются над парами фотографий на главной.">
          <T path="beforeAfter.title" label="Заголовок" />
          <T path="beforeAfter.lead" label="Текст под заголовком" kind="area" rows={2} />
          <div className="grid gap-4 sm:grid-cols-2">
            <T path="beforeAfter.before" label="Подпись «До»" />
            <T path="beforeAfter.after" label="Подпись «После»" />
          </div>
        </Block>

        {items.map((item, index) => (
            <Card key={item.id} title={item.title.ru || `Объект ${index + 1}`}>
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageField
                  label="Фото «До»"
                  value={item.before}
                  aspect={16 / 10}
                  onChange={(value) => patch(item.id, { before: value })}
                />
                <ImageField
                  label="Фото «После»"
                  value={item.after}
                  aspect={16 / 10}
                  onChange={(value) => patch(item.id, { after: value })}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {locales.map((locale) => (
                  <Field
                    key={locale}
                    label={`Название (${localeNames[locale]})`}
                    value={item.title[locale] ?? ""}
                    onChange={(value) => patchLocale(item.id, "title", locale, value)}
                  />
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {locales.map((locale) => (
                  <Field
                    key={locale}
                    label={`Описание (${localeNames[locale]})`}
                    value={item.text[locale] ?? ""}
                    onChange={(value) => patchLocale(item.id, "text", locale, value)}
                  />
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => move(index, -1)}>
                  ↑ Выше
                </Button>
                <Button variant="ghost" onClick={() => move(index, 1)}>
                  ↓ Ниже
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                >
                  Удалить пару
                </Button>
              </div>
          </Card>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" onClick={() => setItems((prev) => [...prev, empty()])}>
            + Добавить пару «до / после»
          </Button>
          {items.length > 0 && (
            <ConfirmButton confirmLabel="Точно убрать все?" onConfirm={() => setItems([])}>
              Очистить список
            </ConfirmButton>
          )}
        </div>
      </PageShell>
    </ContentProvider>
  );
}
