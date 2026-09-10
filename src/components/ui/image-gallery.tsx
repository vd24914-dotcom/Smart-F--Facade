import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type GalleryItem = {
  /** подпись под фото и alt */
  title: string;
  /** путь к изображению из public/ */
  image: string;
  /** куда ведёт плитка; без ссылки плитка просто не кликается */
  href?: string;
};

type Props = {
  title?: string;
  description?: string;
  items: GalleryItem[];
  /** кнопка справа от заголовка, например «Посмотреть все» */
  action?: { label: string; href: string; icon?: string };
  /** accordion — лента с раскрытием по наведению, grid — спокойная сетка */
  variant?: "accordion" | "grid";
  className?: string;
};

/**
 * Светлая галерея-«гармошка»: при наведении плитка раскрывается на всю ширину,
 * остальные сжимаются. На мобильных — обычная сетка, потому что наведения нет.
 */
export default function ImageGallery({ title, description, items, action, variant = "accordion", className }: Props) {
  if (items.length === 0) return null;

  return (
    <section className={cn("w-full bg-mist/60 py-14 lg:py-20", className)}>
      <div className="mx-auto max-w-[1200px] px-5">
        {(title || description || action) && (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[720px]">
              {title && (
                <h2 className="text-[28px] font-extrabold uppercase leading-[1.25] text-black-soft lg:text-[36px] lg:leading-[45px]">
                  {title}
                </h2>
              )}
              <div className="rule-gold mt-5" />
              {description && (
                <p className="mt-6 text-[16px] font-light leading-[27px] text-graphite lg:text-[18px]">
                  {description}
                </p>
              )}
            </div>

            {action && (
              <Link
                href={action.href}
                className="inline-flex w-fit items-center gap-4 rounded-[30px] bg-gold-btn px-5 py-4 text-[14px] font-semibold leading-[14px] text-white transition-opacity hover:opacity-90"
              >
                {action.label}
                {action.icon && (
                  <Image src={action.icon} alt="" width={14} height={14} className="h-[14px] w-[14px]" />
                )}
              </Link>
            )}
          </div>
        )}

        {/* Десктоп: раскрывающаяся лента */}
        <div className={cn("mt-10 hidden h-[420px] w-full items-stretch gap-3", variant === "accordion" && "md:flex")}>
          {items.map((item, index) => {
            const Tile = item.href ? Link : "div";
            return (
              <Tile
                // @ts-expect-error href есть только у Link, для div он не нужен
                href={item.href}
                key={`${item.image}-${index}`}
                className="group relative flex-[1_1_0%] overflow-hidden rounded-xl border border-hairline/15 bg-white transition-[flex] duration-500 ease-out hover:flex-[4_1_0%]"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 1280px) 50vw, 640px"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                />

                {/* Затемнение снизу — чтобы подпись читалась на любом фото */}
                <div
                  className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/75 to-transparent opacity-90"
                  aria-hidden
                />

                <span className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-[12px] font-bold text-black-soft">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="absolute inset-x-0 bottom-0 p-4">
                  <span className="block h-[3px] w-10 bg-gold transition-all duration-500 group-hover:w-16" />
                  <span className="mt-3 block whitespace-nowrap text-[15px] font-bold uppercase leading-[20px] text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100 lg:text-[18px]">
                    {item.title}
                  </span>
                </span>
              </Tile>
            );
          })}
        </div>

        {/* Сетка: на мобильных всегда, на десктопе — в варианте grid */}
        <div className={cn("mt-8 grid grid-cols-2 gap-3", variant === "accordion" ? "md:hidden" : "md:mt-10 md:grid-cols-3")}>
          {items.map((item, index) => {
            const Tile = item.href ? Link : "div";
            return (
              <Tile
                // @ts-expect-error href есть только у Link, для div он не нужен
                href={item.href}
                key={`${item.image}-m-${index}`}
                className={cn("relative block overflow-hidden rounded-xl border border-hairline/15", variant === "grid" ? "aspect-[4/3]" : "aspect-[3/4]")}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 380px"
                  className="object-cover object-center"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-3 text-[12px] font-bold uppercase leading-[16px] text-white">
                  {item.title}
                </span>
              </Tile>
            );
          })}
        </div>
      </div>
    </section>
  );
}
