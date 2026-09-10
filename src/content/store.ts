import fs from "node:fs";
import path from "node:path";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Building, Material } from "@/data/portfolio";
import { seoPages, type SeoPage } from "@/data/seo";

/** Весь редактируемый контент сайта лежит в JSON-файлах папки content/. */
const dir = path.join(process.cwd(), "content");

export type SiteContent = {
  name: string;
  email: string;
  phones: string[];
  social: { facebook: string; whatsapp: string; instagram: string };
  images: {
    logoHeader: string;
    logoFooter: string;
    hero: string;
    pageHero: string;
    aboutPhoto: string;
    aboutCompany: string;
    cta: string;
    footer: string;
  };
  icons: { specs: string[]; services: string[]; advantages: string[] };
};

export type ProjectText = {
  title: string;
  text: string;
  description: string;
  material: string;
  area: string;
  colors: string;
  /** SEO страницы объекта: если пусто — берётся название и короткое описание */
  seoTitle?: string;
  seoDescription?: string;
  /** подпись фотографии для поиска по картинкам */
  imageAlt?: string;
};

export type Project = {
  id: string;
  image: string;
  building: Building;
  materials: Material[];
  texts: Record<Locale, ProjectText>;
};

export type PartnersContent = { representatives: string[]; partners: string[] };


/** Пара фотографий «до / после» одного объекта */
export type BeforeAfterItem = {
  id: string;
  before: string;
  after: string;
  title: Record<Locale, string>;
  text: Record<Locale, string>;
};

export type BeforeAfterContent = { items: BeforeAfterItem[] };

export type ContactBlock = {
  id: string;
  title: Record<Locale, string>;
  items: Record<Locale, string[]>;
  /** как оформлять строки: обычный текст, телефон, почта или ссылка */
  link: "none" | "tel" | "mail" | "url";
};

export type ContactsContent = { blocks: ContactBlock[] };

export type TextsContent = Record<Locale, Dictionary>;

/** Заявка с сайта */
export type Lead = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  message: string;
  /** откуда пришла: модальное окно, страница контактов и т.д. */
  source: string;
  page: string;
  locale: string;
  status: "new" | "done";
};

export type LeadsContent = { items: Lead[] };

/** Посещаемость по дням: { "2026-09-09": { views, visits } } */
export type StatsContent = { days: Record<string, { views: number; visits: number }> };

export type { SeoPage };

export type IntegrationsContent = {
  telegram: { enabled: boolean; token: string; chatId: string };
};

/* ─────────── SEO ─────────── */

export type SeoMeta = { title: string; description: string; keywords: string };

export type SeoContent = {
  /** Адрес сайта, например https://smartfacade.uz — нужен для карты сайта и ссылок */
  siteUrl: string;
  /** Название сайта в конце заголовка: «Проекты — Smart Facade» */
  brand: string;
  /** Картинка-превью при отправке ссылки в мессенджер */
  shareImage: string;
  favicon: string;
  /** Разрешить поисковикам индексировать сайт */
  indexing: boolean;
  pages: Record<SeoPage, Record<Locale, SeoMeta>>;
  verification: { google: string; yandex: string };
  analytics: { googleId: string; yandexId: string };
};

const emptyMeta = (): SeoMeta => ({ title: "", description: "", keywords: "" });

const emptyPageMeta = (): Record<Locale, SeoMeta> => ({
  ru: emptyMeta(),
  uz: emptyMeta(),
  en: emptyMeta(),
});

export function emptySeo(): SeoContent {
  return {
    siteUrl: "",
    brand: "Smart Facade",
    shareImage: "",
    favicon: "",
    indexing: true,
    pages: Object.fromEntries(seoPages.map((page) => [page, emptyPageMeta()])) as SeoContent["pages"],
    verification: { google: "", yandex: "" },
    analytics: { googleId: "", yandexId: "" },
  };
}

export const files = {
  site: "site.json",
  texts: "texts.json",
  projects: "projects.json",
  partners: "partners.json",
  contacts: "contacts.json",
  beforeafter: "beforeafter.json",
  leads: "leads.json",
  stats: "stats.json",
  integrations: "integrations.json",
  seo: "seo.json",
} as const;

export type ContentFile = keyof typeof files;

function read<T>(file: ContentFile): T {
  const raw = fs.readFileSync(path.join(dir, files[file]), "utf8");
  return JSON.parse(raw) as T;
}

export function getSite(): SiteContent {
  return read<SiteContent>("site");
}

export function getTexts(): TextsContent {
  return read<TextsContent>("texts");
}

export function getDict(locale: Locale): Dictionary {
  return getTexts()[locale];
}

export function getProjects(): Project[] {
  // Если фото ещё не загрузили — подставляем общий фон, чтобы страница не падала
  return read<Project[]>("projects").map((project) => ({
    ...project,
    image: project.image?.trim() ? project.image : "/img/page-hero.jpg",
  }));
}

export function getPartners(): PartnersContent {
  return read<PartnersContent>("partners");
}

