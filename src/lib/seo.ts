import type { Metadata } from "next";
import { getSeo } from "@/content/store";
import type { SeoPage } from "@/data/seo";
import { locales, type Locale } from "@/i18n/config";

/** Запасные заголовки, если в админке поля ещё не заполнены. */
const fallback: Record<SeoPage, Record<Locale, { title: string; description: string }>> = {
  home: {
    ru: {
      title: "Фасадные материалы и решения",
      description:
        "Полный комплекс услуг в фасадном сегменте: материалы, подсистемы, монтаж и готовые решения.",
    },
    uz: {
      title: "Fasad materiallari va yechimlari",
      description:
        "Fasad sohasida to‘liq xizmatlar majmuasi: materiallar, quyi tizimlar, montaj va tayyor yechimlar.",
    },
    en: {
      title: "Facade materials and solutions",
      description:
        "A full range of facade services: materials, subsystems, installation and turnkey solutions.",
    },
  },
  about: {
    ru: { title: "О компании", description: "" },
    uz: { title: "Kompaniya haqida", description: "" },
    en: { title: "About the company", description: "" },
  },
  services: {
    ru: { title: "Услуги", description: "" },
    uz: { title: "Xizmatlar", description: "" },
    en: { title: "Services", description: "" },
  },
  projects: {
    ru: { title: "Наши проекты", description: "" },
    uz: { title: "Loyihalarimiz", description: "" },
    en: { title: "Our projects", description: "" },
  },
  partners: {
    ru: { title: "Партнёры", description: "" },
    uz: { title: "Hamkorlar", description: "" },
    en: { title: "Partners", description: "" },
  },
  contacts: {
    ru: { title: "Контакты", description: "" },
    uz: { title: "Kontaktlar", description: "" },
    en: { title: "Contacts", description: "" },
  },
};

const paths: Record<SeoPage, string> = {
  home: "",
  about: "/about",
  services: "/services",
  projects: "/projects",
  partners: "/partners",
  contacts: "/contacts",
};

/** Ссылки на этот же раздел на других языках — поисковики любят такие подсказки. */
export function alternates(path: string, locale: Locale, siteUrl: string) {
  const base = siteUrl.replace(/\/$/, "");
  const languages = Object.fromEntries(
    locales.map((loc) => [loc, `${base}/${loc}${path}`])
  ) as Record<string, string>;

  return {
    canonical: `${base}/${locale}${path}`,
    languages: { ...languages, "x-default": `${base}/ru${path}` },
  };
}

/** Метатеги страницы: берём из админки, пустые поля закрываем запасным текстом. */
export async function pageMetadata(page: SeoPage, locale: Locale): Promise<Metadata> {
  const seo = await getSeo();
  const saved = seo.pages[page]?.[locale];
  const spare = fallback[page][locale];
  const brand = seo.brand.trim();

  const title = saved?.title?.trim() || (brand ? `${spare.title} — ${brand}` : spare.title);
  const description = saved?.description?.trim() || spare.description || undefined;
  const keywords = saved?.keywords?.trim() || undefined;

  const meta: Metadata = {
    title,
    description,
    keywords,
    robots: seo.indexing ? undefined : { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      locale,
      siteName: brand || undefined,
      images: seo.shareImage ? [seo.shareImage] : undefined,
    },
    twitter: {
      card: seo.shareImage ? "summary_large_image" : "summary",
      title,
      description,
      images: seo.shareImage ? [seo.shareImage] : undefined,
    },
  };

  if (seo.siteUrl.trim()) {
    meta.metadataBase = new URL(seo.siteUrl.trim());
    meta.alternates = alternates(paths[page], locale, seo.siteUrl.trim());
  }

  const verification: Record<string, string> = {};
  if (seo.verification.google.trim()) verification.google = seo.verification.google.trim();
  if (seo.verification.yandex.trim()) verification.yandex = seo.verification.yandex.trim();
  if (Object.keys(verification).length) meta.verification = verification;

  if (seo.favicon.trim()) meta.icons = { icon: seo.favicon.trim() };

  return meta;
}

/** Метатеги страницы одного объекта. */
export async function projectMetadata({
  locale,
  slug,
  title,
  description,
  image,
  seoTitle,
  seoDescription,
}: {
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
}): Promise<Metadata> {
  const seo = await getSeo();
  const brand = seo.brand.trim();
  const finalTitle = seoTitle?.trim() || (brand ? `${title} — ${brand}` : title);
  const finalDescription = seoDescription?.trim() || description?.trim() || undefined;
  const share = image || seo.shareImage;

  const meta: Metadata = {
    title: finalTitle,
    description: finalDescription,
    robots: seo.indexing ? undefined : { index: false, follow: false },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      type: "article",
      locale,
      siteName: brand || undefined,
      images: share ? [share] : undefined,
    },
    twitter: {
      card: share ? "summary_large_image" : "summary",
      title: finalTitle,
      description: finalDescription,
      images: share ? [share] : undefined,
    },
  };

  if (seo.siteUrl.trim()) {
    meta.metadataBase = new URL(seo.siteUrl.trim());
    meta.alternates = alternates(`/projects/${slug}`, locale, seo.siteUrl.trim());
  }

  if (seo.favicon.trim()) meta.icons = { icon: seo.favicon.trim() };

  return meta;
}
