"use client";

import { motion } from "framer-motion";
import SafeImage from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  /** логотипы: пути к картинкам из админки */
  logos: string[];
  /** маленькая подпись над заголовком */
  eyebrow?: string;
  title?: string;
  description?: string;
  className?: string;
};

/**
 * Облако логотипов: при появлении на экране логотипы проявляются один за другим
 * из лёгкого размытия. Серые по умолчанию, цветные при наведении — как и в
 * остальных блоках с логотипами на сайте.
 */
export default function CinematicLogoCloud({ id, logos, eyebrow, title, description, className }: Props) {
  const items = logos.filter((logo) => logo.trim().length > 0);
  if (items.length === 0) return null;

  return (
    <section id={id} className={cn("relative isolate overflow-hidden bg-white py-16 scroll-mt-24 lg:py-20", className)}>
      <div
        className="pointer-events-none absolute -top-72 left-1/2 -z-10 size-[520px] -translate-x-1/2 rounded-full bg-navy/15 blur-[300px]"
        aria-hidden
      />

      <div className="mx-auto max-w-[1200px] px-5 text-center">
        {eyebrow && (
          <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
        )}
        {title && (
          <h2 className="mt-3 text-[26px] font-extrabold uppercase leading-[1.25] text-navy lg:text-[36px]">
            {title}
          </h2>
        )}
        <div className="rule-gold mx-auto mt-5" />
        {description && (
          <p className="mx-auto mt-5 max-w-[640px] text-[15px] font-light leading-[26px] text-graphite lg:text-[17px]">
            {description}
          </p>
        )}

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } }, hidden: {} }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-6 lg:gap-x-8"
        >
          {items.map((logo, index) => (
            <motion.div
              key={`${logo}-${index}`}
              variants={{
                hidden: { opacity: 0, y: 20, filter: "blur(12px)" },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              className="group flex h-[72px] w-[calc(50%-12px)] items-center justify-center rounded-2xl border border-navy/10 bg-white px-4 shadow-[0_25px_60px_-45px_rgba(8,19,36,0.55)] transition duration-300 hover:-translate-y-1 hover:border-navy/25 sm:h-[88px] sm:w-auto sm:min-w-[180px] sm:px-6"
            >
              <SafeImage
                src={logo}
                alt=""
                width={240}
                height={80}
                style={{ filter: "var(--logo-tint)" }}
                className="h-[44px] w-auto max-w-[140px] object-contain transition duration-300 [--logo-tint:grayscale(1)_opacity(0.75)] group-hover:[--logo-tint:none]"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
