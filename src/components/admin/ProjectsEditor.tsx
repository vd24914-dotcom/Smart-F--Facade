"use client";

import { useState } from "react";
import type { Project, SiteContent, TextsContent } from "@/content/store";
import type { Dictionary } from "@/i18n/dictionaries";
import { buildings, materials, type Building, type Material } from "@/data/portfolio";
import { Block, ContentProvider, PageShell, T, useContentState, useSaveAll } from "./page-kit";
import { Area, Button, Card, Field, ImageField, SaveBar } from "./ui";

const emptyText = {
  title: "",
  text: "",
  description: "",
  material: "",
  area: "",
  colors: "",
  seoTitle: "",
  seoDescription: "",
  imageAlt: "",
};

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9а-яё\s-]/gi, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 40) || `project-${Date.now()}`
  );
}

export default function ProjectsEditor({
  initial,
  labels,
  texts,
  site,
}: {
  initial: Project[];
  labels: Dictionary;
  texts: TextsContent;
  site: SiteContent;
}) {
  const [projects, setProjects] = useState<Project[]>(initial);
  const [openId, setOpenId] = useState<string | null>(initial[0]?.id ?? null);
  const store = useContentState(texts, site);
  const locale = store.locale;
  const { state, message, saveAll } = useSaveAll();

  const save = () =>
    saveAll([
      { file: "projects", data: projects },
      { file: "texts", data: store.texts },
    ]);

  const patch = (id: string, updater: (project: Project) => Project) =>
    setProjects((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));

  const setText = (id: string, key: keyof typeof emptyText, value: string) =>
    patch(id, (p) => ({ ...p, texts: { ...p.texts, [locale]: { ...p.texts[locale], [key]: value } } }));

  const move = (index: number, delta: number) =>
    setProjects((prev) => {
      const next = [...prev];
      const j = index + delta;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });

  function addProject() {
    const id = `project-${Date.now()}`;
    const project: Project = {
      id,
      image: "",
      building: "office",
      materials: ["acp"],
      texts: { ru: { ...emptyText }, uz: { ...emptyText }, en: { ...emptyText } },
    };
    setProjects((prev) => [project, ...prev]);
    setOpenId(id);
  }

  return (
    <ContentProvider api={store.api}>
      <PageShell
        title="Проекты"
        lead="Фото, описание и SEO каждого объекта — в одной карточке."
        preview="/projects"
        bar={<SaveBar state={state} message={message} onSave={save} />}
      >
        <Block title="Заголовки раздела" hint="Текст блока на главной и подписи фильтров на странице.">
          <div className="grid gap-4 sm:grid-cols-2">
            <T path="projects.title" label="Заголовок блока на главной" />
            <T path="projects.all" label="Кнопка «Посмотреть все»" />
          </div>
          <T path="projects.lead" label="Текст под заголовком" kind="area" rows={2} />
          <T path="pages.projects.heading" label="Заголовок страницы «Проекты»" />

          <div className="grid gap-4 sm:grid-cols-2">
            <T path="pages.projects.buildingLabel" label="Фильтр: тип здания" />
            <T path="pages.projects.materialLabel" label="Фильтр: тип материала" />
            <T path="pages.projects.all" label="Вариант «Все» в фильтре" />
            <T path="pages.projects.open" label="Кнопка на карточке" />
            <T path="pages.projects.empty" label="Если ничего не найдено" />
            <T path="pages.project.back" label="Ссылка «Все проекты»" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <T path="pages.project.material" label="Характеристика: материал" />
            <T path="pages.project.area" label="Характеристика: площадь" />
            <T path="pages.project.colors" label="Характеристика: цвета" />
          </div>
        </Block>

        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[15px] font-bold text-slate-900">Объекты</h2>
          <Button onClick={addProject}>+ Добавить проект</Button>
          <span className="text-[13px] text-slate-500">Всего: {projects.length}</span>
        </div>

        <div className="space-y-3">
          {projects.map((project, index) => {
            const text = project.texts[locale];
            const open = openId === project.id;

            return (
              <div key={project.id} className="rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center gap-3 p-3">
                  <div className="flex h-[52px] w-[70px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {project.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={project.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[11px] text-slate-400">нет фото</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : project.id)}
                    className="flex-1 text-left"
                  >
                    <span className="block text-[14px] font-semibold text-slate-900">
                      {text.title || "Без названия"}
                    </span>
                    <span className="block text-[12px] text-slate-500">
                      {labels.pages.projects.buildings[project.building]} ·{" "}
                      {project.materials.map((m) => labels.pages.projects.materials[m]).join(", ")} · /{project.id}
                    </span>
                  </button>

                  <Button variant="ghost" onClick={() => move(index, -1)}>
                    ↑
                  </Button>
                  <Button variant="ghost" onClick={() => move(index, 1)}>
                    ↓
                  </Button>
                  <Button variant="ghost" onClick={() => setOpenId(open ? null : project.id)}>
                    {open ? "Свернуть" : "Изменить"}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (confirm(`Удалить проект «${text.title || project.id}»?`)) {
                        setProjects((prev) => prev.filter((p) => p.id !== project.id));
                      }
                    }}
                  >
                    Удалить
                  </Button>
                </div>

                {open && (
                  <div className="space-y-4 border-t border-slate-200 p-4">
                    <ImageField
                      label="Фотография объекта"
                      value={project.image}
                      onChange={(value) => patch(project.id, (p) => ({ ...p, image: value }))}
                      hint="Показывается в списке, на главной и в шапке страницы объекта"
                      aspect={4 / 3}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-[13px] font-semibold text-slate-700">Тип здания</span>
                        <select
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14px]"
                          value={project.building}
                          onChange={(e) =>
                            patch(project.id, (p) => ({ ...p, building: e.target.value as Building }))
                          }
                        >
                          {buildings.map((b) => (
                            <option key={b} value={b}>
                              {labels.pages.projects.buildings[b]}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div>
                        <span className="mb-1 block text-[13px] font-semibold text-slate-700">Материалы</span>
                        <div className="flex flex-wrap gap-3 pt-1">
                          {materials.map((m) => (
                            <label key={m} className="flex items-center gap-1.5 text-[13px] text-slate-700">
                              <input
                                type="checkbox"
                                checked={project.materials.includes(m)}
                                onChange={(e) =>
                                  patch(project.id, (p) => ({
                                    ...p,
                                    materials: e.target.checked
                                      ? ([...p.materials, m] as Material[])
                                      : p.materials.filter((x) => x !== m),
                                  }))
                                }
                              />
                              {labels.pages.projects.materials[m]}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Field
                      label="Адрес страницы (латиницей, без пробелов)"
                      value={project.id}
                      onChange={(value) => {
                        const id = slugify(value);
                        patch(project.id, (p) => ({ ...p, id }));
                        setOpenId(id);
                      }}
                      hint={`Ссылка: /ru/projects/${project.id}`}
                    />

                    <Field label="Название" value={text.title} onChange={(v) => setText(project.id, "title", v)} />
                    <Area
                      label="Короткое описание (карточка в списке)"
                      value={text.text}
                      onChange={(v) => setText(project.id, "text", v)}
                    />
                    <Area
                      label="Полное описание (страница объекта)"
                      rows={6}
                      value={text.description}
                      onChange={(v) => setText(project.id, "description", v)}
                    />

                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field
                        label="Материал"
                        value={text.material}
                        onChange={(v) => setText(project.id, "material", v)}
                      />
                      <Field label="Площадь" value={text.area} onChange={(v) => setText(project.id, "area", v)} />
                      <Field label="Цвета" value={text.colors} onChange={(v) => setText(project.id, "colors", v)} />
                    </div>
                    <p className="text-[12px] text-slate-500">
                      Несколько значений в характеристике разделяйте точкой с запятой — они встанут в столбик.
                    </p>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                      <p className="mb-1 text-[13px] font-bold text-slate-700">
                        SEO страницы объекта ({locale.toUpperCase()})
                      </p>
                      <p className="mb-3 text-[12px] text-slate-500">
                        Можно не заполнять: тогда в поиске покажется название объекта и короткое
                        описание.
                      </p>
                      <div className="space-y-3">
                        <Field
                          label="Заголовок в поиске"
                          value={text.seoTitle ?? ""}
                          onChange={(v) => setText(project.id, "seoTitle", v)}
                          hint={`Сейчас: ${text.seoTitle || text.title || "название объекта"}`}
                        />
                        <Area
                          label="Описание в поиске"
                          rows={2}
                          value={text.seoDescription ?? ""}
                          onChange={(v) => setText(project.id, "seoDescription", v)}
                        />
                        <Field
                          label="Подпись фотографии (alt)"
                          value={text.imageAlt ?? ""}
                          onChange={(v) => setText(project.id, "imageAlt", v)}
                          hint="Помогает поиску по картинкам и читается голосовыми программами"
                        />
                      </div>
                    </div>

                    <a
                      href={`/${locale}/projects/${project.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block rounded-lg border border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:border-slate-500"
                    >
                      Открыть страницу объекта ↗
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {projects.length === 0 && (
          <Card>
            <p className="text-[14px] text-slate-500">Проектов пока нет. Нажмите «Добавить проект».</p>
          </Card>
        )}
      </PageShell>
    </ContentProvider>
  );
}
