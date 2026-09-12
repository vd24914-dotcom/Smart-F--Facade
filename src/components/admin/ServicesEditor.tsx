"use client";

import type { SiteContent, TextsContent } from "@/content/store";
import {
  Block,
  ContentProvider,
  IconTextRows,
  PageShell,
  T,
  useContentState,
  useSaveAll,
} from "./page-kit";
import { SaveBar } from "./ui";

/** Страница «Услуги»: названия услуг и их иконки в одном месте. */
export default function ServicesEditor({
  texts,
  site,
}: {
  texts: TextsContent;
  site: SiteContent;
}) {
  const store = useContentState(texts, site);
  const { state, message, saveAll } = useSaveAll();

  const save = () =>
    saveAll([
      { file: "texts", data: store.texts, base: store.base.texts },
      { file: "site", data: store.site, base: store.base.site },
    ]);

  return (
    <ContentProvider api={store.api}>
      <PageShell
        title="Услуги"
        lead="Этот блок показывается и на главной, и на странице «Услуги»."
        preview="/services"
        bar={<SaveBar state={state} message={message} onSave={save} />}
      >
        <Block title="Заголовки блока">
          <T path="services.title" label="Заголовок на главной" />
          <T path="services.lead" label="Текст под заголовком" kind="area" rows={2} />
        </Block>

        <Block title="Услуги: иконка и название">
          <IconTextRows
            group="services"
            path="services.items"
            itemLabel="Услуга"
            addLabel="Добавить услугу"
            hint="Иконки рисуются на сайте штрихом — лучше всего подходит простой контурный SVG."
          />
        </Block>

        <Block title="Страница «Услуги»">
          <T path="pages.services.heading" label="Заголовок страницы" />
          <T path="pages.services.intro" label="Вступительный текст" kind="area" rows={5} />
        </Block>
      </PageShell>
    </ContentProvider>
  );
}
