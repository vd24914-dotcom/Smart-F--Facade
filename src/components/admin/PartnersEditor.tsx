"use client";

import { useState } from "react";
import type { PartnersContent, SiteContent, TextsContent } from "@/content/store";
import { Block, ContentProvider, PageShell, T, useContentState, useSaveAll } from "./page-kit";
import { Button, IconButton, ImageField, SaveBar } from "./ui";

type ListKey = keyof PartnersContent;

const lists: { key: ListKey; title: string; titlePath: string; hint: string }[] = [
  {
    key: "representatives",
    title: "Официальные представители",
    titlePath: "representatives.title",
    hint: "Логотипы заводов-производителей. Заголовок блока меняется здесь же.",
  },
  {
    key: "partners",
    title: "Партнёры",
    titlePath: "partners.title",
    hint: "Логотипы компаний-партнёров.",
  },
];

export default function PartnersEditor({
  initial,
  texts,
  site,
}: {
  initial: PartnersContent;
  texts: TextsContent;
  site: SiteContent;
}) {
  const [data, setData] = useState<PartnersContent>(initial);
  const store = useContentState(texts, site);
  const { state, message, saveAll } = useSaveAll();

  const update = (key: ListKey, values: string[]) => setData((prev) => ({ ...prev, [key]: values }));

  const move = (key: ListKey, index: number, delta: number) => {
    const next = [...data[key]];
    const j = index + delta;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    update(key, next);
  };

  const save = () =>
    saveAll([
      { file: "partners", data },
      { file: "texts", data: store.texts, base: store.base.texts },
    ]);

  return (
    <ContentProvider api={store.api}>
      <PageShell
        title="Партнёры"
        lead="Логотипы серые по умолчанию и становятся цветными при наведении — так задумано."
        preview="/partners"
        bar={<SaveBar state={state} message={message} onSave={save} />}
      >
        <Block title="Заголовок страницы">
          <T path="pages.partners.heading" label="Заголовок страницы «Партнёры»" />
        </Block>

        {lists.map((list) => (
          <Block key={list.key} title={`${list.title} — ${data[list.key].length} шт.`} hint={list.hint}>
            <T path={list.titlePath} label="Заголовок блока на сайте" />

            <div className="grid gap-3 sm:grid-cols-2">
              {data[list.key].map((logo, index) => (
                <div key={`${logo}-${index}`} className="rounded-xl border border-slate-200 p-3">
                  <ImageField
                    label={`Логотип ${index + 1}`}
                    hint="SVG лучше всего: остаётся чётким на любом экране"
                    value={logo}
                    onChange={(value) =>
                      update(
                        list.key,
                        data[list.key].map((x, i) => (i === index ? value : x))
                      )
                    }
                  />
                  <div className="mt-2 flex gap-2">
                    <IconButton title="Левее" onClick={() => move(list.key, index, -1)}>
                      ←
                    </IconButton>
                    <IconButton title="Правее" onClick={() => move(list.key, index, 1)}>
                      →
                    </IconButton>
                    <IconButton
                      title="Удалить"
                      danger
                      onClick={() =>
                        update(
                          list.key,
                          data[list.key].filter((_, i) => i !== index)
                        )
                      }
                    >
                      ✕
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="ghost" onClick={() => update(list.key, [...data[list.key], ""])}>
              + Добавить логотип
            </Button>
          </Block>
        ))}
      </PageShell>
    </ContentProvider>
  );
}