export function getContacts(): ContactsContent {
  return read<ContactsContent>("contacts");
}


/** Хостинг не разрешает записывать файлы (например Vercel). */
export class ReadOnlyStorageError extends Error {
  constructor() {
    super(
      "Этот сервер не разрешает сайту сохранять файлы, поэтому правки не записались. " +
        "Меняйте содержимое на своём компьютере и отправляйте изменения на GitHub."
    );
    this.name = "ReadOnlyStorageError";
  }
}

const READ_ONLY_CODES = new Set(["EROFS", "EACCES", "EPERM", "ENOENT"]);

function isReadOnly(error: unknown) {
  const code = (error as NodeJS.ErrnoException)?.code;
  return Boolean(code && READ_ONLY_CODES.has(code));
}

/** Можно ли сейчас сохранять правки. Проверяем один раз за запуск. */
let writable: boolean | null = null;

export function storageIsWritable(): boolean {
  if (writable !== null) return writable;
  try {
    const probe = path.join(dir, ".write-probe");
    fs.writeFileSync(probe, "ok", "utf8");
    fs.unlinkSync(probe);
    writable = true;
  } catch {
    writable = false;
  }
  return writable;
}

/** Запись из админки. Пишем атомарно: сначала во временный файл, потом переименовываем. */
export function writeContent(file: ContentFile, data: unknown) {
  const target = path.join(dir, files[file]);
  const tmp = `${target}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
    fs.renameSync(tmp, target);
  } catch (error) {
    if (isReadOnly(error)) throw new ReadOnlyStorageError();
    throw error;
  }
}

export function readContent(file: ContentFile): unknown {
  return read(file);
}

/* ─────────── заявки, статистика, интеграции ─────────── */

/** Такие файлы могут ещё не существовать — тогда возвращаем пустую заготовку. */
function readSoft<T>(file: ContentFile, fallback: T): T {
  try {
    return read<T>(file);
  } catch {
    return fallback;
  }
}

const MAX_LEADS = 1000;
const MAX_DAYS = 400;

export function getBeforeAfter(): BeforeAfterContent {
  const data = readSoft<BeforeAfterContent>("beforeafter", { items: [] });
  const items = Array.isArray(data.items) ? data.items : [];
  // показываем только заполненные пары
  return { items: items.filter((item) => item.before?.trim() && item.after?.trim()) };
}

export function getLeads(): LeadsContent {
  const data = readSoft<LeadsContent>("leads", { items: [] });
  return { items: Array.isArray(data.items) ? data.items : [] };
}

/** Добавляет заявку в начало списка. Возвращает записанную заявку. */
export function addLead(input: Omit<Lead, "id" | "createdAt" | "status">): Lead {
  const lead: Lead = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    status: "new",
  };
  const { items } = getLeads();
  writeContent("leads", { items: [lead, ...items].slice(0, MAX_LEADS) });
  return lead;
}

/** Настройки SEO. Файла может не быть — тогда пустая заготовка. */
export function getSeo(): SeoContent {
  const base = emptySeo();
  const data = readSoft<Partial<SeoContent>>("seo", base);

  const pages = Object.fromEntries(
    seoPages.map((page) => {
      const saved = data.pages?.[page];
      return [
        page,
        {
          ru: { ...emptyMeta(), ...saved?.ru },
          uz: { ...emptyMeta(), ...saved?.uz },
          en: { ...emptyMeta(), ...saved?.en },
        },
      ];
    })
  ) as SeoContent["pages"];

  return {
    ...base,
    ...data,
    pages,
    verification: { ...base.verification, ...data.verification },
    analytics: { ...base.analytics, ...data.analytics },
  };
}

export function getStats(): StatsContent {
  const data = readSoft<StatsContent>("stats", { days: {} });
  return { days: data.days && typeof data.days === "object" ? data.days : {} };
}

/** Считает просмотр страницы; `firstInSession` — новый посетитель за сессию. */
export function trackView(firstInSession: boolean) {
  const { days } = getStats();
  const key = new Date().toISOString().slice(0, 10);
  const day = days[key] ?? { views: 0, visits: 0 };

  days[key] = { views: day.views + 1, visits: day.visits + (firstInSession ? 1 : 0) };

  const trimmed = Object.fromEntries(
    Object.entries(days)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, MAX_DAYS)
  );
  writeContent("stats", { days: trimmed });
}

export function getIntegrations(): IntegrationsContent {
  const data = readSoft<IntegrationsContent>("integrations", {
    telegram: { enabled: false, token: "", chatId: "" },
  });
  // на хостинге ключи удобнее держать в настройках проекта, а не в файле
  const token = (process.env.TELEGRAM_BOT_TOKEN || data.telegram?.token || "").trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID || data.telegram?.chatId || "").trim();
  const fromEnv = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

  return {
    telegram: {
      enabled: fromEnv || Boolean(data.telegram?.enabled),
      token,
      chatId,
    },
  };
}
