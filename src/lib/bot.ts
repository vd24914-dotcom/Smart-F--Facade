import type { Locale } from "@/i18n/config";
import { type Button } from "@/lib/telegram";

/** Язык клиента берём из настроек его телеграма, по умолчанию русский. */
export function botLocale(code: string | undefined): Locale {
  const value = (code ?? "").toLowerCase();
  if (value.startsWith("uz")) return "uz";
  if (value.startsWith("en")) return "en";
  return "ru";
}

type Texts = {
  welcome: string;
  ask: string;
  lead: string;
  materials: string;
  docs: string;
  about: string;
  services: string;
  contacts: string;
  site: string;
  leadPrompt: string;
  contactButton: string;
  thanks: string;
  needPhone: string;
  tooMany: string;
  formIntro: string;
  askPhone: string;
  askFile: string;
  chooseOption: string;
  skip: string;
  back: string;
  cancel: string;
  cancelled: string;
  summary: string;
  send: string;
  restart: string;
  notAFile: string;
  fileTooBig: string;
  empty: string;
  language: string;
  languageSet: string;
};

export const botTexts: Record<Locale, Texts> = {
  ru: {
    welcome:
      "<b>Smart Facade</b> — фасадные материалы и комплектные решения в Узбекистане.\n\n" +
      "Подберём материал под проект, посчитаем спецификацию по чертежам и организуем поставку в Ташкенте и регионах.",
    ask: "Что вас интересует?",
    lead: "📝 Оставить заявку",
    materials: "🧱 Материалы",
    docs: "📄 Документы",
    about: "🏢 О компании",
    services: "🛠 Услуги",
    contacts: "📞 Контакты",
    site: "🌐 Сайт",
    leadPrompt:
      "Нажмите кнопку ниже, чтобы отправить свой номер, — или напишите имя и телефон одним сообщением.\n\n" +
      "Если есть чертежи или спецификация, пришлите их сюда же файлом.",
    contactButton: "📞 Отправить мой номер",
    thanks: "Спасибо! Заявка принята — свяжемся с вами в рабочее время.",
    needPhone: "Чтобы оставить заявку, пришлите номер телефона — кнопкой ниже или сообщением.",
    tooMany: "Заявка уже принята. Если нужно что-то добавить — просто напишите здесь, мы увидим.",
    formIntro:
      "Задам несколько коротких вопросов — как в форме расчёта на сайте. Займёт минуту.\n" +
      "Необязательные шаги можно пропустить, вернуться назад — кнопкой «Назад».",
    askPhone: "Отправьте номер кнопкой ниже или напишите его сообщением.",
    askFile:
      "Пришлите чертёж или спецификацию файлом — PDF, DWG, XLS, JPG или архив. С ними расчёт точнее.",
    chooseOption: "Выберите вариант кнопкой ниже.",
    skip: "Пропустить",
    back: "← Назад",
    cancel: "✖️ Отмена",
    cancelled: "Заявка отменена. Начать заново — кнопка «Оставить заявку».",
    summary: "<b>Проверьте заявку</b>",
    send: "✅ Отправить заявку",
    restart: "✏️ Заполнить заново",
    notAFile: "Это не файл. Пришлите документ или нажмите «Пропустить».",
    fileTooBig: "Файл слишком большой для телеграма. Пропустите шаг — обсудим файл при звонке.",
    empty: "не указано",
    language: "🌐 Язык",
    languageSet: "Дальше говорим по-русски. Язык можно сменить кнопкой «Язык».",
  },
  uz: {
    welcome:
      "<b>Smart Facade</b> — O‘zbekistonda fasad materiallari va kompleks yechimlar.\n\n" +
      "Loyihaga mos materialni tanlaymiz, chizmalar bo‘yicha spetsifikatsiyani hisoblaymiz va Toshkent hamda viloyatlarga yetkazamiz.",
    ask: "Sizni nima qiziqtiradi?",
    lead: "📝 Ariza qoldirish",
    materials: "🧱 Materiallar",
    docs: "📄 Hujjatlar",
    about: "🏢 Kompaniya haqida",
    services: "🛠 Xizmatlar",
    contacts: "📞 Kontaktlar",
    site: "🌐 Sayt",
    leadPrompt:
      "Raqamingizni yuborish uchun quyidagi tugmani bosing — yoki ism va telefonni bitta xabarda yozing.\n\n" +
      "Chizma yoki spetsifikatsiya bo‘lsa, shu yerga fayl qilib yuboring.",
    contactButton: "📞 Raqamimni yuborish",
    thanks: "Rahmat! Arizangiz qabul qilindi — ish vaqtida bog‘lanamiz.",
    needPhone: "Ariza qoldirish uchun telefon raqamingizni yuboring — tugma orqali yoki xabar bilan.",
    tooMany: "Arizangiz allaqachon qabul qilindi. Qo‘shimcha ma’lumot bo‘lsa, shu yerga yozing.",
    formIntro:
      "Bir necha qisqa savol beraman — saytdagi hisob-kitob shakli kabi. Bir daqiqa vaqt oladi.\n" +
      "Majburiy bo‘lmagan qadamlarni o‘tkazib yuborish mumkin, orqaga qaytish — «Orqaga» tugmasi.",
    askPhone: "Raqamni quyidagi tugma bilan yuboring yoki xabar qilib yozing.",
    askFile:
      "Chizma yoki spetsifikatsiyani fayl qilib yuboring — PDF, DWG, XLS, JPG yoki arxiv. Ular bilan hisob aniqroq bo‘ladi.",
    chooseOption: "Quyidagi tugmalardan birini tanlang.",
    skip: "O‘tkazib yuborish",
    back: "← Orqaga",
    cancel: "✖️ Bekor qilish",
    cancelled: "Ariza bekor qilindi. Qaytadan boshlash — «Ariza qoldirish» tugmasi.",
    summary: "<b>Arizani tekshiring</b>",
    send: "✅ Arizani yuborish",
    restart: "✏️ Qaytadan to‘ldirish",
    notAFile: "Bu fayl emas. Hujjat yuboring yoki «O‘tkazib yuborish»ni bosing.",
    fileTooBig: "Fayl telegram uchun juda katta. Bu qadamni o‘tkazib yuboring — qo‘ng‘iroqda kelishamiz.",
    empty: "ko‘rsatilmagan",
    language: "🌐 Til",
    languageSet: "Endi o‘zbek tilida gaplashamiz. Tilni «Til» tugmasi bilan almashtirish mumkin.",
  },
  en: {
    welcome:
      "<b>Smart Facade</b> — facade materials and complete solutions in Uzbekistan.\n\n" +
      "We select the material for your project, calculate the specification from your drawings and arrange delivery in Tashkent and the regions.",
    ask: "What are you looking for?",
    lead: "📝 Leave a request",
    materials: "🧱 Materials",
    docs: "📄 Documents",
    about: "🏢 About",
    services: "🛠 Services",
    contacts: "📞 Contacts",
    site: "🌐 Website",
    leadPrompt:
      "Tap the button below to share your number — or send your name and phone in one message.\n\n" +
      "If you have drawings or a specification, send them here as a file.",
    contactButton: "📞 Share my number",
    thanks: "Thank you! We have your request and will get in touch during working hours.",
    needPhone: "To leave a request, send your phone number — with the button below or as a message.",
    tooMany: "We already have your request. If you want to add anything, just write here.",
    formIntro:
      "A few short questions — the same ones as the estimate form on the site. It takes a minute.\n" +
      "Optional steps can be skipped, and «Back» returns to the previous one.",
    askPhone: "Share your number with the button below, or type it in a message.",
    askFile:
      "Send the drawing or specification as a file — PDF, DWG, XLS, JPG or an archive. It makes the estimate far more precise.",
    chooseOption: "Pick one of the buttons below.",
    skip: "Skip",
    back: "← Back",
    cancel: "✖️ Cancel",
    cancelled: "Request cancelled. To start again, tap «Leave a request».",
    summary: "<b>Check your request</b>",
    send: "✅ Send the request",
    restart: "✏️ Start over",
    notAFile: "That is not a file. Send a document or tap «Skip».",
    fileTooBig: "The file is too large for Telegram. Skip this step — we can sort the file out on the call.",
    empty: "not given",
    language: "🌐 Language",
    languageSet: "We will carry on in English. The «Language» button switches it back.",
  },
};

