import { NextResponse } from "next/server";
import { addLead, getIntegrations, getLeads, getSeo, getStats } from "@/content/store";
import { storageIsWritable } from "@/content/storage";
import { siteOrigin } from "@/data/seo";
import { adminMenu, botLocale, botTexts, clientMenu, parseContactMessage } from "@/lib/bot";
import { healthReport, leadsCsv, leadsText, statsCsv, statsText } from "@/lib/report";
import {
  answerCallback,
  escapeHtml,
  keyboard,
  sendTelegram,
  sendTelegramAll,
  sendTelegramDocument,
  telegramTargets,
  type Button,
} from "@/lib/telegram";
import { normalizePhone } from "@/lib/validate";

export const dynamic = "force-dynamic";

type Chat = { id: number };
type From = { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string };
type Contact = { phone_number: string; first_name?: string; last_name?: string };
type Message = {
  chat: Chat;
  from?: From;
  text?: string;
  contact?: Contact;
  document?: { file_name?: string };
};
type Update = {
  message?: Message;
  callback_query?: { id: string; data?: string; from?: From; message?: { chat: Chat } };
};

/** Не больше трёх заявок с одного чата в час — от случайных повторов. */
const recent = new Map<string, number[]>();
function tooOften(chatId: string) {
  const now = Date.now();
  const list = (recent.get(chatId) ?? []).filter((time) => now - time < 60 * 60 * 1000);
  recent.set(chatId, list);
  if (list.length >= 3) return true;
  list.push(now);
  return false;
}

async function origin() {
  const seo = await getSeo();
  const fromSeo = siteOrigin(seo.siteUrl);
  if (fromSeo) return fromSeo;
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? `https://${host}` : "";
}

