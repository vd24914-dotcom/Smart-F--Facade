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

/**
 * Токен от BotFather выглядит так: 1234567890:AAH5f…
 * Номер бота, двоеточие, длинный ключ. Имя бота или пароль сюда не подходят,
 * а телеграм на них отвечает сухим «Not Found» — проверяем заранее.
 */
export function isTelegramToken(value: string) {
  return /^\d{5,16}:[A-Za-z0-9_-]{30,}$/.test((value ?? "").trim());
}

export const TOKEN_HINT =
  "Это не похоже на токен бота. Токен выдаёт @BotFather после команды /newbot, " +
  "он выглядит как 1234567890:AAH5f… — цифры, двоеточие и длинный ключ.";

/** Переводит сухие ответы телеграма на человеческий язык. */
export function explain(error: string | undefined, token: string) {
  const text = (error ?? "").trim();
  if (/not found/i.test(text)) {
    return isTelegramToken(token)
      ? "Телеграм не знает такого бота: токен отозван или бот удалён. Возьмите новый у @BotFather."
      : TOKEN_HINT;
  }
  if (/unauthorized/i.test(text)) return "Токен не подошёл — проверьте, что скопировали его целиком.";
  if (/chat not found/i.test(text))
    return "Чат не найден: человек ещё не написал боту «Привет», или ID указан с ошибкой.";
  if (/bot was blocked/i.test(text)) return "Человек заблокировал бота — он не получит сообщения.";
  if (/bot is not a member/i.test(text)) return "Бота нет в этой группе — добавьте его участником.";
  return text || "Неизвестная ошибка";
}

/** Кнопка меню: либо открывает ссылку, либо шлёт команду боту. */
export type Button = { text: string; url?: string; data?: string };

export function keyboard(rows: Button[][]) {
  return {
    inline_keyboard: rows.map((row) =>
      row.map((b) => (b.url ? { text: b.text, url: b.url } : { text: b.text, callback_data: b.data ?? "menu" }))
    ),
  };
}

/** Одно сообщение одному чату. Ошибку возвращаем текстом — она видна в админке. */
export async function sendTelegram(
  token: string,
  chatId: string,
  text: string,
  extra: Record<string, unknown> = {}
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
        disable_web_page_preview: true,
        ...extra,
      }),
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
    if (res.ok && json?.ok) return { ok: true };
    return { ok: false, error: explain(json?.description, token) || `Телеграм ответил ${res.status}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Нет связи с телеграмом" };
  }
}

/** Файл в чат — выгрузка заявок или посещаемости таблицей. */
export async function sendTelegramDocument(
  token: string,
  chatId: string,
  fileName: string,
  content: string,
  caption = ""
) {
  if (!token || !chatId) return { ok: false, error: "Не заполнен токен или ID чата" };
  try {
    const form = new FormData();
    form.append("chat_id", chatId);
    if (caption) {
      form.append("caption", caption);
      form.append("parse_mode", "HTML");
    }
    // «﻿» — чтобы Excel открыл кириллицу правильно
    form.append("document", new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" }), fileName);

    const res = await fetch(`${API}/bot${token}/sendDocument`, { method: "POST", body: form });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
    if (res.ok && json?.ok) return { ok: true };
    return { ok: false, error: explain(json?.description, token) || `Телеграм ответил ${res.status}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Нет связи с телеграмом" };
  }
}

/** Гасит «часики» на нажатой кнопке. */
export async function answerCallback(token: string, id: string, text = "") {
  try {
    await fetch(`${API}/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: id, text }),
    });
  } catch {
    // не критично: кнопка просто подольше подумает
  }
}

/** Подписывает сайт на сообщения бота. */
export async function setTelegramWebhook(token: string, url: string, secret: string) {
  try {
    const res = await fetch(`${API}/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        secret_token: secret,
        allowed_updates: ["message", "callback_query"],
        // не выбрасываем очередь: тот, кто уже нажал «старт», получит ответ
        drop_pending_updates: false,
      }),
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
    if (res.ok && json?.ok) return { ok: true as const };
    return { ok: false as const, error: explain(json?.description, token) || `Телеграм ответил ${res.status}` };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Нет связи с телеграмом" };
  }
}

export async function deleteTelegramWebhook(token: string) {
  try {
    await fetch(`${API}/bot${token}/deleteWebhook`, { method: "POST" });
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Нет связи с телеграмом" };
  }
}

export async function telegramWebhookInfo(token: string) {
  try {
    const res = await fetch(`${API}/bot${token}/getWebhookInfo`);
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; result?: { url?: string; last_error_message?: string; pending_update_count?: number } }
      | null;
    if (!res.ok || !json?.ok) return null;
    return {
      url: json.result?.url ?? "",
      error: json.result?.last_error_message ?? "",
      pending: json.result?.pending_update_count ?? 0,
    };
  } catch {
    return null;
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
  if (!isTelegramToken(token)) return { ok: false as const, error: TOKEN_HINT };
  try {
    const res = await fetch(`${API}/bot${token}/getMe`);
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; description?: string; result?: { username?: string; first_name?: string } }
      | null;
    if (!res.ok || !json?.ok)
      return { ok: false as const, error: explain(json?.description, token) || "Токен не подошёл" };
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

/**
 * Забирает присланный файл из телеграма.
 * Ссылка на файл содержит токен бота, поэтому наружу она не уходит —
 * файл скачивается здесь и дальше живёт в нашем хранилище.
 */
export async function downloadTelegramFile(token: string, fileId: string) {
  try {
    const res = await fetch(`${API}/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`);
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; result?: { file_path?: string; file_size?: number } }
      | null;
    if (!res.ok || !json?.ok || !json.result?.file_path) return null;

    const file = await fetch(`${API}/file/bot${token}/${json.result.file_path}`);
    if (!file.ok) return null;

    return {
      data: new Uint8Array(await file.arrayBuffer()),
      path: json.result.file_path,
    };
  } catch {
    return null;
  }
}

/** Пересылает уже загруженный в телеграм файл в другой чат — по его id. */
export async function forwardTelegramFile(
  token: string,
  chatId: string,
  fileId: string,
  caption = ""
) {
  try {
    const res = await fetch(`${API}/bot${token}/sendDocument`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        document: fileId,
        ...(caption ? { caption, parse_mode: "HTML" } : {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
