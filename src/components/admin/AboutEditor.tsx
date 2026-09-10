"use client";

import type { SiteContent, TextsContent } from "@/content/store";
import {
  AdvantageRows,
  Block,
  ContentProvider,
  Img,
  PageShell,
  T,
  useContentState,
  useSaveAll,
} from "./page-kit";
import { SaveBar } from "./ui";

/** Страница «О нас»: текст компании с фото и преимущества с иконками. */
export default function AboutEditor({ texts, site }: { texts: TextsContent; site: SiteContent }) {
  const store = useContentState(texts, site);
  const { state, message, saveAll } = useSaveAll();

  const save = () =>
    saveAll([
      { file: "texts", data: store.texts },
      { file: "site", data: store.site },
    ]);

  return (
    <ContentProvider api={store.api}>
      <PageShell
        title="Страница «О нас»"
        lead="Фон шапки этой страницы меняется в разделе «Общее»."
        preview="/about"
        bar={<SaveBar state={state} message={message} onSave={save} />}
      >
        <Block title="О компании" hint="Фото и текст в верхней части страницы.">
          <Img
            imgKey="aboutCompany"
            label="Фото компании"
            hint="Вертикальное фото, примерно 640×720"
            aspect={640 / 720}
          />
          <T path="pages.about.heading" label="Заголовок страницы" />
          <T path="pages.about.subtitle" label="Подзаголовок" />
          <T path="pages.about.text" label="Текст о компании" kind="area" rows={6} />
        </Block>

        <Block
          title="Преимущества"
          hint="Показываются и на этой странице, и на главной. У каждого пункта своя иконка."
        >
          <T path="pages.about.advantagesTitle" label="Заголовок блока" />
          <T path="pages.about.advantagesLead" label="Текст под заголовком" kind="area" rows={2} />
          <AdvantageRows hint="Иконка, заголовок и текст одного преимущества — в одной карточке." />
        </Block>
      </PageShell>
    </ContentProvider>
  );
}