/** Один и тот же вопрос на трёх языках — его видит тот, кто ещё не выбрал. */
export const chooseLanguageText =
  "Выберите язык\nTilni tanlang\nChoose your language";

export const languageNames: Record<Locale, string> = {
  ru: "Русский",
  uz: "O‘zbekcha",
  en: "English",
};

/** Кнопки выбора языка. */
export function languageMenu(): Button[][] {
  return [
    [
      { text: languageNames.ru, data: "lang:ru" },
      { text: languageNames.uz, data: "lang:uz" },
      { text: languageNames.en, data: "lang:en" },
    ],
  ];
}

/** Иконка к соцсети — чтобы кнопка читалась с одного взгляда. */
function socialIcon(label: string, url: string) {
  const value = `${label} ${url}`.toLowerCase();
  if (value.includes("instagram")) return "📸";
  if (value.includes("t.me") || value.includes("telegram")) return "✈️";
  if (value.includes("facebook")) return "📘";
  if (value.includes("youtube")) return "▶️";
  if (value.includes("wa.me") || value.includes("whatsapp")) return "💬";
  return "🔗";
}

export type SocialLink = { label: string; url: string };

/** Меню клиента: заявка, разделы сайта и соцсети компании. */
export function clientMenu(locale: Locale, origin: string, socials: SocialLink[] = []): Button[][] {
  const t = botTexts[locale];
  const link = (path: string) => `${origin}/${locale}${path}`;
  const rows: Button[][] = [[{ text: t.lead, data: "lead" }]];

  if (origin) {
    rows.push([
      { text: t.materials, url: link("#materials") },
      { text: t.docs, url: link("#docs") },
    ]);
    rows.push([
      { text: t.about, url: link("/about") },
      { text: t.services, url: link("/services") },
    ]);
    rows.push([
      { text: t.contacts, url: link("/contacts") },
      { text: t.site, url: link("") },
    ]);
  }

  rows.push([{ text: t.language, data: "language" }]);

  // соцсети берём из админки: пустые ссылки просто не показываем
  const links = socials.filter((item) => item.url?.trim());
  for (let i = 0; i < links.length; i += 2) {
    rows.push(
      links.slice(i, i + 2).map((item) => ({
        text: `${socialIcon(item.label, item.url)} ${item.label || "Соцсеть"}`,
        url: item.url.trim(),
      }))
    );
  }

  return rows;
}

