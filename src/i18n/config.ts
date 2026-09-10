export const locales = ["ru", "uz", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

export const localeNames: Record<Locale, string> = {
  ru: "RU",
  uz: "UZ",
  en: "EN",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
