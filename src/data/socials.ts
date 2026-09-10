/**
 * Соцсети. Файл специально без обращений к файловой системе —
 * его подключают и серверные, и браузерные части сайта.
 */

/** Одна соцсеть: название, ссылка и (необязательно) своя иконка. */
export type SocialLink = {
  id: string;
  label: string;
  url: string;
  /** картинка из админки; если пусто — рисуется простой значок по названию */
  icon: string;
};

/** Ищет соцсеть по слову в названии или ссылке — для кнопок вроде «Написать в WhatsApp». */
export function findSocial(
  list: SocialLink[] | undefined,
  ...keywords: string[]
): SocialLink | undefined {
  return (list ?? []).find((item) => {
    if (!item.url?.trim()) return false;
    const haystack = `${item.label} ${item.url}`.toLowerCase();
    return keywords.some((word) => haystack.includes(word));
  });
}