export async function POST(request: Request) {
  const { telegram } = await getIntegrations();

  // бот не подключён — молча соглашаемся, чтобы телеграм не копил очередь
  if (!telegram.token || !telegram.secret) return NextResponse.json({ ok: true });
  if (request.headers.get("x-telegram-bot-api-secret-token") !== telegram.secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const update = (await request.json().catch(() => null)) as Update | null;
  if (!update) return NextResponse.json({ ok: true });

  try {
    await handle(update, telegram);
  } catch {
    // ответ телеграму всегда 200: иначе он будет слать это же обновление снова
  }
  return NextResponse.json({ ok: true });
}

type Telegram = Awaited<ReturnType<typeof getIntegrations>>["telegram"];

async function handle(update: Update, telegram: Telegram) {
  const token = telegram.token;
  const site = await origin();

  const isAdmin = (chatId: string) =>
    telegramTargets(telegram).some((target) => target.chatId === chatId);

  const menu = (chatId: string, locale: ReturnType<typeof botLocale>): Button[][] =>
    isAdmin(chatId) ? adminMenu(locale, site) : clientMenu(locale, site);

  /* ─── нажали кнопку ─── */
  if (update.callback_query) {
    const query = update.callback_query;
    const chatId = String(query.message?.chat.id ?? query.from?.id ?? "");
    const locale = botLocale(query.from?.language_code);
    const t = botTexts[locale];
    await answerCallback(token, query.id);
    if (!chatId) return;

    if (query.data === "lead") {
      await sendTelegram(token, chatId, t.leadPrompt, {
        reply_markup: {
          keyboard: [[{ text: t.contactButton, request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
      return;
    }

    // рабочие кнопки — только для своих
    if (["leads", "stats", "health"].includes(query.data ?? "") && !isAdmin(chatId)) {
      await sendTelegram(token, chatId, t.ask, { reply_markup: keyboard(menu(chatId, locale)) });
      return;
    }

    if (query.data === "leads") {
      const { items } = await getLeads();
      await sendTelegram(token, chatId, leadsText(items));
      if (items.length) {
        const stamp = new Date().toISOString().slice(0, 10);
        await sendTelegramDocument(token, chatId, `zayavki-${stamp}.csv`, leadsCsv(items), "Все заявки таблицей");
      }
      return;
    }

    if (query.data === "stats") {
      const [stats, leads] = await Promise.all([getStats(), getLeads()]);
      await sendTelegram(token, chatId, statsText(stats, leads.items));
      if (Object.keys(stats.days ?? {}).length) {
        const stamp = new Date().toISOString().slice(0, 10);
        await sendTelegramDocument(
          token,
          chatId,
          `poseshaemost-${stamp}.csv`,
          statsCsv(stats),
          "Посещаемость по дням"
        );
      }
      return;
    }

    if (query.data === "health") {
      const [leads, stats] = await Promise.all([getLeads(), getStats()]);
      const report = await healthReport(site, {
        storageOk: storageIsWritable(),
        leads: leads.items,
        stats,
      });
      await sendTelegram(token, chatId, report.text);
      return;
    }

    await sendTelegram(token, chatId, t.ask, { reply_markup: keyboard(menu(chatId, locale)) });
    return;
  }

  /* ─── написали сообщение ─── */
  const message = update.message;
  if (!message) return;

  const chatId = String(message.chat.id);
  const locale = botLocale(message.from?.language_code);
  const t = botTexts[locale];
  const text = (message.text ?? "").trim();

  // прислали контакт кнопкой
  if (message.contact?.phone_number) {
    const name =
      [message.contact.first_name, message.contact.last_name].filter(Boolean).join(" ") ||
      [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" ") ||
      "Клиент из телеграма";
    await saveBotLead({ telegram, chatId, name, phone: message.contact.phone_number, locale, from: message.from });
    await sendTelegram(token, chatId, t.thanks, { reply_markup: { remove_keyboard: true } });
    await sendTelegram(token, chatId, t.ask, { reply_markup: keyboard(menu(chatId, locale)) });
    return;
  }

  if (/^\/start|^\/menu|^\/help/.test(text)) {
    const welcome = telegram.welcome.trim() || t.welcome;
    await sendTelegram(token, chatId, `${welcome}\n\n${t.ask}`, {
      reply_markup: keyboard(menu(chatId, locale)),
    });
    return;
  }

  // написали имя и телефон обычным сообщением
  const parsed = text ? parseContactMessage(text) : null;
  if (parsed) {
    const name =
      parsed.name || [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" ") || "Клиент из телеграма";
    const saved = await saveBotLead({
      telegram,
      chatId,
      name,
      phone: parsed.phone,
      locale,
      from: message.from,
      note: text,
    });
    await sendTelegram(token, chatId, saved ? t.thanks : t.tooMany, {
      reply_markup: keyboard(menu(chatId, locale)),
    });
    return;
  }

  // всё остальное: показываем меню и объясняем, что нужен телефон
  await sendTelegram(token, chatId, text ? t.needPhone : t.ask, {
    reply_markup: keyboard(menu(chatId, locale)),
  });
}

/** Сохраняет заявку из бота и сообщает о ней всем получателям. */
async function saveBotLead(input: {
  telegram: Telegram;
  chatId: string;
  name: string;
  phone: string;
  locale: string;
  from?: From;
  note?: string;
}) {
  if (tooOften(input.chatId)) return false;

  const username = input.from?.username ? `@${input.from.username}` : "";
  const details = [
    { label: "Телеграм", value: username || `id ${input.chatId}` },
    ...(input.note ? [{ label: "Сообщение", value: input.note.slice(0, 500) }] : []),
  ];

  const lead = await addLead({
    name: input.name.slice(0, 80),
    phone: normalizePhone(input.phone),
    message: input.note?.slice(0, 500) ?? "",
    source: "telegram",
    page: "telegram",
    locale: input.locale,
    details,
  });

  const lines = [
    "🆕 <b>Заявка из телеграм-бота</b>",
    `Имя: ${escapeHtml(lead.name)}`,
    `Телефон: ${escapeHtml(lead.phone)}`,
    username ? `Телеграм: ${escapeHtml(username)}` : `Чат: ${escapeHtml(input.chatId)}`,
    ...(input.note ? [`Сообщение: ${escapeHtml(input.note.slice(0, 300))}`] : []),
  ];
  await sendTelegramAll(input.telegram, lines.join("\n"));
  return true;
}
