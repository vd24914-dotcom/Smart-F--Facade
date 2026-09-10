"use client";

import { useState } from "react";
import Reveal2 from "@/components/ui/reveal2";
import type { Locale } from "@/i18n/config";
import type { BeforeAfterItem } from "@/content/store";
import { cn } from "@/lib/utils";

type Props = {
  items: BeforeAfterItem[];
  locale: Locale;
  title: string;
  lead?: string;
  beforeLabel: string;
  afterLabel: string;
};

/** Блок «до / после»: слева описание и переключатель объектов, справа шторка сравнения. */
export default function BeforeAfter({
  items,
  locale,
  title,
  lead,
  beforeLabel,
  afterLabel,
}: Props) {
  const [index, setIndex] = useState(0);

  if (items.length === 0) return null;

  const active = items[Math.min(index, items.length - 1)];

  return (
    <section className="bg-white py-14 lg:py-20">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-navy/15 bg-navy/5 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[2px] text-navy">
            {beforeLabel} / {afterLabel}
          </span>

          <h2 className="mt-4 text-[24px] font-extrabold uppercase leading-[1.2] text-navy lg:text-[32px]">
            {title}
          </h2>
          <div className="mt-4 h-[3px] w-24 rounded-full bg-gradient-to-r from-gold to-gold/10" />

          {lead && (
            <p className="mt-5 max-w-[560px] text-[15px] font-light leading-[26px] text-graphite lg:text-[16px]">
              {lead}
            </p>
          )}

          {active.text?.[locale] && (
            <p className="mt-4 max-w-[560px] text-[15px] font-light leading-[26px] text-graphite">
              {active.text[locale]}
            </p>
          )}

          {items.length > 1 && (
            <ul className="mt-7 flex flex-wrap gap-2">
              {items.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    className={cn(
                      "rounded-full border px-4 py-2.5 text-[13px] font-semibold transition",
                      i === index
                        ? "border-navy bg-navy text-white"
                        : "border-slate-200 text-navy hover:-translate-y-0.5 hover:border-navy"
                    )}
                  >
                    {item.title?.[locale] || `${i + 1}`}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Reveal2
          key={active.id}
          before={{ src: active.before, alt: active.title?.[locale] }}
          after={{ src: active.after, alt: active.title?.[locale] }}
          beforeLabel={beforeLabel}
          afterLabel={afterLabel}
        />
      </div>
    </section>
  );
}
