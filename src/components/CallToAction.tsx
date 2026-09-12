import { Send } from "lucide-react";
import SafeImage from "@/components/ui/safe-image";
import CalcForm from "@/components/ui/calc-form";
import type { Dictionary } from "@/i18n/dictionaries";
import type { SiteContent } from "@/content/store";
import { findSocial } from "@/data/socials";

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
  const telegram = findSocial(site?.socials, "telegram", "t.me");

  return (
    <section id="request" className="scroll-mt-24 bg-white px-3 py-10 sm:px-5 lg:py-14">
      {/* тёмная подложка на случай, если фоновое фото не задано */}
      <div className="relative isolate mx-auto max-w-[1320px] overflow-hidden rounded-[28px] bg-ink lg:rounded-[40px]">
        <SafeImage src={image} alt="" fill sizes="100vw" onMissing="hide" className="-z-20 object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-ink/80" aria-hidden />

        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] lg:gap-14 lg:px-12 lg:py-16">
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

          {telegram && (
            <a
              href={telegram.url}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-white/25 px-5 py-3 text-[14px] font-semibold text-white transition hover:border-gold hover:text-gold"
            >
              <Send className="size-4" strokeWidth={1.8} />
              {dict.calc?.telegram || "Telegram"}
            </a>
          )}
        </div>

        <CalcForm dict={dict} source="calc" />
        </div>
      </div>
    </section>
  );
}
