import Image from "next/image";
import LeadForm from "@/components/ui/lead-form";
import type { Dictionary } from "@/i18n/dictionaries";
import type { SiteContent } from "@/content/store";

/** Финальный блок: текст-призыв слева и форма заявки справа. */
export default function CallToAction({
  dict,
  image,
  site,
}: {
  dict: Dictionary;
  image: string;
  site?: SiteContent;
}) {
  const t = dict.pages.contacts;

  return (
    <section className="bg-white px-3 py-10 sm:px-5 lg:py-14">
      <div className="relative isolate mx-auto max-w-[1320px] overflow-hidden rounded-[28px] lg:rounded-[40px]">
        <Image src={image} alt="" fill sizes="100vw" className="-z-20 object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-ink/80" aria-hidden />

        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-16 lg:px-12 lg:py-16">
        <div>
          <div className="rule-gold" />
          <h2 className="mt-5 text-[26px] font-extrabold uppercase leading-[1.25] text-white lg:text-[36px] lg:leading-[45px]">
            {dict.cta.title.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
          <p className="mt-5 text-[16px] font-light leading-[27px] text-mist lg:text-[18px]">
            {dict.cta.text.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>

          {site && (
            <div className="mt-8">
              <p className="text-[12px] font-semibold uppercase tracking-[2px] text-white/50">
                {dict.hero.phonesLabel}
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
                {site.phones.map((phone) => (
                  <li key={phone}>
                    <a
                      href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                      className="text-[18px] font-semibold text-white transition-colors hover:text-gold lg:text-[20px]"
                    >
                      {phone}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <LeadForm
          source="cta"
          labels={{
            title: t.formTitle,
            name: t.name,
            phone: t.phone,
            message: t.message,
            submit: t.submit,
            done: dict.footer.callbackDone,
            error: dict.footer.callbackError,
          }}
        />
        </div>
      </div>
    </section>
  );
}
