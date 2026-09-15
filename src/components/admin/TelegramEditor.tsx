"use client";

import { useState } from "react";
import type { IntegrationsContent, TelegramRecipient } from "@/content/store";
import { Button, Card, Field, IconButton, useSave } from "./ui";

type Telegram = IntegrationsContent["telegram"];
type SendResult = { chatId: string; label: string; ok: boolean; error?: string };
type FoundChat = { chatId: string; title: string; type: string };

const chatTypes: Record<string, string> = {
  private: "личный чат",
  group: "группа",
  supergroup: "группа",
  channel: "канал",
};

/* Поля объявлены снаружи: если создавать их внутри компонента, React
   пересоздаёт input на каждый ввод и курсор выпрыгивает из поля. */

function SecretField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-3 text-[13px] font-semibold text-slate-700">
        {label}
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          className="text-[12px] font-semibold text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
        >
          {shown ? "скрыть" : "показать"}
        </button>
      </span>
      <input
        type={shown ? "text" : "password"}
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-[14px] text-slate-900 outline-none transition focus:border-slate-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <span className="mt-1 block text-[12px] text-slate-500">{hint}</span>}
    </label>
  );
}

function ResultList({ results }: { results: SendResult[] }) {
  if (!results.length) return null;
  return (
    <ul className="space-y-1 text-[13px]">
      {results.map((item) => (
        <li key={item.chatId} className={item.ok ? "text-green-700" : "text-red-600"}>
          {item.ok ? "✓" : "✕"} {item.label} — {item.ok ? "сообщение доставлено" : item.error}
        </li>
      ))}
    </ul>
  );
}

