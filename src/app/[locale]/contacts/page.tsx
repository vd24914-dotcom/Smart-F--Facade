import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import SocialMark from "@/components/ui/social-mark";
import CalcForm from "@/components/ui/calc-form";
import { isLocale, locales } from "@/i18n/config";
import { getDict, getSite, getContacts } from "@/content/store";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata("contacts", isLocale(locale) ? locale : "ru");
}

export default async function ContactsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDict(locale);
  const site = await getSite();
  const { blocks } = await getContacts();
  const t = dict.pages.contacts;

  const socials = site.socials.filter((item) => item.url?.trim());

  const hrefFor = (link: string, value: string) => {
    if (link === "tel") return `tel:${value.replace(/[^+\d]/g, "")}`;
    if (link === "mail") return `mailto:${value}`;
    if (link === "url") return value;
    return null;
  };

  return (
    <>
      <PageHero title={t.heading} image={site.images.pageHero} />

      <section className="bg-white py-14 lg:py-20">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-5 lg:grid-cols-2 lg:gap-20">
          <div>
            {blocks.map((block) => (
              <div key={block.id} className="mb-8">
                <h2 className="text-[18px] font-extrabold uppercase text-black-soft">{block.title[locale]}</h2>
                <ul className="mt-2 space-y-1">
                  {(block.items[locale] ?? []).map((value) => {
                    const href = hrefFor(block.link, value);
                    return (
                      <li key={value} className="text-[16px] font-light leading-[27px] text-graphite">
                        {href ? (
                          <a href={href} className="transition-colors hover:text-gold">
                            {value}
                          </a>
                        ) : (
                          value
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <div className="mt-8">
              <h2 className="text-[18px] font-extrabold uppercase text-black-soft">{t.socialTitle}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {socials.map((social) => (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    title={social.label}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white transition-transform hover:-translate-y-0.5 hover:opacity-90"
                  >
                    <SocialMark social={social} className="h-6 w-6" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <CalcForm dict={dict} source="contacts" className="bg-white p-0 shadow-none sm:p-0" />
        </div>
      </section>
    </>
  );
}
