import { NextResponse } from "next/server";
import {
  addLead,
  clearBotSession,
  getBotLocale,
  getBotSession,
  getDict,
  getIntegrations,
  getLeads,
  getSeo,
  getSite,
  getStats,
  setBotLocale,
  setBotSession,
  type BotSession,
} from "@/content/store";
import { storageIsWritable } from "@/content/storage";
import { siteOrigin } from "@/data/seo";
import { isLocale, locales, type Locale } from "@/i18n/config";
import {
  adminMenu,
  botLocale,
  botTexts,
  chooseLanguageText,
  clientMenu,
  formSteps,
  languageMenu,
  languageNames,
  nextStep,
  parseContactMessage,
  prevStep,
  stepByKey,
  stepIndex,
  type FormStep,
} from "@/lib/bot";
import { healthReport, leadsCsv, leadsText, statsCsv, statsText } from "@/lib/report";
import { storeLeadFile } from "@/lib/attachment";
import {
  answerCallback,
  downloadTelegramFile,
  escapeHtml,
  forwardTelegramFile,
  inlineKeyboard,
  keyboard,
  sendTelegram,
  sendTelegramAll,
  sendTelegramDocument,
  telegramTargets,
  type Button,
} from "@/lib/telegram";
import { isValidArea, isValidName, isValidPhone, normalizePhone } from "@/lib/validate";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Chat = { id: number };
type From = { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string };
type Contact = { phone_number: string; first_name?: string; last_name?: string };
type Doc = { file_id: string; file_name?: string; file_size?: number; mime_type?: string };
type Photo = { file_id: string; file_size?: number };
type Message = {
  chat: Chat;
  from?: From;
  text?: string;
  contact?: Contact;
  document?: Doc;
  photo?: Photo[];
};
type Update = {
  message?: Message;
  callback_query?: { id: string; data?: string; from?: From; message?: { chat: Chat } };
};

type Calc = NonNullable<Awaited<ReturnType<typeof getDict>>["calc"]>;
type Texts = (typeof botTexts)[Locale];
type Telegram = Awaited<ReturnType<typeof getIntegrations>>["telegram"];

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

/**
 * Какой язык показывать. Выбранный кнопкой важнее настроек телеграма:
 * у половины клиентов в Ташкенте интерфейс русский, а говорить они хотят
 * по-узбекски — угадывать тут нельзя.
 */
async function localeFor(chatId: string, from?: From): Promise<Locale> {
  const saved = await getBotLocale(chatId);
  if (saved && isLocale(saved)) return saved;
  return botLocale(from?.language_code);
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
  } catch (error) {
    // ответ телеграму всегда 200: иначе он будет слать это же обновление снова
    console.error("Бот споткнулся на обновлении:", error);
  }
  return NextResponse.json({ ok: true });
}

/* ─────────────── вопросы формы ─────────────── */

const labels: Record<FormStep["key"], keyof Calc> = {
  name: "name",
  company: "company",
  phone: "phone",
  objectType: "objectType",
  area: "area",
  material: "material",
  stage: "stage",
  file: "file",
};

function optionsOf(step: FormStep, calc: Calc): string[] {
  if (!step.options) return [];
  const list = calc[step.options];
  return Array.isArray(list) ? (list as string[]) : [];
}

/** Что показать человеку: для выбора из списка в ответе хранится номер варианта. */
function shown(step: FormStep, value: string, calc: Calc) {
  if (step.kind !== "choice") return value;
  const index = Number(value);
  return optionsOf(step, calc)[index] ?? "";
}

/** Клавиатура под вопросом: варианты ответа плюс «пропустить», «назад», «отмена». */
function stepKeyboard(step: FormStep, calc: Calc, t: Texts) {
  const rows: { text: string; request_contact?: boolean }[][] = [];

  if (step.kind === "choice") {
    for (const option of optionsOf(step, calc)) rows.push([{ text: option }]);
  }
  if (step.kind === "phone") {
    rows.push([{ text: t.contactButton, request_contact: true }]);
  }

  const nav: { text: string }[] = [];
  if (step.optional) nav.push({ text: t.skip });
  if (prevStep(step.key)) nav.push({ text: t.back });
  nav.push({ text: t.cancel });
  rows.push(nav);

  return { keyboard: rows, resize_keyboard: true, is_persistent: true };
}

