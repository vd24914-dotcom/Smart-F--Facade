import { NextResponse } from "next/server";
import { addLead, getIntegrations } from "@/content/store";

/** Простая защита от спама: не больше 5 заявок за 10 минут с одного IP. */
const recent = new Map<string, number[]>();
const WINDOW = 10 * 60 * 1000;
const LIMIT = 5;

function tooMany(ip: string) {
  const now = Date.now();
  const list = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW);
  list.push(now);
  recent.set(ip, list);
  return list.length > LIMIT;
}

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/** Возвращает true, если сообщение действительно ушло в телеграм. */
async function notifyTelegram(text: string) {
  const { telegram } = getIntegrations();
  if (!telegram.enabled || !telegram.token || !telegram.chatId) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${telegram.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: telegram.chatId, text, parse_mode: "HTML" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "local";

  if (tooMany(ip)) {
    return NextResponse.json({ error: "Слишком много заявок. Попробуйте позже." }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  // ловушка для ботов: скрытое поле должно оставаться пустым
  if (clean(body.company, 100)) return NextResponse.json({ ok: true });

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 60);

  if (!name || !phone) {
    return NextResponse.json({ error: "Укажите имя и телефон" }, { status: 400 });
  }

  const draft = {
    name,
    phone,
    message: clean(body.message, 2000),
    source: clean(body.source, 60) || "form",
    page: clean(body.page, 200),
    locale: clean(body.locale, 5) || "ru",
  };

  // на хостинге без записи файлов заявка может только уйти в телеграм — это нормально,
  // но если не сработало ни то, ни другое, честно сообщаем об ошибке
  let saved = true;
  try {
    addLead(draft);
  } catch (error) {
    saved = false;
    console.error("Заявку не удалось записать в файл:", error);
  }

  const sent = await notifyTelegram(
    `<b>Новая заявка — Smart Facade</b>\nИмя: ${draft.name}\nТелефон: ${draft.phone}` +
      (draft.message ? `\nКомментарий: ${draft.message}` : "") +
      `\nСтраница: ${draft.page || "—"}`
  );

  if (!saved && !sent) {
    return NextResponse.json(
      { error: "Не удалось отправить заявку. Позвоните нам, пожалуйста." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
