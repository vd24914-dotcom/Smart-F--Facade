/** Страницы, у которых своя карточка в поиске. Без обращения к файлам — можно использовать в браузере. */
export const seoPages = ["home", "about", "services", "projects", "partners", "contacts"] as const;

/**
 * Приводит адрес сайта из админки к нормальному виду.
 *
 * В поле можно вписать что угодно — «smartfacade.uz», «сайт», лишний пробел.
 * Здесь это чинится: добавляется https://, убирается косая черта в конце.
 * Если адрес разобрать нельзя — возвращается пустая строка, и сайт просто
 * работает без канонических ссылок. Раньше в этом месте падали все страницы.
 */
export function siteOrigin(raw: string | undefined | null): string {
  const value = (raw ?? "").trim();
  if (!value) return "";

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    // адрес без точки в имени (например «тест») — это не сайт
    if (!url.hostname.includes(".")) return "";
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return "";
  }
}

export type SeoPage = (typeof seoPages)[number];
