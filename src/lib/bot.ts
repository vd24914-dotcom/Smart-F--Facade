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
  },
};

/** Меню клиента: заявка плюс ссылки на разделы сайта. */
export function clientMenu(locale: Locale, origin: string): Button[][] {
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
  return rows;
}

/** То же меню плюс рабочие кнопки — видят только свои. */
export function adminMenu(locale: Locale, origin: string): Button[][] {
  return [
    [
      { text: "📋 Последние заявки", data: "leads" },
      { text: "📊 Статистика сайта", data: "stats" },
    ],
    [{ text: "🩺 Проверить сайт", data: "health" }],
    ...clientMenu(locale, origin),
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
