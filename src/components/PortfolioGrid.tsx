"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import SafeImage from "@/components/ui/safe-image";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { buildings, materials, type Building, type Material } from "@/data/portfolio";
import type { Project } from "@/content/store";

/** Строка фильтра: подпись слева, кнопки-таблетки с числом объектов. */
function FilterRow<T extends string>({
  label,
  options,
  active,
  onSelect,
  count,
}: {
  label: string;
  options: { value: T; label: string }[];
  active: T;
  onSelect: (value: T) => void;
  count: (value: T) => number;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
      <p className="sf-filter__label shrink-0 text-[12px] font-bold uppercase tracking-[1.4px] text-navy lg:w-[156px]">
        {label}
      </p>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === active;
          const total = count(option.value);
          const disabled = total === 0 && !selected;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              disabled={disabled}
              aria-pressed={selected}
              className={[
                "sf-chip group inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold transition-all duration-200",
                selected
                  ? "sf-chip--on bg-navy text-white shadow-[0_10px_24px_-12px_rgba(41,79,123,0.9)]"
                  : disabled
                    ? "sf-chip--off cursor-not-allowed border border-navy/10 bg-white/60 text-slate-400"
                    : "sf-chip--idle border border-navy/15 bg-white text-graphite hover:-translate-y-0.5 hover:border-navy hover:text-navy",
              ].join(" ")}
            >
              {option.label}
              <span
                className={[
                  "sf-chip__count min-w-[20px] rounded-full px-1.5 text-center text-[11px] font-bold leading-[18px] transition-colors",
                  selected
                    ? "bg-white/20 text-white"
                    : "bg-navy/[0.07] text-navy/70 group-hover:bg-navy/10",
                ].join(" ")}
              >
                {total}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PortfolioGrid({
  dict,
  locale,
  projects,
}: {
  dict: Dictionary;
  locale: Locale;
  projects: Project[];
}) {
  const t = dict.pages.projects;

  const [building, setBuilding] = useState<Building | "all">("all");
  const [material, setMaterial] = useState<Material | "all">("all");

  // Показываем в фильтрах только те категории, по которым есть объекты
  const usedBuildings = buildings.filter((b) => projects.some((p) => p.building === b));
  const usedMaterials = materials.filter((m) => projects.some((p) => p.materials.includes(m)));

  const visible = useMemo(
    () =>
      projects.filter(
        (item) =>
          (building === "all" || item.building === building) &&
          (material === "all" || item.materials.includes(material))
      ),
    [building, material, projects]
  );

  // сколько объектов попадёт в каждый фильтр с учётом второго фильтра
  const countBuilding = (value: Building | "all") =>
    projects.filter(
      (item) =>
        (value === "all" || item.building === value) &&
        (material === "all" || item.materials.includes(material))
    ).length;

  const countMaterial = (value: Material | "all") =>
    projects.filter(
      (item) =>
        (building === "all" || item.building === building) &&
        (value === "all" || item.materials.includes(value))
    ).length;

  return (
    <section className="bg-white py-12 lg:py-16">
      <div className="mx-auto max-w-[1200px] px-5">
        <div className="sf-filter rounded-[24px] border border-navy/10 bg-mist/70 p-5 lg:rounded-[28px] lg:p-7">
          <FilterRow
            label={t.buildingLabel}
            options={[
              { value: "all" as const, label: t.all },
              ...usedBuildings.map((b) => ({ value: b, label: t.buildings[b] })),
            ]}
            active={building}
            onSelect={setBuilding}
            count={countBuilding}
          />

          <div className="sf-filter__divider my-5 h-px bg-navy/10 lg:my-6" />

          <FilterRow
            label={t.materialLabel}
            options={[
              { value: "all" as const, label: t.all },
              ...usedMaterials.map((m) => ({ value: m, label: t.materials[m] })),
            ]}
            active={material}
            onSelect={setMaterial}
            count={countMaterial}
          />
        </div>

        {visible.length === 0 ? (
          <p className="mt-12 text-[16px] font-light text-graphite">{t.empty}</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => {
              const text = item.texts[locale];
              return (
                <article
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-[22px] border border-navy/10 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-navy/20 hover:shadow-[0_28px_60px_-34px_rgba(8,19,36,0.5)]"
                >
                  <Link href={`/${locale}/projects/${item.id}`} className="relative block aspect-[265/260] w-full overflow-hidden">
                    <SafeImage
                      src={item.image}
                      alt={text.imageAlt?.trim() || text.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="text-[18px] font-bold uppercase leading-[1.3] text-black-soft">
                      <Link href={`/${locale}/projects/${item.id}`} className="transition-colors hover:text-gold">
                        {text.title}
                      </Link>
                    </h2>
                    <div className="rule-gold mt-4" />
                    <p className="mt-4 flex-1 text-[15px] font-light leading-[25px] text-graphite">{text.text}</p>

                    <Link
                      href={`/${locale}/projects/${item.id}`}
                      className="mt-6 inline-flex w-fit items-center gap-3 rounded-[30px] bg-gold-btn px-5 py-3 text-[14px] font-semibold leading-[14px] text-white transition-opacity hover:opacity-90"
                    >
                      {t.open}
                      <Image src="/icons/arrow.svg" alt="" width={14} height={14} className="h-[14px] w-[14px]" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
