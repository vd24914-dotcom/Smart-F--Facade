import { locales, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { defaultTexts, mergeDefaults } from "@/i18n/defaults";
import type { Building, Material } from "@/data/portfolio";
import { seoPages, type SeoPage } from "@/data/seo";
import type { SocialLink } from "@/data/socials";
import { readStored, writeStored, storageIsWritable, ReadOnlyStorageError } from "./storage";

export { storageIsWritable, ReadOnlyStorageError };

export type { SocialLink };

export type SiteContent = {
  name: string;
  email: string;
  phones: string[];
  socials: SocialLink[];
  /** старый формат из трёх фиксированных полей — читается, но больше не пишется */
  social?: { facebook: string; whatsapp: string; instagram: string };
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
  /** Прикреплённые файлы: docs[i] — документ к карточке «Документы и сертификаты» */
  files: { docs: string[] };
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
  /** поля формы расчёта — показываются в админке отдельными строками */
  details?: { label: string; value: string }[];
  /** приложенный чертёж или спецификация */
  fileUrl?: string;
  fileName?: string;
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

const MAX_LEADS = 1000;
const MAX_DAYS = 400;

/** Разделы, которые пишет сам сайт — их всегда читаем свежими. */
const liveFiles = new Set<ContentFile>(["leads", "stats"]);

/** Читает раздел содержимого: сначала облако, потом файл проекта. */
function read<T>(file: ContentFile, fallback: T): Promise<T> {
  return readStored<T>(files[file], fallback, liveFiles.has(file));
}

/** «#» в старых данных означал «ссылки пока нет» — считаем это пустым полем. */
function cleanUrl(url: string | undefined) {
  const value = (url ?? "").trim();
  return value === "#" ? "" : value;
}

/** Раньше соцсети были тремя полями — превращаем их в список, ничего не теряя. */
function normalizeSocials(site: SiteContent): SocialLink[] {
  const list = Array.isArray(site?.socials) ? site.socials : [];
  if (list.length) {
    return list
      .filter((item) => item && (item.url?.trim() || item.label?.trim()))
      .map((item, index) => ({
        id: item.id?.trim() || `social-${index}`,
        label: item.label ?? "",
        url: cleanUrl(item.url),
        icon: item.icon ?? "",
      }));
  }

  const old = site?.social;
  if (!old) return [];

  return [
    { id: "whatsapp", label: "WhatsApp", url: cleanUrl(old.whatsapp), icon: "" },
    { id: "instagram", label: "Instagram", url: cleanUrl(old.instagram), icon: "" },
    { id: "facebook", label: "Facebook", url: cleanUrl(old.facebook), icon: "" },
  ];
}

export async function getSite(): Promise<SiteContent> {
  const site = await read<SiteContent>("site", {} as SiteContent);
  return {
    ...site,
    socials: normalizeSocials(site),
    // раздела может не быть в сохранённом файле — тогда просто пустой список
    files: { docs: Array.isArray(site?.files?.docs) ? site.files.docs : [] },
  };
}

export async function getTexts(): Promise<TextsContent> {
  const stored = await read<Partial<TextsContent>>("texts", {} as TextsContent);
  // Новые блоки могли ещё не попасть в сохранённые тексты — подставляем заготовки,
  // но всё, что человек уже написал в админке, всегда важнее.
  return Object.fromEntries(
    locales.map((locale) => [locale, mergeDefaults(defaultTexts[locale], stored?.[locale])])
  ) as TextsContent;
}

export async function getDict(locale: Locale): Promise<Dictionary> {
  return (await getTexts())[locale];
}

export async function getProjects(): Promise<Project[]> {
  const list = await read<Project[]>("projects", []);
  // Если фото ещё не загрузили — подставляем общий фон, чтобы страница не падала
  return (Array.isArray(list) ? list : []).map((project) => ({
    ...project,
    image: project.image?.trim() ? project.image : "/img/page-hero.jpg",
  }));
}

export async function getPartners(): Promise<PartnersContent> {
  return read<PartnersContent>("partners", { representatives: [], partners: [] });
}

export async function getContacts(): Promise<ContactsContent> {
  return read<ContactsContent>("contacts", { blocks: [] });
}

/** Запись из админки. */
export async function writeContent(file: ContentFile, data: unknown) {
  await writeStored(files[file], data);
}

export async function readContent(file: ContentFile): Promise<unknown> {
  return read<unknown>(file, null);
}

/** То же, но мимо кэша — нужно перед точечным сохранением, чтобы не потерять чужие правки. */
export async function readContentFresh(file: ContentFile): Promise<unknown> {
  return readStored<unknown>(files[file], null, true);
}

/* ─────────── заявки, статистика, интеграции ─────────── */

export async function getBeforeAfter(): Promise<BeforeAfterContent> {
  const data = await read<BeforeAfterContent>("beforeafter", { items: [] });
  const items = Array.isArray(data?.items) ? data.items : [];
  // показываем только заполненные пары
  return { items: items.filter((item) => item.before?.trim() && item.after?.trim()) };
}

export async function getLeads(): Promise<LeadsContent> {
  const data = await read<LeadsContent>("leads", { items: [] });
  return { items: Array.isArray(data?.items) ? data.items : [] };
}

/** Добавляет заявку в начало списка. Возвращает записанную заявку. */
export async function addLead(input: Omit<Lead, "id" | "createdAt" | "status">): Promise<Lead> {
  const lead: Lead = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    status: "new",
  };
  const { items } = await getLeads();
  await writeContent("leads", { items: [lead, ...items].slice(0, MAX_LEADS) });
  return lead;
}

/** Настройки SEO. Раздела может не быть — тогда пустая заготовка. */
export async function getSeo(): Promise<SeoContent> {
  const base = emptySeo();
  const data = await read<Partial<SeoContent>>("seo", base);

  const pages = Object.fromEntries(
    seoPages.map((page) => {
      const saved = data?.pages?.[page];
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
    verification: { ...base.verification, ...data?.verification },
    analytics: { ...base.analytics, ...data?.analytics },
  };
}

export async function getStats(): Promise<StatsContent> {
  const data = await read<StatsContent>("stats", { days: {} });
  return { days: data?.days && typeof data.days === "object" ? data.days : {} };
}

/** Считает просмотр страницы; `firstInSession` — новый посетитель за сессию. */
export async function trackView(firstInSession: boolean) {
  const { days } = await getStats();
  const key = new Date().toISOString().slice(0, 10);
  const day = days[key] ?? { views: 0, visits: 0 };

  days[key] = { views: day.views + 1, visits: day.visits + (firstInSession ? 1 : 0) };

  const trimmed = Object.fromEntries(
    Object.entries(days)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, MAX_DAYS)
  );
  await writeContent("stats", { days: trimmed });
}

export async function getIntegrations(): Promise<IntegrationsContent> {
  const data = await read<IntegrationsContent>("integrations", {
    telegram: { enabled: false, token: "", chatId: "" },
  });
  // на хостинге ключи удобнее держать в настройках проекта, а не в файле
  const token = (process.env.TELEGRAM_BOT_TOKEN || data?.telegram?.token || "").trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID || data?.telegram?.chatId || "").trim();
  const fromEnv = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

  return {
    telegram: {
      enabled: fromEnv || Boolean(data?.telegram?.enabled),
      token,
      chatId,
    },
  };
}
