import type { IntegrationsContent } from "@/content/store";

type Telegram = IntegrationsContent["telegram"];

const API = "https://api.telegram.org";

/** Экранирование для parse_mode: "HTML". */
export const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Кому реально отправляем: основной чат плюс включённые получатели, без повторов. */
export function telegramTargets(telegram: Telegram) {
  const seen = new Set<string>();
  const list: { chatId: string; label: string }[] = [];

  const add = (chatId: string, label: string) => {
    const id = (chatId ?? "").trim();
    if (!id || seen.has(id)) return;
    seen.add(id);
    list.push({ chatId: id, label: label || id });
  };

  add(telegram.chatId, "Основной чат");
  for (const person of telegram.recipients ?? []) {
    if (person.enabled) add(person.chatId, person.label);
  }
  return list;
}

export type SendResult = { chatId: string; label: string; ok: boolean; error?: string };

/** Одно сообщение одному чату. Ошибку возвращаем текстом — она видна в админке. */
export async function sendTelegram(
  token: string,
  chatId: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  if (!token || !chatId) return { ok: false, error: "Не заполнен токен или ID чата" };

  try {
    const res = await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
    if (res.ok && json?.ok) return { ok: true };
    return { ok: false, error: json?.description || `Телеграм ответил ${res.status}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Нет связи с телеграмом" };
  }
}

/** Рассылка всем получателям. */
export async function sendTelegramAll(telegram: Telegram, text: string): Promise<SendResult[]> {
  const targets = telegramTargets(telegram);
  return Promise.all(
    targets.map(async (target) => ({
      ...target,
      ...(await sendTelegram(telegram.token, target.chatId, text)),
    }))
  );
}

/** Проверка токена: вернёт имя бота или причину отказа. */
export async function telegramBotInfo(token: string) {
  if (!token) return { ok: false as const, error: "Токен не заполнен" };
  try {
    const res = await fetch(`${API}/bot${token}/getMe`);
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; description?: string; result?: { username?: string; first_name?: string } }
      | null;
    if (!res.ok || !json?.ok) return { ok: false as const, error: json?.description || "Токен не подошёл" };
    return {
      ok: true as const,
      username: json.result?.username ?? "",
      name: json.result?.first_name ?? "",
    };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Нет связи с телеграмом" };
  }
}

export type TelegramChat = { chatId: string; title: string; type: string };

/**
 * Кто недавно писал боту. Отсюда берутся ID чатов: человек отправляет боту
 * «Привет» или добавляет его в группу, а в админке чат появляется в списке.
 */
export async function telegramKnownChats(token: string): Promise<TelegramChat[]> {
  if (!token) return [];
  try {
    const res = await fetch(`${API}/bot${token}/getUpdates?limit=100`);
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; result?: Array<Record<string, { chat?: Record<string, unknown> }>> }
      | null;
    if (!res.ok || !json?.ok || !Array.isArray(json.result)) return [];

    const map = new Map<string, TelegramChat>();
    for (const update of json.result) {
      for (const value of Object.values(update ?? {})) {
        const chat = (value as { chat?: Record<string, unknown> })?.chat;
        if (!chat || chat.id === undefined) continue;
        const chatId = String(chat.id);
        const title =
          [chat.first_name, chat.last_name].filter(Boolean).join(" ") ||
          String(chat.title ?? "") ||
          String(chat.username ?? "") ||
          chatId;
        map.set(chatId, { chatId, title, type: String(chat.type ?? "") });
      }
    }
    return [...map.values()];
  } catch {
    return [];
  }
}
