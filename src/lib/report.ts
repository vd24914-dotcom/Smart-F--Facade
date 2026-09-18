import type { Lead, StatsContent } from "@/content/store";
import { escapeHtml } from "@/lib/telegram";

const DAY = 24 * 60 * 60 * 1000;

const sources: Record<string, string> = {
  modal: "Всплывающее окно",
  calc: "Форма расчёта",
  cta: "Блок заявки",
  contacts: "Страница контактов",
  footer: "Обратный звонок",
  form: "Форма",
  telegram: "Телеграм-бот",
};

function when(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  });
}

const since = (items: Lead[], ms: number) =>
  items.filter((lead) => Date.now() - new Date(lead.createdAt).getTime() < ms).length;

const cell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

/* ─────────────── заявки ─────────────── */

/** Последние заявки одним сообщением: имя, телефон, что просили. */
export function leadsText(items: Lead[], limit = 10) {
  if (!items.length) return "<b>Заявок пока нет.</b>";

  const head =
    `<b>Последние заявки</b>\n` +
    `Всего: ${items.length} · новых: ${items.filter((l) => l.status === "new").length} · ` +
    `за сутки: ${since(items, DAY)} · за 7 дней: ${since(items, 7 * DAY)}`;

  const rows = items.slice(0, limit).map((lead, index) => {
    const detail = (label: string) =>
      lead.details?.find((item) => item.label.startsWith(label))?.value ?? "";
    const extras = [detail("Тип объекта"), detail("Площадь"), detail("Необходимый материал")]
      .filter(Boolean)
      .join(" · ");
    const note = lead.details?.length ? "" : (lead.message ?? "").replace(/\s+/g, " ").slice(0, 120);

    return [
      `${index + 1}. <b>${escapeHtml(lead.name || "без имени")}</b> — ${escapeHtml(lead.phone)}`,
      `    ${when(lead.createdAt)} · ${escapeHtml(sources[lead.source] ?? lead.source)}${
        lead.status === "new" ? " · новая" : ""
      }`,
      extras ? `    ${escapeHtml(extras)}` : "",
      note ? `    ${escapeHtml(note)}` : "",
      lead.fileUrl ? `    файл: ${escapeHtml(lead.fileUrl)}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  });

  const tail = items.length > limit ? `\nОстальные — в файле ниже.` : "";
  return `${head}\n\n${rows.join("\n\n")}${tail}`;
}

/** Все заявки таблицей — те же колонки, что и выгрузка из админки. */
export function leadsCsv(items: Lead[]) {
  const head = [
    "Дата", "Имя", "Телефон", "Компания", "Тип объекта", "Площадь", "Материал",
    "Стадия", "Комментарий", "Файл", "Откуда", "Страница", "Язык", "Статус",
  ];
  const detail = (lead: Lead, label: string) =>
    lead.details?.find((item) => item.label.startsWith(label))?.value ?? "";

  const rows = items.map((lead) => [
    when(lead.createdAt),
    lead.name,
    lead.phone,
    detail(lead, "Компания"),
    detail(lead, "Тип объекта"),
    detail(lead, "Площадь"),
    detail(lead, "Необходимый материал"),
    detail(lead, "Стадия"),
    lead.details?.length ? "" : (lead.message ?? "").replace(/\s+/g, " "),
    lead.fileUrl ?? "",
    sources[lead.source] ?? lead.source,
    lead.page,
    lead.locale,
    lead.status === "new" ? "новая" : "обработана",
  ]);

  return [head, ...rows].map((row) => row.map(cell).join(";")).join("\n");
}

/* ─────────────── посещаемость ─────────────── */

function sumDays(days: StatsContent["days"], count: number) {
  const keys = Object.keys(days).sort().reverse().slice(0, count);
  return keys.reduce(
    (acc, key) => ({
      views: acc.views + (days[key]?.views ?? 0),
      visits: acc.visits + (days[key]?.visits ?? 0),
    }),
    { views: 0, visits: 0 }
  );
}

export function statsText(stats: StatsContent, leads: Lead[]) {
  const days = stats.days ?? {};
  const today = days[new Date().toISOString().slice(0, 10)] ?? { views: 0, visits: 0 };
  const week = sumDays(days, 7);
  const month = sumDays(days, 30);

  if (!Object.keys(days).length) {
    return "<b>Статистика сайта</b>\n\nДанных пока нет — счётчик начинает считать с первого посетителя.";
  }

  return [
    "<b>Статистика сайта</b>",
    "",
    `Сегодня: ${today.visits} посетителей, ${today.views} просмотров`,
    `За 7 дней: ${week.visits} посетителей, ${week.views} просмотров`,
    `За 30 дней: ${month.visits} посетителей, ${month.views} просмотров`,
    "",
    `Заявки: всего ${leads.length} · за 7 дней ${since(leads, 7 * DAY)} · новых ${
      leads.filter((l) => l.status === "new").length
    }`,
  ].join("\n");
}

export function statsCsv(stats: StatsContent) {
  const days = stats.days ?? {};
  const rows = Object.keys(days)
    .sort()
    .reverse()
    .map((key) => [key, days[key]?.visits ?? 0, days[key]?.views ?? 0]);
  return [["Дата", "Посетители", "Просмотры"], ...rows].map((row) => row.map(cell).join(";")).join("\n");
}

/* ─────────────── проверка сайта ─────────────── */

export type Health = { ok: boolean; text: string };

/**
 * Открывает сайт на трёх языках и смотрит, что он отвечает.
 *
 * Важно понимать границу: проверка живёт на самом сайте. Если сайт лежит
 * целиком, это сообщение просто не придёт — молчание и есть сигнал.
 */
export async function healthReport(
  origin: string,
  opts: { storageOk: boolean; leads: Lead[]; stats: StatsContent; hours?: number }
): Promise<Health> {
  const window = Math.max(1, opts.hours ?? 12);
  const problems: string[] = [];
  const lines: string[] = [];

  if (origin) {
    const pages = ["/ru", "/uz", "/en"];
    for (const path of pages) {
      const started = Date.now();
      try {
        const res = await fetch(`${origin}${path}`, { cache: "no-store" });
        const ms = Date.now() - started;
        if (res.ok) {
          lines.push(`✅ ${path} — ${res.status}, ${ms} мс`);
        } else {
          lines.push(`❌ ${path} — ${res.status}`);
          problems.push(`${path} отвечает ${res.status}`);
        }
      } catch {
        lines.push(`❌ ${path} — нет ответа`);
        problems.push(`${path} не открывается`);
      }
    }
  } else {
    problems.push("в админке не заполнен адрес сайта");
  }

  if (opts.storageOk) {
    lines.push("✅ хранилище доступно — правки из админки сохраняются");
  } else {
    lines.push("❌ хранилище недоступно — админка не сможет сохранить правки");
    problems.push("не работает хранилище");
  }

  const fresh = since(opts.leads, window * 60 * 60 * 1000);
  const today = (opts.stats.days ?? {})[new Date().toISOString().slice(0, 10)] ?? {
    views: 0,
    visits: 0,
  };

  const head = problems.length
    ? `⚠️ <b>Есть проблемы</b>\n${problems.map((p) => `— ${p}`).join("\n")}`
    : "✅ <b>Сайт работает</b>";

  return {
    ok: problems.length === 0,
    text: [
      head,
      "",
      lines.join("\n"),
      "",
      `За ${window} ч: ${fresh} заявок. Сегодня: ${today.visits} посетителей, ${today.views} просмотров.`,
      `Проверено: ${new Date().toLocaleString("ru-RU", { timeZone: "Asia/Tashkent" })} (Ташкент)`,
    ].join("\n"),
  };
}
