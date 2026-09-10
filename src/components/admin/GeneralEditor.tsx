"use client";

import type { SiteContent, TextsContent } from "@/content/store";
import { Block, ContentProvider, Img, PageShell, T, useContentState, useSaveAll } from "./page-kit";
import { Field, SaveBar, StringList } from "./ui";

/** Шапка, подвал, логотипы и общие данные компании — всё, что видно на каждой странице. */
export default function GeneralEditor({
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
      { file: "texts", data: store.texts },
      { file: "site", data: store.site },
    ]);

  const setSite = store.setSite;

  return (
    <ContentProvider api={store.api}>
      <PageShell
        title="Общее"
        lead="Меню, логотипы, подвал и контактные данные — показываются на всех страницах сайта."
        preview=""
        bar={<SaveBar state={state} message={message} onSave={save} />}
      >
        <Block title="Шапка сайта" hint="Логотип и подписи пунктов меню.">
          <Img imgKey="logoHeader" label="Логотип в шапке" hint="SVG или PNG, высота ~40 px" />
          <div className="grid gap-4 sm:grid-cols-2">
            <T path="nav.home" label="Пункт меню: Главная" />
            <T path="nav.about" label="Пункт меню: О нас" />
            <T path="nav.services" label="Пункт меню: Услуги" />
            <T path="nav.projects" label="Пункт меню: Проекты" />
            <T path="nav.partners" label="Пункт меню: Партнёры" />
            <T path="nav.contacts" label="Ссылка «Контакты» в подвале" />
            <T path="nav.contactButton" label="Кнопка, открывающая форму" />
          </div>
        </Block>

        <Block
          title="Шапка внутренних страниц"
          hint="Одно фото на фоне заголовка страниц «О нас», «Услуги», «Проекты», «Партнёры» и «Контакты»."
        >
          <Img imgKey="pageHero" label="Фон шапки внутренних страниц" aspect={21 / 9} />
        </Block>

        <Block title="Данные компании" hint="Используются в подвале, в кнопках связи и в заявках.">
          <Field
            label="Название компании"
            value={store.site.name}
            onChange={(value) => setSite((prev) => ({ ...prev, name: value }))}
          />
          <Field
            label="Почта"
            value={store.site.email}
            onChange={(value) => setSite((prev) => ({ ...prev, email: value }))}
          />
          <StringList
            label="Телефоны (первый показывается на главном экране)"
            values={store.site.phones}
            onChange={(values) => setSite((prev) => ({ ...prev, phones: values }))}
            placeholder="+996 (___) __-__-__"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="WhatsApp"
              value={store.site.social.whatsapp}
              onChange={(value) =>
                setSite((prev) => ({ ...prev, social: { ...prev.social, whatsapp: value } }))
              }
            />
            <Field
              label="Instagram"
              value={store.site.social.instagram}
              onChange={(value) =>
                setSite((prev) => ({ ...prev, social: { ...prev.social, instagram: value } }))
              }
            />
            <Field
              label="Facebook"
              value={store.site.social.facebook}
              onChange={(value) =>
                setSite((prev) => ({ ...prev, social: { ...prev.social, facebook: value } }))
              }
            />
          </div>
        </Block>

        <Block title="Подвал" hint="Нижняя часть каждой страницы: логотип, ссылки, форма обратного звонка.">
          <Img imgKey="logoFooter" label="Логотип в подвале" hint="PNG или SVG" />
          <Img imgKey="footer" label="Фон подвала" hint="Широкое фото" aspect={21 / 9} />
          <div className="grid gap-4 sm:grid-cols-2">
            <T path="footer.companyTitle" label="Заголовок «Компания»" />
            <T path="footer.contactsTitle" label="Заголовок «Контакты»" />
            <T path="footer.socialTitle" label="Заголовок «Мы в соцсетях»" />
            <T path="footer.address" label="Адрес" />
          </div>
          <T path="footer.links" label="Ссылки в подвале" kind="list" />
          <T path="footer.copyright" label="Копирайт" />

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <p className="mb-3 text-[13px] font-bold text-slate-700">Форма обратного звонка</p>
            <div className="space-y-3">
              <T path="footer.callbackTitle" label="Заголовок" />
              <T path="footer.callbackText" label="Текст под заголовком" kind="area" rows={2} />
              <T path="footer.callbackPlaceholder" label="Подсказка в поле телефона" />
              <div className="grid gap-4 sm:grid-cols-2">
                <T path="footer.callbackDone" label="Сообщение после отправки" />
                <T path="footer.callbackError" label="Сообщение об ошибке" />
              </div>
            </div>
          </div>
        </Block>
      </PageShell>
    </ContentProvider>
  );
}
