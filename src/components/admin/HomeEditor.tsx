"use client";

import type { SiteContent, TextsContent } from "@/content/store";
import {
  Block,
  ContentProvider,
  IconTextRows,
  Img,
  PageShell,
  StatRows,
  T,
  useContentState,
  useSaveAll,
} from "./page-kit";
import { SaveBar } from "./ui";

/** Главная страница: каждый блок правится целиком — текст и его картинки рядом. */
export default function HomeEditor({ texts, site }: { texts: TextsContent; site: SiteContent }) {
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
        title="Главная страница"
        lead="Блоки идут в том же порядке, что и на сайте."
        preview=""
        bar={<SaveBar state={state} message={message} onSave={save} />}
      >
        <Block title="1. Первый экран" hint="Большое фото, заголовок и цифры под ним.">
          <Img
            imgKey="hero"
            label="Фон первого экрана"
            hint="Широкое фото от 1920 px. После выбора файла можно вырезать нужный кусок кадра"
            aspect={16 / 9}
          />
          <T path="hero.title" label="Заголовок (каждая строка — отдельно)" kind="list" />
          <T path="hero.lead" label="Текст под заголовком" kind="area" rows={3} />
          <div className="grid gap-4 sm:grid-cols-2">
            <T path="hero.phonesLabel" label="Подпись над телефонами" />
            <T path="hero.contact" label="Кнопка «Связаться»" />
            <T path="hero.whatsapp" label="Кнопка WhatsApp" />
            <T path="hero.instagram" label="Кнопка Instagram" />
          </div>
        </Block>

        <Block title="2. Цифры на первом экране" hint="Показываются карточкой поверх фото.">
          <StatRows />
        </Block>

        <Block title="3. Блок «О нас»" hint="Фото, текст и три подписи с иконками.">
          <Img imgKey="aboutPhoto" label="Фото в блоке" hint="Вертикальное фото" aspect={4 / 5} />
          <T path="about.title" label="Надзаголовок" />
          <T path="about.subtitle" label="Заголовок" />
          <T path="about.text" label="Текст" kind="area" />
          <T path="about.more" label="Кнопка «Подробнее о компании»" />

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="mb-3 text-[13px] font-bold text-slate-700">
              Направления работы: иконка и подпись
            </p>
            <IconTextRows
              group="specs"
              path="about.specs"
              itemLabel="Направление"
              addLabel="Добавить направление"
              hint="Например «фасады», «интерьеры», «мебель». Иконка и подпись добавляются и удаляются вместе."
            />
          </div>
        </Block>

        <Block
          title="4. Заголовок блока «Наши преимущества»"
          hint="Сами преимущества с иконками — в разделе «О нас», они показываются и там, и здесь."
        >
          <T path="pages.about.advantagesTitle" label="Заголовок" />
          <T path="pages.about.advantagesLead" label="Текст под заголовком" kind="area" rows={2} />
        </Block>

        <Block title="5. Заголовок блока «Услуги»" hint="Сами услуги с иконками — в разделе «Услуги».">
          <T path="services.title" label="Заголовок" />
          <T path="services.lead" label="Текст под заголовком" kind="area" rows={2} />
        </Block>

        <Block title="6. Заголовок блока «Проекты»" hint="Сами объекты — в разделе «Проекты».">
          <T path="projects.title" label="Заголовок" />
          <T path="projects.lead" label="Текст под заголовком" kind="area" rows={2} />
          <T path="projects.all" label="Кнопка «Посмотреть все»" />
        </Block>

        <Block title="7. Заголовки блока «До / После»" hint="Сами пары фото — в разделе «До / После».">
          <T path="beforeAfter.title" label="Заголовок" />
          <T path="beforeAfter.lead" label="Текст под заголовком" kind="area" rows={2} />
          <div className="grid gap-4 sm:grid-cols-2">
            <T path="beforeAfter.before" label="Подпись «До»" />
            <T path="beforeAfter.after" label="Подпись «После»" />
          </div>
        </Block>

        <Block title="8. Блок «Оставить заявку»" hint="Последний блок перед подвалом.">
          <Img imgKey="cta" label="Фон блока" hint="Широкое фото" aspect={21 / 9} />
          <T path="cta.title" label="Заголовок (каждая строка — отдельно)" kind="list" />
          <T path="cta.text" label="Текст (каждая строка — отдельно)" kind="list" />
          <T path="cta.button" label="Кнопка" />
        </Block>
      </PageShell>
    </ContentProvider>
  );
}
