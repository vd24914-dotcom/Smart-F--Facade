"use client";

import type { SiteContent, TextsContent } from "@/content/store";
import {
  Block,
  ContentProvider,
  IconTextRows,
  ImageRows,
  Img,
  PageShell,
  StatRows,
  T,
  TitleTextRows,
  useContentState,
  useSaveAll,
} from "./page-kit";
import { NumberField, SaveBar } from "./ui";

/** Главная страница: каждый блок правится целиком — текст и его картинки рядом. */
export default function HomeEditor({ texts, site }: { texts: TextsContent; site: SiteContent }) {
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
        title="Главная страница"
        lead="Блоки идут в том же порядке, что и на сайте."
        preview=""
        bar={<SaveBar state={state} message={message} onSave={save} />}
      >
        <Block title="1. Первый экран" hint="Фотографии фона, заголовок и кнопки под ним.">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="mb-3 text-[13px] font-bold text-slate-700">Фон первого экрана</p>
            <ImageRows
              values={store.site.hero?.slides ?? []}
              onChange={(slides) =>
                store.api.setSite((prev) => ({
                  ...prev,
                  hero: { ...prev.hero, slides },
                }))
              }
              itemLabel="Фотография"
              addLabel="Добавить фотографию"
              aspect={16 / 9}
              hint="Одна фотография — просто фон. Две и больше — сменяют друг друга по кругу."
              imageHint="Широкое фото от 1920 px. После выбора файла можно вырезать нужный кусок кадра"
            />
            {(store.site.hero?.slides ?? []).length > 1 && (
              <div className="mt-3">
                <NumberField
                  label="Менять каждые, секунд"
                  min={3}
                  max={60}
                  value={store.site.hero?.seconds ?? 7}
                  onChange={(seconds) =>
                    store.api.setSite((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, seconds },
                    }))
                  }
                  hint="От 3 до 60. Меньше трёх — кадр не успевают разглядеть."
                />
              </div>
            )}
          </div>

          <T path="hero.title" label="Заголовок (каждая строка — отдельно)" kind="list" />
          <T path="hero.lead" label="Текст под заголовком" kind="area" rows={3} />
          <div className="grid gap-4 sm:grid-cols-2">
            <T path="hero.phonesLabel" label="Подпись над телефонами" />
            <T path="hero.contact" label="Кнопка «Связаться»" />
            <T path="hero.whatsapp" label="Кнопка WhatsApp" />
            <T path="hero.instagram" label="Кнопка Instagram" />
          </div>
        </Block>

        <Block title="2. Блок «О нас»" hint="Фото, текст и три подписи с иконками.">
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
          title="3. Блок «Материалы»"
          hint="Главный блок для рынка Узбекистана. Пункт меню «Материалы» ведёт сюда."
        >
          <T path="materials.title" label="Заголовок" />
          <T path="materials.lead" label="Текст под заголовком" kind="area" rows={2} />
          <TitleTextRows
            path="materials.items"
            itemLabel="Материал"
            addLabel="Добавить материал"
            hint="АКП, клинкерная плитка, керамогранит, HPL, подсистемы, крепёж и всё, что добавите."
            iconGroup="materials"
            iconLabel="Иконка или фото материала"
            iconHint="SVG — иконка в кружке. JPG или PNG — фотография во всю ширину карточки. Без картинки останется номер."
          />
        </Block>

        <Block title="4. Блок «Как мы работаем»" hint="Шаги нумеруются автоматически, по порядку.">
          <T path="process.title" label="Заголовок" />
          <T path="process.lead" label="Текст под заголовком" kind="area" rows={2} />
          <TitleTextRows
            path="process.steps"
            itemLabel="Шаг"
            addLabel="Добавить шаг"
            iconGroup="process"
            iconLabel="Иконка шага"
            iconHint="SVG или PNG на прозрачном фоне. Без иконки останется номер шага."
          />
        </Block>

        <Block
          title="5. Блок «Опыт группы компаний»"
          hint="Цифры по Кыргызстану показываются здесь — с честной подписью, а не на первом экране."
        >
          <T path="group.title" label="Заголовок" />
          <T path="group.lead" label="Строка выделением" kind="area" rows={2} />
          <T path="group.text" label="Текст" kind="area" rows={4} />
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="mb-3 text-[13px] font-bold text-slate-700">Цифры</p>
            <StatRows path="group.stats" />
          </div>
        </Block>

        <Block
          title="6. Заголовок блока «Наши преимущества»"
          hint="Сами преимущества с иконками — в разделе «О нас», они показываются и там, и здесь."
        >
          <T path="pages.about.advantagesTitle" label="Заголовок" />
          <T path="pages.about.advantagesLead" label="Текст под заголовком" kind="area" rows={2} />
        </Block>

        <Block title="7. Блок «Документы и сертификаты»">
          <T path="docs.title" label="Заголовок" />
          <T path="docs.lead" label="Текст под заголовком" kind="area" rows={2} />
          <TitleTextRows
            path="docs.items"
            itemLabel="Документ"
            addLabel="Добавить документ"
            iconGroup="docs"
            iconLabel="Иконка или фото документа"
            iconHint="Скан или фото сертификата подойдёт. SVG — иконка в кружке. JPG или PNG — фотография во всю ширину карточки. Без картинки останется номер."
            fileGroup="docs"
            fileLabel="Файл документа"
            fileHint="PDF, DOC, XLS, PNG или JPG — до 20 МБ. На сайте под карточкой появится ссылка «Смотреть документ»."
          />
          <T path="docs.open" label="Подпись ссылки на файл" />
          <T path="docs.note" label="Примечание под блоком" kind="area" rows={2} />
        </Block>

        <Block
          title="8. Заголовок блока «Проекты»"
          hint="Сами объекты — в разделе «Проекты». Пока объектов нет, блок на сайте не показывается."
        >
          <T path="projects.title" label="Заголовок" />
          <T path="projects.lead" label="Текст под заголовком" kind="area" rows={2} />
          <T path="projects.all" label="Кнопка «Посмотреть все»" />
        </Block>

        <Block
          title="9. Заголовки блока «До / После»"
          hint="Сами пары фото — в разделе «До / После». Пока пар нет, блок на сайте не показывается."
        >
          <T path="beforeAfter.title" label="Заголовок" />
          <T path="beforeAfter.lead" label="Текст под заголовком" kind="area" rows={2} />
          <div className="grid gap-4 sm:grid-cols-2">
            <T path="beforeAfter.before" label="Подпись «До»" />
            <T path="beforeAfter.after" label="Подпись «После»" />
          </div>
        </Block>

        <Block title="10. Блок «Оставить заявку»" hint="Последний блок перед подвалом.">
          <Img imgKey="cta" label="Фон блока" hint="Широкое фото" aspect={21 / 9} />
          <T path="cta.title" label="Заголовок (каждая строка — отдельно)" kind="list" />
          <T path="cta.text" label="Текст (каждая строка — отдельно)" kind="list" />
          <T path="cta.button" label="Кнопка" />
        </Block>

        <Block
          title="11. Форма «Получить расчёт стоимости»"
          hint="Одна и та же форма во всплывающем окне, в блоке заявки и на странице «Контакты»."
        >
          <T path="calc.button" label="Надпись на кнопке" />
          <T path="calc.title" label="Заголовок формы" kind="area" rows={2} />
          <T path="calc.lead" label="Текст под заголовком" kind="area" rows={2} />

          <div className="grid gap-4 sm:grid-cols-2">
            <T path="calc.name" label="Поле «Имя»" />
            <T path="calc.company" label="Поле «Компания»" />
            <T path="calc.phone" label="Поле «Телефон»" />
            <T path="calc.area" label="Поле «Площадь фасада»" />
            <T path="calc.objectType" label="Поле «Тип объекта»" />
            <T path="calc.material" label="Поле «Необходимый материал»" />
            <T path="calc.stage" label="Поле «Стадия проекта»" />
            <T path="calc.file" label="Поле «Чертёж»" />
          </div>

          <T path="calc.objectTypes" label="Варианты: тип объекта" kind="list" />
          <T path="calc.materials" label="Варианты: материал" kind="list" />
          <T path="calc.stages" label="Варианты: стадия проекта" kind="list" />

          <div className="grid gap-4 sm:grid-cols-2">
            <T path="calc.submit" label="Кнопка отправки" />
            <T path="calc.choose" label="Подсказка «Выберите»" />
            <T path="calc.fileChoose" label="Кнопка выбора файла" />
            <T path="calc.fileHint" label="Подсказка про формат файла" />
            <T path="calc.done" label="Сообщение после отправки" />
            <T path="calc.error" label="Сообщение об ошибке" />
            <T path="calc.required" label="Сообщение «заполните имя и телефон»" />
            <T path="calc.telegram" label="Кнопка Telegram" />
          </div>
        </Block>
      </PageShell>
    </ContentProvider>
  );
}
