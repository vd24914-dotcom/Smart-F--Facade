import SafeImage from "@/components/ui/safe-image";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  logos: string[];
  className?: string;
};

/**
 * Сетка логотипов ячейками: тонкие линии, шахматная подложка
 * и «плюсы» на пересечениях — как в logo-cloud.
 */
export default function LogoCloud({ logos, className }: Props) {
  const items = logos.filter((logo) => logo.trim().length > 0);
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "relative grid grid-cols-2 overflow-hidden rounded-2xl border border-navy/10 bg-white sm:grid-cols-3 lg:grid-cols-5",
        className
      )}
    >
      {items.map((logo, index) => (
        <div
          key={`${logo}-${index}`}
          className={cn(
            "group relative flex items-center justify-center border-b border-r border-navy/10 px-5 py-7",
            index % 2 === 1 && "bg-mist/60"
          )}
        >
          <SafeImage
            src={logo}
            alt=""
            width={240}
            height={80}
            style={{ filter: "var(--logo-tint)" }}
            className="h-[54px] w-full max-w-[150px] object-contain transition duration-300 [--logo-tint:grayscale(1)_opacity(0.75)] group-hover:scale-105 group-hover:[--logo-tint:none]"
          />

          {/* «плюс» на пересечении линий; лишние обрезаются рамкой */}
          <Plus
            aria-hidden
            strokeWidth={1}
            className="pointer-events-none absolute -bottom-[12.5px] -right-[12.5px] z-10 size-6 text-navy/25"
          />
        </div>
      ))}
    </div>
  );
}
