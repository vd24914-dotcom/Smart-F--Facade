"use client";

import { useState } from "react";
import type { SeoContent } from "@/content/store";
import { seoPages, type SeoPage, siteOrigin } from "@/data/seo";
import { localeNames, type Locale } from "@/i18n/config";
import { useSaveAll } from "./page-kit";
import { Area, Button, Card, Field, ImageField, LocaleTabs, SaveBar } from "./ui";

const pageLabels: Record<SeoPage, { title: string; path: string }> = {
  home: { title: "Главная", path: "" },
  about: { title: "О нас", path: "/about" },
  services: { title: "Услуги", path: "/services" },
  projects: { title: "Проекты", path: "/projects" },
  partners: { title: "Партнёры", path: "/partners" },
  contacts: { title: "Контакты", path: "/contacts" },
};

/** Цветная полоска-подсказка: сколько символов и не длинно ли для поиска. */
function Counter({ value, max, soft }: { value: string; max: number; soft: number }) {
  const length = value.trim().length;
  const tone =
    length === 0 ? "text-slate-400" : length > max ? "text-red-600" : length > soft ? "text-amber-600" : "text-green-700";
  const note =
    length === 0
      ? "не заполнено — возьмём заголовок со страницы"
      : length > max
        ? "длинно, поиск обрежет"
        : "хорошая длина";

  return (
    <span className={`text-[12px] font-semibold ${tone}`}>
      {length} / {max} — {note}
    </span>
  );
}