function questionText(step: FormStep, calc: Calc, t: Texts) {
  const position = `${stepIndex(step.key) + 1}/${formSteps.length}`;
  const label = String(calc[labels[step.key]] ?? step.key);
  const hint =
    step.kind === "phone" ? t.askPhone
    : step.kind === "file" ? t.askFile
    : step.kind === "choice" ? t.chooseOption
    : "";

  return `<b>${position} · ${escapeHtml(label)}</b>${hint ? `\n${hint}` : ""}`;
}

/* ─────────────── обработка ─────────────── */

async function handle(update: Update, telegram: Telegram) {
  const token = telegram.token;
  const site = await origin();
  // соцсети компании берём из админки — те же ссылки, что в подвале сайта
  const socials = (await getSite()).socials.map((item) => ({ label: item.label, url: item.url }));

  const isAdmin = (chatId: string) =>
    telegramTargets(telegram).some((target) => target.chatId === chatId);

  const menu = (chatId: string, locale: Locale): Button[][] =>
    isAdmin(chatId) ? adminMenu(locale, site, socials) : clientMenu(locale, site, socials);

  /** Человек выбрал язык — запоминаем и переводим разговор. */
  const setLanguage = async (chatId: string, picked: Locale) => {
    await setBotLocale(chatId, picked);
    const chosen = botTexts[picked];

    const running = await getBotSession(chatId);
    if (running) {
      // форма уже идёт — продолжаем с того же вопроса, только на новом языке
      const step = stepByKey(running.step);
      await setBotSession({ ...running, locale: picked });
      await sendTelegram(token, chatId, chosen.languageSet, { reply_markup: { remove_keyboard: true } });
      const calc = (await getDict(picked)).calc as Calc;
      if (step) return askAgain(token, chatId, step, calc, chosen);
      return showSummary(token, chatId, { ...running, locale: picked }, calc, chosen);
    }

    const welcome = telegram.welcome.trim() || chosen.welcome;
    await sendTelegram(token, chatId, `${chosen.languageSet}\n\n${welcome}\n\n${chosen.ask}`, {
      reply_markup: keyboard(menu(chatId, picked)),
    });
  };

  /**
   * Что делает кнопка меню. Одно и то же для клавиатуры под полем ввода
   * (приходит текстом) и для старых кнопок под сообщением (приходят callback-ом).
   */
  const runAction = async (chatId: string, locale: Locale, button: Button) => {
    const t = botTexts[locale];
    const backToMenu = () =>
      sendTelegram(token, chatId, t.ask, { reply_markup: keyboard(menu(chatId, locale)) });

    // раздел сайта или соцсеть: с клавиатуры под полем ввода ссылку не открыть,
    // поэтому присылаем её сообщением с кнопкой — открывается одним нажатием
    if (button.url) {
      await sendTelegram(token, chatId, `${escapeHtml(button.text)}\n${button.url}`, {
        reply_markup: inlineKeyboard([[{ text: button.text, url: button.url }]]),
      });
      return;
    }

    if (button.data === "language") {
      await sendTelegram(token, chatId, chooseLanguageText, { reply_markup: keyboard(languageMenu()) });
      return;
    }

    if (button.data === "lead") {
      await startForm(token, chatId, locale);
      return;
    }

    // рабочие кнопки — только для своих
    if (["leads", "stats", "health"].includes(button.data ?? "") && !isAdmin(chatId)) {
      await backToMenu();
      return;
    }

    if (button.data === "leads") {
      const { items } = await getLeads();
      await sendTelegram(token, chatId, leadsText(items));
      if (items.length) {
        const stamp = new Date().toISOString().slice(0, 10);
        await sendTelegramDocument(token, chatId, `zayavki-${stamp}.csv`, leadsCsv(items), "Все заявки таблицей");
      }
      return;
    }

    if (button.data === "stats") {
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

    if (button.data === "health") {
      const [leads, stats] = await Promise.all([getLeads(), getStats()]);
      const report = await healthReport(site, {
        storageOk: storageIsWritable(),
        leads: leads.items,
        stats,
        hours: telegram.healthHours,
      });
      await sendTelegram(token, chatId, report.text);
      return;
    }

    await backToMenu();
  };

  /** Кнопка меню по подписи: клавиатура под полем ввода шлёт боту текст кнопки. */
  const findMenuButton = (chatId: string, text: string): Button | null => {
    if (!text) return null;
    for (const loc of locales) {
      for (const row of menu(chatId, loc)) {
        const hit = row.find((b) => b.text === text);
        if (hit) return hit;
      }
    }
    return null;
  };

  /* ─── нажали старую кнопку под сообщением ─── */
  if (update.callback_query) {
    const query = update.callback_query;
    const chatId = String(query.message?.chat.id ?? query.from?.id ?? "");
    await answerCallback(token, query.id);
    if (!chatId) return;

    if (query.data?.startsWith("lang:")) {
      const picked = query.data.slice(5);
      if (isLocale(picked)) await setLanguage(chatId, picked);
      return;
    }

    const locale = await localeFor(chatId, query.from);
    await runAction(chatId, locale, { text: "", data: query.data ?? "menu" });
    return;
  }

  /* ─── написали сообщение ─── */
  const message = update.message;
  if (!message) return;

  const chatId = String(message.chat.id);
  const saved = await getBotLocale(chatId);
  const locale = saved && isLocale(saved) ? saved : botLocale(message.from?.language_code);
  const t = botTexts[locale];
  const text = (message.text ?? "").trim();

  // команды всегда обрывают начатый разговор
  if (/^\/start|^\/menu|^\/help/.test(text)) {
    await clearBotSession(chatId);

    // первым делом спрашиваем язык: угадывать по настройкам телеграма ненадёжно
    if (!saved || /^\/lang/.test(text)) {
      await sendTelegram(token, chatId, chooseLanguageText, {
        reply_markup: keyboard(languageMenu()),
      });
      return;
    }

    const welcome = telegram.welcome.trim() || t.welcome;
    await sendTelegram(token, chatId, `${welcome}\n\n${t.ask}`, {
      reply_markup: keyboard(menu(chatId, locale)),
    });
    return;
  }

  if (/^\/lang/.test(text)) {
    await sendTelegram(token, chatId, chooseLanguageText, { reply_markup: keyboard(languageMenu()) });
    return;
  }

  // нажали язык на клавиатуре под полем ввода — приходит подпись кнопки
  const pickedLang = (Object.keys(languageNames) as Locale[]).find((code) => languageNames[code] === text);
  if (pickedLang) {
    await setLanguage(chatId, pickedLang);
    return;
  }

  const session = await getBotSession(chatId);
  if (session) {
    await continueForm(message, session, telegram, menu(chatId, locale));
    return;
  }

  // нажали кнопку меню под полем ввода
  const pressed = findMenuButton(chatId, text);
  if (pressed) {
    await runAction(chatId, locale, pressed);
    return;
  }

  // отдельная быстрая дорожка: прислали контакт или телефон, не начиная форму
  if (message.contact?.phone_number) {
    const name =
      [message.contact.first_name, message.contact.last_name].filter(Boolean).join(" ") ||
      [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" ") ||
      "Клиент из телеграма";
    await saveQuickLead({ telegram, chatId, name, phone: message.contact.phone_number, locale, from: message.from });
    await sendTelegram(token, chatId, t.thanks, { reply_markup: { remove_keyboard: true } });
    await sendTelegram(token, chatId, t.ask, { reply_markup: keyboard(menu(chatId, locale)) });
    return;
  }

  const parsed = text ? parseContactMessage(text) : null;
  if (parsed) {
    const name =
      parsed.name ||
      [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" ") ||
      "Клиент из телеграма";
    const saved = await saveQuickLead({
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

  await sendTelegram(token, chatId, text ? t.needPhone : t.ask, {
    reply_markup: keyboard(menu(chatId, locale)),
  });
}

/* ─────────────── пошаговая заявка ─────────────── */

async function startForm(token: string, chatId: string, locale: Locale) {
  const t = botTexts[locale];
  const calc = (await getDict(locale)).calc as Calc;
  const first = formSteps[0];

  await setBotSession({ chatId, step: first.key, locale, answers: {}, at: Date.now() });
  await sendTelegram(token, chatId, t.formIntro, { reply_markup: { remove_keyboard: true } });
  await sendTelegram(token, chatId, questionText(first, calc, t), {
    reply_markup: stepKeyboard(first, calc, t),
  });
}

async function askAgain(token: string, chatId: string, step: FormStep, calc: Calc, t: Texts, error = "") {
  await sendTelegram(token, chatId, error ? `${error}\n\n${questionText(step, calc, t)}` : questionText(step, calc, t), {
    reply_markup: stepKeyboard(step, calc, t),
  });
}

async function showSummary(token: string, chatId: string, session: BotSession, calc: Calc, t: Texts) {
  const lines = formSteps.map((step) => {
    const raw = session.answers[step.key] ?? "";
    const value =
      step.key === "file"
        ? session.fileName || t.empty
        : raw
          ? shown(step, raw, calc)
          : t.empty;
    return `${escapeHtml(String(calc[labels[step.key]] ?? step.key))}: <b>${escapeHtml(value)}</b>`;
  });

  await setBotSession({ ...session, step: "summary" });
  await sendTelegram(token, chatId, `${t.summary}\n\n${lines.join("\n")}`, {
    reply_markup: {
      keyboard: [[{ text: t.send }], [{ text: t.restart }, { text: t.cancel }]],
      resize_keyboard: true,
      is_persistent: true,
    },
  });
}

async function continueForm(
  message: Message,
  session: BotSession,
  telegram: Telegram,
  menuRows: Button[][]
) {
  const token = telegram.token;
  const chatId = String(message.chat.id);
  const locale = (session.locale as Locale) || botLocale(message.from?.language_code);
  const t = botTexts[locale];
  const calc = (await getDict(locale)).calc as Calc;
  const text = (message.text ?? "").trim();

  const finish = async (reply: string) => {
    await clearBotSession(chatId);
    await sendTelegram(token, chatId, reply, { reply_markup: { remove_keyboard: true } });
    await sendTelegram(token, chatId, t.ask, { reply_markup: keyboard(menuRows) });
  };

  if (text === t.cancel) return finish(t.cancelled);

  /* сводка перед отправкой */
  if (session.step === "summary") {
    if (text === t.send) {
      const done = await submitForm(session, telegram, message.from);
      return finish(done ? t.thanks : t.tooMany);
    }
    if (text === t.restart) {
      await clearBotSession(chatId);
      return startForm(token, chatId, locale);
    }
    return showSummary(token, chatId, session, calc, t);
  }

  const step = stepByKey(session.step);
  if (!step) return finish(t.cancelled);

  if (text === t.back) {
    const back = prevStep(step.key);
    if (!back) return finish(t.cancelled);
    await setBotSession({ ...session, step: back.key });
    return askAgain(token, chatId, back, calc, t);
  }

  const answers = { ...session.answers };
  let fileId = session.fileId;
  let fileName = session.fileName;

  if (text === t.skip && step.optional) {
    answers[step.key] = "";
    if (step.key === "file") {
      fileId = undefined;
      fileName = undefined;
    }
  } else {
    /* ─── проверяем ответ ─── */
    if (step.kind === "file") {
      const doc = message.document;
      const photo = message.photo?.[message.photo.length - 1];
      if (!doc && !photo) return askAgain(token, chatId, step, calc, t, t.notAFile);

      const size = doc?.file_size ?? photo?.file_size ?? 0;
      if (size > 15 * 1024 * 1024) return askAgain(token, chatId, step, calc, t, t.fileTooBig);

      fileId = doc?.file_id ?? photo?.file_id;
      fileName = doc?.file_name || `photo-${Date.now()}.jpg`;
      answers.file = fileName;
    } else if (step.kind === "phone") {
      const phone = message.contact?.phone_number || text;
      if (!isValidPhone(phone)) {
        return askAgain(token, chatId, step, calc, t, String(calc.errPhone ?? ""));
      }
      answers.phone = phone;
    } else if (step.kind === "choice") {
      const index = optionsOf(step, calc).indexOf(text);
      if (index < 0) return askAgain(token, chatId, step, calc, t, t.chooseOption);
      answers[step.key] = String(index);
    } else if (step.key === "name") {
      if (!isValidName(text)) {
        return askAgain(token, chatId, step, calc, t, String(calc.errName ?? ""));
      }
      answers.name = text.slice(0, 80);
    } else if (step.key === "area") {
      if (!isValidArea(text)) {
        return askAgain(token, chatId, step, calc, t, String(calc.errArea ?? ""));
      }
      answers.area = text.slice(0, 40);
    } else {
      if (!text) return askAgain(token, chatId, step, calc, t);
      answers[step.key] = text.slice(0, 160);
    }
  }

  const next = nextStep(step.key);
  const updated: BotSession = { ...session, answers, fileId, fileName, at: Date.now() };

  if (!next) return showSummary(token, chatId, updated, calc, t);

  await setBotSession({ ...updated, step: next.key });
  return askAgain(token, chatId, next, calc, t);
}

/** Отправляет собранную заявку в админку и всем получателям. */
async function submitForm(session: BotSession, telegram: Telegram, from?: From) {
  if (tooOften(session.chatId)) return false;

  const token = telegram.token;
  // менеджеру удобнее читать заявку по-русски, даже если клиент отвечал на узбекском
  const ru = (await getDict("ru")).calc as Calc;

  const pick = (key: FormStep["key"]) => {
    const step = stepByKey(key);
    const raw = session.answers[key] ?? "";
    if (!step || !raw) return "";
    return step.kind === "choice" ? shown(step, raw, ru) : raw;
  };

  const details = (
    [
      ["Компания", pick("company")],
      ["Тип объекта", pick("objectType")],
      ["Площадь фасада, м²", pick("area")],
      ["Необходимый материал", pick("material")],
      ["Стадия проекта", pick("stage")],
    ] as [string, string][]
  )
    .filter(([, value]) => value)
    .map(([label, value]) => ({ label, value }));

  // файл перекладываем из телеграма к себе: ссылка телеграма содержит токен бота
  let attachment: { url: string; name: string } | null = null;
  if (session.fileId) {
    const file = await downloadTelegramFile(token, session.fileId);
    if (file) {
      attachment = await storeLeadFile(file.data, session.fileName || file.path, "application/octet-stream");
    }
  }

  const username = from?.username ? `@${from.username}` : "";
  const lead = await addLead({
    name: session.answers.name || "Клиент из телеграма",
    phone: normalizePhone(session.answers.phone || ""),
    message: details.map((item) => `${item.label}: ${item.value}`).join("\n"),
    source: "telegram",
    page: "telegram",
    locale: session.locale || "ru",
    details: [...details, { label: "Телеграм", value: username || `id ${session.chatId}` }],
    ...(attachment ? { fileUrl: attachment.url, fileName: attachment.name } : {}),
  });

  const lines = [
    "<b>Запрос расчёта — телеграм-бот</b>",
    `Имя: ${escapeHtml(lead.name)}`,
    `Телефон: ${escapeHtml(lead.phone)}`,
    ...details.map((item) => `${item.label}: ${escapeHtml(item.value)}`),
    `Телеграм: ${escapeHtml(username || `id ${session.chatId}`)}`,
    ...(attachment ? [`Файл: ${escapeHtml(attachment.name)}\n${attachment.url}`] : []),
  ];

  await sendTelegramAll(telegram, lines.join("\n"));

  // сам чертёж тоже кидаем в чат — так менеджеру не нужно открывать ссылку
  if (session.fileId) {
    for (const target of telegramTargets(telegram)) {
      await forwardTelegramFile(token, target.chatId, session.fileId, `Чертёж к заявке: ${escapeHtml(lead.name)}`);
    }
  }

  return true;
}

/** Короткая заявка: человек просто прислал телефон, не проходя форму. */
async function saveQuickLead(input: {
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
