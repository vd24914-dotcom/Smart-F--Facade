import Reveal, { RevealGroup } from "@/components/ui/reveal";
import type { Dictionary } from "@/i18n/dictionaries";

/** «Как мы работаем»: пронумерованные шаги от заявки до сопровождения монтажа. */
export default function ProcessSteps({ dict }: { dict: Dictionary }) {
  const steps = (dict.process?.steps ?? []).filter((step) => step.title?.trim());
  if (steps.length === 0) return null;

  return (
    <section id="process" className="scroll-mt-24 bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-[1200px] px-5">
        <Reveal>
          <h2 className="text-[26px] font-extrabold uppercase leading-[1.25] text-navy lg:text-[36px]">
            {dict.process.title}
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <div className="rule-gold mt-5" />
        </Reveal>
        {dict.process.lead?.trim() && (
          <Reveal delay={180}>
            <p className="mt-5 max-w-[680px] text-[15px] font-light leading-[26px] text-graphite lg:text-[17px]">
              {dict.process.lead}
            </p>
          </Reveal>
        )}

        <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" step={90}>
          {steps.map((step, index) => (
            <article
              key={step.title || index}
              className="group relative overflow-hidden rounded-2xl border border-navy/10 bg-white p-6 pt-7 shadow-[0_25px_60px_-45px_rgba(8,19,36,0.55)] transition duration-300 hover:-translate-y-1 hover:border-navy/25"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-2 -top-4 text-[76px] font-extrabold leading-none text-navy/[0.06] transition-colors duration-500 group-hover:text-gold/20"
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="flex size-10 items-center justify-center rounded-full bg-navy text-[14px] font-bold text-white">
                {index + 1}
              </div>

              <h3 className="relative mt-5 text-[17px] font-bold uppercase leading-[24px] text-navy">
                {step.title}
              </h3>
              <p className="relative mt-2 text-[15px] font-light leading-[25px] text-graphite">
                {step.text}
              </p>
            </article>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
