import FooterSection from "@/components/ui/footer-section";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { SiteContent } from "@/content/store";

const linkPaths = ["/about", "/services", "#materials", "/projects", "/partners"];

export default function Footer({
  dict,
  locale,
  site,
}: {
  dict: Dictionary;
  locale: Locale;
  site: SiteContent;
}) {
  const links = [
    // «#materials» — якорь блока на главной, остальное — обычные страницы
    ...dict.footer.links.map((label, index) => ({
      label,
      href: `/${locale}${linkPaths[index] ?? ""}`,
    })),
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