export default function SeoEditor({ initial }: { initial: SeoContent }) {
  const [seo, setSeo] = useState<SeoContent>(initial);
  const [locale, setLocale] = useState<Locale>("ru");
  const { state, message, saveAll } = useSaveAll();

  const setMeta = (page: SeoPage, key: keyof SeoContent["pages"][SeoPage][Locale], value: string) =>
    setSeo((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        [page]: { ...prev.pages[page], [locale]: { ...prev.pages[page][locale], [key]: value } },
      },
    }));

  const site = siteOrigin(seo.siteUrl);
  // подсказываем сразу, а не после того, как поисковик увидит мусор
  const siteUrlBroken = Boolean(seo.siteUrl.trim()) && !site;

  return (
    <div className="pb-10">
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <h1 className="text-[20px] font-extrabold text-slate-900">SEO</h1>
        <LocaleTabs value={locale} onChange={setLocale} />
      </div>
      <p className="mb-4 text-[13px] text-slate-500">
        Как сайт выглядит в Google и Яндексе. Пустые поля не ломают сайт — тогда берётся заголовок
        самой страницы.
      </p>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <Card title="Основное">
            <Field
              label="Адрес сайта"
              value={seo.siteUrl}
              onChange={(value) => setSeo((prev) => ({ ...prev, siteUrl: value }))}
              hint={
                siteUrlBroken
                  ? "⚠ Это не похоже на адрес сайта — поле будет пропущено. Впишите вида smartfacade.uz"
                  : site
                    ? `Понято как ${site} — этот адрес пойдёт в карту сайта и ссылки в поиске`
                    : "Например smartfacade.uz — нужен для карты сайта и ссылок в поиске"
              }
            />
            <Field
              label="Название компании в заголовках"
              value={seo.brand}
              onChange={(value) => setSeo((prev) => ({ ...prev, brand: value }))}
              hint="Подставляется в конец: «Проекты — Smart Facade»"
            />
            <ImageField
              label="Картинка при отправке ссылки"
              hint="Показывается в WhatsApp, Telegram и соцсетях. Лучше 1200×630"
              aspect={1200 / 630}
              value={seo.shareImage}
              onChange={(value) => setSeo((prev) => ({ ...prev, shareImage: value }))}
            />
            <ImageField
              label="Иконка сайта (favicon)"
              hint="Квадратная картинка или SVG — значок во вкладке браузера"
              value={seo.favicon}
              onChange={(value) => setSeo((prev) => ({ ...prev, favicon: value }))}
            />

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={seo.indexing}
                onChange={(e) => setSeo((prev) => ({ ...prev, indexing: e.target.checked }))}
              />
              <span>
                <span className="block text-[13px] font-semibold text-slate-700">
                  Разрешить поисковикам показывать сайт
                </span>
                <span className="block text-[12px] text-slate-500">
                  Снимите галочку, пока сайт не готов — тогда он не попадёт в поиск.
                </span>
              </span>
            </label>
          </Card>

          <Card title="Подтверждение прав на сайт">
            <p className="text-[13px] text-slate-500">
              Коды из Google Search Console и Яндекс.Вебмастера. Вставьте только сам код, без тегов.
            </p>
            <Field
              label="Google Search Console"
              value={seo.verification.google}
              onChange={(value) =>
                setSeo((prev) => ({ ...prev, verification: { ...prev.verification, google: value } }))
              }
            />
            <Field
              label="Яндекс.Вебмастер"
              value={seo.verification.yandex}
              onChange={(value) =>
                setSeo((prev) => ({ ...prev, verification: { ...prev.verification, yandex: value } }))
              }
            />
          </Card>

          <Card title="Счётчики посещаемости">
            <p className="text-[13px] text-slate-500">
              Подключаются только если поле заполнено. Свой простой счётчик на «Обзоре» работает
              всегда.
            </p>
            <Field
              label="Google Analytics"
              value={seo.analytics.googleId}
              onChange={(value) =>
                setSeo((prev) => ({ ...prev, analytics: { ...prev.analytics, googleId: value } }))
              }
              hint="Идентификатор вида G-XXXXXXX"
            />
            <Field
              label="Яндекс.Метрика"
              value={seo.analytics.yandexId}
              onChange={(value) =>
                setSeo((prev) => ({ ...prev, analytics: { ...prev.analytics, yandexId: value } }))
              }
              hint="Номер счётчика, только цифры"
            />
          </Card>

          <Card title="Служебные файлы">
            <p className="text-[13px] leading-[20px] text-slate-500">
              Карта сайта и robots.txt собираются сами из этих настроек и списка проектов — ничего
              загружать не нужно.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:border-slate-500"
              >
                Открыть sitemap.xml ↗
              </a>
              <a
                href="/robots.txt"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:border-slate-500"
              >
                Открыть robots.txt ↗
              </a>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title={`Страницы сайта — ${localeNames[locale]}`}>
            <p className="text-[13px] text-slate-500">
              Заголовок — это синяя строка в поиске, описание — серый текст под ней.
            </p>

            {seoPages.map((page) => {
              const meta = seo.pages[page][locale];
              const label = pageLabels[page];

              return (
                <div key={page} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-bold text-slate-700">{label.title}</span>
                    <span className="text-[12px] text-slate-400">
                      /{locale}
                      {label.path}
                    </span>
                  </div>

                  {/* как это увидят в поиске */}
                  <div className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="truncate text-[12px] text-green-800">
                      {site || "адрес-сайта"}/{locale}
                      {label.path}
                    </p>
                    <p className="truncate text-[15px] font-semibold text-blue-800">
                      {meta.title || `${label.title} — ${seo.brand || "Smart Facade"}`}
                    </p>
                    <p className="line-clamp-2 text-[12px] leading-[17px] text-slate-600">
                      {meta.description || "Описание не заполнено — поиск подберёт текст сам."}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Field
                        label="Заголовок"
                        value={meta.title}
                        onChange={(value) => setMeta(page, "title", value)}
                      />
                      <div className="mt-1">
                        <Counter value={meta.title} max={60} soft={55} />
                      </div>
                    </div>

                    <div>
                      <Area
                        label="Описание"
                        rows={2}
                        value={meta.description}
                        onChange={(value) => setMeta(page, "description", value)}
                      />
                      <div className="mt-1">
                        <Counter value={meta.description} max={160} soft={150} />
                      </div>
                    </div>

                    <Field
                      label="Ключевые слова"
                      value={meta.keywords}
                      onChange={(value) => setMeta(page, "keywords", value)}
                      hint="Через запятую. Google их не учитывает, но некоторые каталоги — да"
                    />
                  </div>
                </div>
              );
            })}

            <p className="text-[12px] text-slate-500">
              SEO отдельных объектов заполняется в разделе «Проекты», внутри карточки объекта.
            </p>
          </Card>
        </div>
      </div>

      <SaveBar
        state={state}
        message={message}
        onSave={() => saveAll([{ file: "seo", data: seo }])}
      >
        <Button
          variant="ghost"
          onClick={() => {
            // копируем русские значения в пустые поля других языков
            setSeo((prev) => ({
              ...prev,
              pages: Object.fromEntries(
                seoPages.map((page) => {
                  const ru = prev.pages[page].ru;
                  const fill = (target: typeof ru) => ({
                    title: target.title || ru.title,
                    description: target.description || ru.description,
                    keywords: target.keywords || ru.keywords,
                  });
                  return [
                    page,
                    { ru, uz: fill(prev.pages[page].uz), en: fill(prev.pages[page].en) },
                  ];
                })
              ) as SeoContent["pages"],
            }));
          }}
        >
          Заполнить пустые UZ и EN русским текстом
        </Button>
      </SaveBar>
    </div>
  );
}
