"use client";

import { useMemo, useState } from "react";
import type { IntegrationsContent, Lead } from "@/content/store";
import { Button, Card, Field, useSave } from "./ui";

type Filter = "all" | "new" | "done";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const sources: Record<string, string> = {
  modal: "Модальное окно",
  contacts: "Страница контактов",
  form: "Форма",
};

export default function LeadsEditor({
  initial,
  integrations,
}: {
  initial: Lead[];
  integrations: IntegrationsContent;
}) {
  const [items, setItems] = useState<Lead[]>(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [telegram, setTelegram] = useState(integrations.telegram);

  const leadsSave = useSave("leads");
  const integrationsSave = useSave("integrations");

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((lead) => lead.status === filter)),
    [items, filter]
  );

  const counters = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const since = (ms: number) => items.filter((l) => now - new Date(l.createdAt).getTime() < ms).length;
    return {
      total: items.length,
      fresh: items.filter((l) => l.status === "new").length,
      today: since(day),
      week: since(7 * day),
    };
  }, [items]);

  const persist = (next: Lead[]) => {
    setItems(next);
    leadsSave.save({ items: next });
  };

  const setStatus = (id: string, status: Lead["status"]) =>
    persist(items.map((lead) => (lead.id === id ? { ...lead, status } : lead)));

  const remove = (id: string) => persist(items.filter((lead) => lead.id !== id));

  const exportCsv = () => {
    const head = ["Дата", "Имя", "Телефон", "Комментарий", "Откуда", "Страница", "Язык", "Статус"];
    const rows = items.map((l) => [
      formatDate(l.createdAt),
      l.name,
      l.phone,
      l.message.replace(/\s+/g, " "),
      sources[l.source] ?? l.source,
      l.page,
      l.locale,
      l.status === "new" ? "новая" : "обработана",
    ]);
    const csv = [head, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `zayavki-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-[20px] font-extrabold text-slate-900">Заявки с сайта</h1>
        <p className="mt-1 text-[14px] text-slate-500">
          Сюда попадают все отправленные формы — из модального окна и со страницы контактов.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Всего заявок", value: counters.total },
          { label: "Новых", value: counters.fresh },
          { label: "За сегодня", value: counters.today },
          { label: "За 7 дней", value: counters.week },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-[26px] font-extrabold text-slate-900">{item.value}</div>
            <div className="text-[13px] text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {([
          ["all", "Все"],
          ["new", "Новые"],
          ["done", "Обработанные"],
        ] as [Filter, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${
              filter === key ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {leadsSave.message && <span className="text-[12px] text-slate-500">{leadsSave.message}</span>}
          <Button variant="ghost" onClick={exportCsv}>
            Скачать CSV
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-[14px] text-slate-500">
          Заявок пока нет.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((lead) => (
            <div
              key={lead.id}
              className={`rounded-xl border bg-white p-4 ${
                lead.status === "new" ? "border-slate-900/20" : "border-slate-200 opacity-70"
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="text-[15px] font-bold text-slate-900">{lead.name}</span>
                <a
                  href={`tel:${lead.phone.replace(/[^+\d]/g, "")}`}
                  className="text-[15px] font-semibold text-slate-700 underline-offset-2 hover:underline"
                >
                  {lead.phone}
                </a>
                <span className="text-[12px] text-slate-400">{formatDate(lead.createdAt)}</span>
                {lead.status === "new" && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold uppercase text-emerald-700">
                    новая
                  </span>
                )}
              </div>

              {lead.message && (
                <p className="mt-2 whitespace-pre-wrap text-[14px] leading-[22px] text-slate-700">
                  {lead.message}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-400">
                <span>{sources[lead.source] ?? lead.source}</span>
                {lead.page && <span>{lead.page}</span>}
                <span>{lead.locale.toUpperCase()}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {lead.status === "new" ? (
                  <Button variant="ghost" onClick={() => setStatus(lead.id, "done")}>
                    Отметить обработанной
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => setStatus(lead.id, "new")}>
                    Вернуть в новые
                  </Button>
                )}
                <Button variant="danger" onClick={() => remove(lead.id)}>
                  Удалить
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card title="Телеграм-бот (уведомления о заявках)">
        <p className="text-[13px] text-slate-500">
          Создайте бота через @BotFather, добавьте его в чат и вставьте токен и ID чата. После включения
          каждая заявка будет приходить сообщением.
        </p>
        <Field
          label="Токен бота"
          value={telegram.token}
          onChange={(token) => setTelegram({ ...telegram, token })}
          hint="Вид: 1234567890:AA..."
        />
        <Field
          label="ID чата"
          value={telegram.chatId}
          onChange={(chatId) => setTelegram({ ...telegram, chatId })}
          hint="Свой ID можно узнать у @userinfobot"
        />
        <label className="flex items-center gap-2 text-[14px] text-slate-700">
          <input
            type="checkbox"
            checked={telegram.enabled}
            onChange={(e) => setTelegram({ ...telegram, enabled: e.target.checked })}
          />
          Присылать заявки в телеграм
        </label>
        <div className="flex items-center gap-3">
          <Button onClick={() => integrationsSave.save({ telegram })}>
            {integrationsSave.state === "saving" ? "Сохраняю…" : "Сохранить настройки"}
          </Button>
          {integrationsSave.message && (
            <span className="text-[13px] text-slate-500">{integrationsSave.message}</span>
          )}
        </div>
      </Card>
    </div>
  );
}
