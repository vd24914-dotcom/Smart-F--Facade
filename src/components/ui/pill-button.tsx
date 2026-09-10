import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "solid" | "gold" | "outline" | "dark";

const styles: Record<Variant, string> = {
  solid: "border border-navy bg-navy text-white hover:opacity-90",
  gold: "border border-gold bg-gold text-ink hover:opacity-90",
  dark: "border border-ink bg-ink text-white hover:opacity-85",
  outline: "border border-slate-200 bg-white/80 text-navy hover:border-navy hover:bg-navy hover:text-white",
};

type Common = {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: Variant;
  className?: string;
};

const base =
  "inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-[14px] font-semibold transition duration-200 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60";

/** Единый стиль кнопок сайта: капсула с иконкой слева. */
export default function PillButton({
  children,
  icon,
  variant = "solid",
  className,
  href,
  external,
  ...rest
}: Common & {
  href?: string;
  external?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const content = (
    <>
      {icon && <span className="flex size-4 items-center justify-center">{icon}</span>}
      {children}
    </>
  );

  const classes = cn(base, styles[variant], className);

  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className={classes}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  );
}
