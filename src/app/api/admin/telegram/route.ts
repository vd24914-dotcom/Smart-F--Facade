import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getIntegrations } from "@/content/store";
import { sendTelegram, sendTelegramAll, telegramBotInfo, telegramKnownChats } from "@/lib/telegram";

type Body = {
  action?: "check" | "test";
  /** Токен из поля в админке — чтобы проверить его ещё до сохранения. */
  token?: string;
  /** Проверить один чат; без него — разослать всем получателям. */
  chatId?: string;
  label?: string;
};

const TEST_TEXT =
  "<b>Smart Facade</b>\nПроверка связи: бот подключён, заявки с сайта будут приходить сюда.";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Нужен вход" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const stored = await getIntegrations();
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

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
