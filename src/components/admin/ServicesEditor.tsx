"use client";

import type { SiteContent, TextsContent } from "@/content/store";
import {
  Block,
  ContentProvider,
  PageShell,
  T,
  TitleTextRows,
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
        lead="Показывается на странице «Услуги»."
        preview="/services"
        bar={<SaveBar state={state} message={message} onSave={save} />}
      >
        <Block title="Заголовки блока">
          <T path="services.title" label="Заголовок блока" />
          <T path="services.lead" label="Текст под заголовком" kind="area" rows={2} />
        </Block>

        <Block
          title="Услуги"
          hint="Одна услуга — одна карточка: что делаем и что клиент получает на выходе."
        >
          <TitleTextRows
            path="services.list"
            itemLabel="Услуга"
            addLabel="Добавить услугу"
            iconGroup="services"
            iconLabel="Иконка услуги"
            iconHint="SVG — иконка в кружке. JPG или PNG — фотография во всю ширину карточки. Без картинки останется номер."
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
