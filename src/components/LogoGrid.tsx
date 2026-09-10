import LogoCloud from "@/components/ui/logo-cloud";

type Props = {
  id?: string;
  title: string;
  logos: string[];
};

export default function LogoGrid({ id, title, logos }: Props) {
  const items = logos.filter((logo) => logo.trim().length > 0);
  if (items.length === 0) return null;

  return (
    <section id={id} className="bg-white py-12 lg:py-16">
      <div className="mx-auto max-w-[1200px] px-5">
        <h2 className="text-[24px] font-extrabold uppercase leading-[1.25] text-navy lg:text-[32px]">
          {title}
        </h2>
        <div className="rule-gold mt-5" />

        <LogoCloud logos={items} className="mt-10" />
      </div>
    </section>
  );
}
