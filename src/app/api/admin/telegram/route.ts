import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { getIntegrations, getLeads, getSeo, getStats, saveTelegram } from "@/content/store";
import { storageIsWritable } from "@/content/storage";
import { siteOrigin } from "@/data/seo";
import { healthReport } from "@/lib/report";
import {
  deleteTelegramWebhook,
  sendTelegram,
  sendTelegramAll,
  setTelegramWebhook,
  telegramBotInfo,
  telegramKnownChats,
  telegramWebhookInfo,
} from "@/lib/telegram";

type Body = {
  action?: "check" | "test" | "connect" | "disconnect" | "webhook" | "health" | "save";
  /** Токен из поля в админке — чтобы проверить его ещё до сохранения. */
  token?: string;
  /** Проверить один чат; без него — разослать всем получателям. */
  chatId?: string;
  label?: string;
  /** Поля формы при сохранении — пароль вебхука сюда не входит и не затирается. */
  settings?: Record<string, unknown>;
};

const TEST_TEXT =
  "<b>Smart Facade</b>\nПроверка связи: бот подключён, заявки с сайта будут приходить сюда.";

async function origin() {
  const seo = await getSeo();
  const fromSeo = siteOrigin(seo.siteUrl);
  if (fromSeo) return fromSeo;
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? `https://${host}` : "";
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const stored = await getIntegrations();

  // сохранение формы: пароль вебхука остаётся прежним, что бы ни пришло с клиента
  if (body.action === "save") {
    const s = body.settings ?? {};
    const telegram = await saveTelegram({
      enabled: Boolean(s.enabled),
      token: String(s.token ?? "").trim(),
      chatId: String(s.chatId ?? "").trim(),
      recipients: Array.isArray(s.recipients) ? (s.recipients as never) : [],
      botEnabled: Boolean(s.botEnabled),
      welcome: String(s.welcome ?? ""),
      healthEnabled: s.healthEnabled !== false,
    });
    revalidateTag("content");
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, botEnabled: telegram.botEnabled });
  }

  const token = (body.token ?? "").trim() || stored.telegram.token;

  if (!token) {
    return NextResponse.json({ error: "Сначала вставьте токен бота" }, { status: 400 });
  }

  if (body.action === "check") {
    const bot = await telegramBotInfo(token);
    if (!bot.ok) return NextResponse.json({ error: bot.error }, { status: 400 });
    const chats = await telegramKnownChats(token);
    // токен наружу не отдаём — только имя бота и найденные чаты
    return NextResponse.json({ ok: true, bot: { username: bot.username, name: bot.name }, chats });
  }

  if (body.action === "test") {
    const chatId = (body.chatId ?? "").trim();

    if (chatId) {
      const result = await sendTelegram(token, chatId, TEST_TEXT);
      return NextResponse.json({
        ok: result.ok,
        results: [{ chatId, label: body.label || chatId, ...result }],
      });
    }

    const results = await sendTelegramAll({ ...stored.telegram, token }, TEST_TEXT);
    if (!results.length) {
      return NextResponse.json({ error: "Некому отправлять: добавьте хотя бы один чат" }, { status: 400 });
    }
    return NextResponse.json({ ok: results.some((item) => item.ok), results });
  }

  /* ─── бот отвечает клиентам ─── */

  if (body.action === "webhook") {
    const info = await telegramWebhookInfo(token);
    const bot = await telegramBotInfo(token);
    return NextResponse.json({
      ok: true,
      webhook: info,
      expected: `${await origin()}/api/telegram/webhook`,
      link: bot.ok && bot.username ? `https://t.me/${bot.username}` : "",
    });
  }

  if (body.action === "connect") {
    const site = await origin();
    if (!site) {
      return NextResponse.json(
        { error: "Сначала заполните «Адрес сайта» в разделе SEO" },
        { status: 400 }
      );
    }

    // свой пароль для запросов от телеграма — чтобы бота нельзя было подделать
    const secret =
      stored.telegram.secret ||
      Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

    const result = await setTelegramWebhook(token, `${site}/api/telegram/webhook`, secret);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

    await saveTelegram({ token, secret, botEnabled: true });
    revalidateTag("content");
    revalidatePath("/", "layout");

    const bot = await telegramBotInfo(token);
    return NextResponse.json({
      ok: true,
      link: bot.ok && bot.username ? `https://t.me/${bot.username}` : "",
    });
  }

  if (body.action === "disconnect") {
    await deleteTelegramWebhook(token);
    await saveTelegram({ botEnabled: false });
    revalidateTag("content");
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  }

  if (body.action === "health") {
    const [leads, stats] = await Promise.all([getLeads(), getStats()]);
    const report = await healthReport(await origin(), {
      storageOk: storageIsWritable(),
      leads: leads.items,
      stats,
    });
    const results = await sendTelegramAll({ ...stored.telegram, token }, report.text);
    return NextResponse.json({ ok: report.ok, report: report.text, results });
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