/** То же меню плюс рабочие кнопки — видят только свои. */
export function adminMenu(locale: Locale, origin: string, socials: SocialLink[] = []): Button[][] {
  return [
    [
      { text: "📋 Последние заявки", data: "leads" },
      { text: "📊 Статистика сайта", data: "stats" },
    ],
    [{ text: "🩺 Проверить сайт", data: "health" }],
    ...clientMenu(locale, origin, socials),
  ];
}

/**
 * Достаёт телефон и имя из обычного сообщения: «Азиз +998 90 123 45 67».
 * Номер может быть записан с пробелами, скобками и дефисами.
 *
 * Если рядом с номером не короткое имя, а целая фраза, имя не выдумываем:
 * вернём пустую строку, а текст целиком уйдёт в комментарий к заявке.
 */
export function parseContactMessage(text: string) {
  const matches = text.match(/\+?\d[\d\s()\-–—]{7,}\d/g) ?? [];
  const best = matches
    .map((raw) => ({ raw, digits: raw.replace(/\D/g, "") }))
    .filter((item) => item.digits.length >= 9 && item.digits.length <= 15)
    .sort((a, b) => b.digits.length - a.digits.length)[0];

  if (!best) return null;

  const rest = text
    .replace(best.raw, " ")
    .replace(/[^\p{L}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = rest ? rest.split(" ") : [];
  const name = words.length > 0 && words.length <= 3 ? rest.slice(0, 60) : "";

  return { phone: best.raw.trim(), name };
}

/* ─────────────── пошаговая заявка ─────────────── */

/**
 * Те же поля, что в форме расчёта на сайте, и в том же порядке.
 * Подписи и списки вариантов берутся из словаря сайта, поэтому вопросы
 * приходят на языке клиента и меняются вместе с текстами в админке.
 */
export type FormStep = {
  key: "name" | "company" | "phone" | "objectType" | "area" | "material" | "stage" | "file";
  kind: "text" | "phone" | "choice" | "file";
  optional?: boolean;
  /** откуда брать варианты ответа в dict.calc */
  options?: "objectTypes" | "materials" | "stages";
};

export const formSteps: FormStep[] = [
  { key: "name", kind: "text" },
  { key: "company", kind: "text", optional: true },
  { key: "phone", kind: "phone" },
  { key: "objectType", kind: "choice", options: "objectTypes" },
  { key: "area", kind: "text", optional: true },
  { key: "material", kind: "choice", options: "materials" },
  { key: "stage", kind: "choice", options: "stages" },
  { key: "file", kind: "file", optional: true },
];

export const stepIndex = (key: string) => formSteps.findIndex((step) => step.key === key);
export const stepByKey = (key: string) => formSteps.find((step) => step.key === key) ?? null;

/** Следующий шаг после этого; null — значит пора показывать сводку. */
export function nextStep(key: string): FormStep | null {
  return formSteps[stepIndex(key) + 1] ?? null;
}

export function prevStep(key: string): FormStep | null {
  const index = stepIndex(key);
  return index > 0 ? formSteps[index - 1] : null;
}