export default function TelegramEditor({ initial }: { initial: IntegrationsContent }) {
  const [telegram, setTelegram] = useState<Telegram>({
    ...initial.telegram,
    recipients: initial.telegram.recipients ?? [],
  });

  const [botName, setBotName] = useState("");
  const [chats, setChats] = useState<FoundChat[]>([]);
  const [busy, setBusy] = useState<"" | "check" | "test">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState<SendResult[]>([]);
  const [secure, setSecure] = useState("");

  const save = useSave("integrations");
  const set = (patch: Partial<Telegram>) => setTelegram((prev) => ({ ...prev, ...patch }));

  const setRecipient = (id: string, patch: Partial<TelegramRecipient>) =>
    set({
      recipients: telegram.recipients.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    });

  const addRecipient = (chatId = "", label = "") =>
    set({
      recipients: [
        ...telegram.recipients,
        { id: `tg-${Date.now()}-${telegram.recipients.length}`, label, chatId, enabled: true },
      ],
    });

  const removeRecipient = (id: string) =>
    set({ recipients: telegram.recipients.filter((row) => row.id !== id) });

  async function call(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, token: telegram.token }),
    });
    return { ok: res.ok, json: await res.json().catch(() => ({})) };
  }

  async function check() {
    setBusy("check");
    setError("");
    setNote("");
    setResults([]);
    const { ok, json } = await call({ action: "check" });
    setBusy("");
    if (!ok) return setError(json.error || "Не удалось проверить бота");
    setBotName(json.bot?.username ? `@${json.bot.username}` : json.bot?.name || "бот");
    setChats(Array.isArray(json.chats) ? json.chats : []);
    setNote(
      json.chats?.length
        ? "Бот на связи. Ниже — чаты, которые ему писали."
        : "Бот на связи, но ему ещё никто не писал. Напишите боту «Привет» в телеграме и нажмите «Проверить» ещё раз."
    );
  }

  async function test(chatId?: string, label?: string) {
    setBusy("test");
    setError("");
    setNote("");
    setResults([]);
    const { ok, json } = await call({ action: "test", chatId, label });
    setBusy("");
    if (!ok) return setError(json.error || "Не удалось отправить");
    setResults(Array.isArray(json.results) ? json.results : []);
  }

  async function secureStorage() {
    setSecure("Перевожу…");
    const res = await fetch("/api/admin/storage", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setSecure(json.error || "Не получилось");
    setSecure(
      json.failed?.length
        ? `Готово частично, остались: ${json.failed.join(", ")}`
        : `Готово: закрыто разделов — ${json.done?.length ?? 0}`
    );
  }

  const used = new Set([
    telegram.chatId.trim(),
    ...telegram.recipients.map((row) => row.chatId.trim()),
  ]);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-[20px] font-extrabold text-slate-900">Телеграм-бот</h1>
        <p className="mt-1 text-[14px] text-slate-500">
          Заявки с сайта приходят сообщением в телеграм — себе и всем, кого вы добавите ниже.
        </p>
      </div>

      <Card title="Шаг 1. Бот">
        <ol className="list-decimal space-y-1 pl-5 text-[13px] leading-[20px] text-slate-600">
          <li>
            В телеграме найдите <b>@BotFather</b> и отправьте ему <b>/newbot</b>.
          </li>
          <li>Придумайте имя и адрес бота — он пришлёт строку вида 1234567890:AA…</li>
          <li>Вставьте эту строку сюда и нажмите «Проверить».</li>
        </ol>

        <SecretField
          label="Токен бота"
          value={telegram.token}
          onChange={(token) => set({ token })}
          hint="Токен видит только админка. Никому его не пересылайте: по нему можно управлять ботом."
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" onClick={check} disabled={busy === "check" || !telegram.token.trim()}>
            {busy === "check" ? "Проверяю…" : "Проверить"}
          </Button>
          {botName && <span className="text-[13px] font-semibold text-green-700">Бот {botName} на связи</span>}
        </div>

        <label className="flex items-center gap-2 text-[14px] font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={telegram.enabled}
            onChange={(e) => set({ enabled: e.target.checked })}
          />
          Присылать заявки в телеграм
        </label>
      </Card>

      <Card title="Шаг 2. Кому присылать">
        <p className="text-[13px] leading-[20px] text-slate-600">
          Чтобы бот мог написать человеку, этот человек должен сначала сам написать боту — хотя бы
          «Привет». Для рабочей группы добавьте бота в группу. После этого нажмите «Проверить» выше и
          добавьте чат одной кнопкой.
        </p>

        <Field
          label="Основной чат"
          value={telegram.chatId}
          onChange={(chatId) => set({ chatId })}
          hint="ID чата: число для личного чата, со знаком минус для группы. Свой ID покажет @userinfobot."
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-700">Дополнительные получатели</span>
            <Button variant="ghost" onClick={() => addRecipient()}>
              + Добавить
            </Button>
          </div>

          {telegram.recipients.length === 0 && (
            <p className="text-[13px] text-slate-500">Пока никого нет — заявки уйдут только в основной чат.</p>
          )}

          {telegram.recipients.map((row) => (
            <div
              key={row.id}
              className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <Field label="Кто это" value={row.label} onChange={(label) => setRecipient(row.id, { label })} />
              <Field
                label="ID чата"
                value={row.chatId}
                onChange={(chatId) => setRecipient(row.id, { chatId })}
              />
              <div className="flex items-end gap-2 pb-1">
                <label className="flex items-center gap-2 text-[13px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) => setRecipient(row.id, { enabled: e.target.checked })}
                  />
                  вкл.
                </label>
                <Button
                  variant="ghost"
                  onClick={() => test(row.chatId, row.label)}
                  disabled={busy === "test" || !row.chatId.trim()}
                >
                  Тест
                </Button>
                <IconButton title="Удалить" danger onClick={() => removeRecipient(row.id)}>
                  ✕
                </IconButton>
              </div>
            </div>
          ))}
        </div>

        {chats.length > 0 && (
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-[13px] font-semibold text-slate-700">Чаты, которые писали боту</p>
            <ul className="mt-2 space-y-2">
              {chats.map((chat) => (
                <li key={chat.chatId} className="flex flex-wrap items-center gap-3 text-[13px] text-slate-700">
                  <span className="font-semibold">{chat.title}</span>
                  <span className="text-slate-400">
                    {chatTypes[chat.type] ?? chat.type} · {chat.chatId}
                  </span>
                  {used.has(chat.chatId) ? (
                    <span className="text-green-700">уже добавлен</span>
                  ) : (
                    <Button variant="ghost" onClick={() => addRecipient(chat.chatId, chat.title)}>
                      Добавить
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card title="Шаг 3. Проверка">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => save.save({ telegram })} disabled={save.state === "saving"}>
            {save.state === "saving" ? "Сохраняю…" : "Сохранить настройки"}
          </Button>
          {save.state === "saved" && (
            <span className="text-[13px] font-semibold text-green-700">Сохранено ✓</span>
          )}
          {save.state === "error" && (
            <span className="text-[13px] font-semibold text-red-600">{save.message}</span>
          )}
          <Button variant="ghost" onClick={() => test()} disabled={busy === "test"}>
            {busy === "test" ? "Отправляю…" : "Отправить тестовое сообщение всем"}
          </Button>
        </div>

        {note && <p className="text-[13px] text-slate-600">{note}</p>}
        {error && <p className="text-[13px] font-semibold text-red-600">{error}</p>}
        <ResultList results={results} />
        <p className="text-[12px] text-slate-500">
          Настройки применяются сразу после сохранения — публиковать сайт заново не нужно.
        </p>
      </Card>

      <Card title="Безопасность хранилища">
        <p className="text-[13px] leading-[20px] text-slate-600">
          Раньше файлы сайта лежали в открытом хранилище: зная адрес, их можно было скачать вместе с
          телефонами из заявок. Нажмите кнопку один раз — все разделы перезапишутся в закрытом режиме.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" onClick={secureStorage} disabled={secure === "Перевожу…"}>
            Закрыть доступ к файлам
          </Button>
          {secure && <span className="text-[13px] text-slate-600">{secure}</span>}
        </div>
      </Card>
    </div>
  );
}
