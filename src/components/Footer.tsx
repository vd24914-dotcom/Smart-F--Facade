import FooterSection from "@/components/ui/footer-section";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { SiteContent } from "@/content/store";



export default function Footer({
  dict,
  locale,
  site,
}: {
  dict: Dictionary;
  locale: Locale;
  site: SiteContent;
}) {
  // Раньше подписи брались из отдельного списка и сопоставлялись со ссылками
  // по порядку — стоило поменять порядок, и «Проекты» вели на материалы.
  // Теперь подпись и адрес заданы вместе.
  const links = [
    { label: dict.nav.about, href: `/${locale}/about` },
    { label: dict.nav.services, href: `/${locale}/services` },
    { label: dict.nav.materials, href: `/${locale}#materials` },
    { label: dict.nav.contacts, href: `/${locale}/contacts` },
  ];

  return (
    <FooterSection
      logo={site.images.logoHeader}
      companyName={site.name}
      about={dict.hero.lead}
      titles={{
        company: dict.footer.companyTitle,
        contacts: dict.footer.contactsTitle,
        social: dict.footer.socialTitle,
        subscribe: dict.footer.callbackTitle,
      }}
      subscribe={{
        text: dict.footer.callbackText,
        placeholder: dict.footer.callbackPlaceholder,
        done: dict.footer.callbackDone,
        error: dict.footer.callbackError,
      }}
      links={links}
      address={dict.footer.address}
      phones={site.phones}
      email={site.email}
      socials={site.socials}
      copyright={dict.footer.copyright}
    />
  );
}
