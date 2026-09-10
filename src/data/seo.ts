/** Страницы, у которых своя карточка в поиске. Без обращения к файлам — можно использовать в браузере. */
export const seoPages = ["home", "about", "services", "projects", "partners", "contacts"] as const;

export type SeoPage = (typeof seoPages)[number];
