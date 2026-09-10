import DrawIcon from "@/components/ui/draw-icon";
import type { Dictionary } from "@/i18n/dictionaries";


export default function Services({ dict, icons }: { dict: Dictionary; icons: string[] }) {
  return (
    <section id="services" className="bg-white py-14 lg:py-[50px]">
      <div className="mx-auto max-w-[1200px] px-5">
        <h2 className="text-[28px] font-extrabold uppercase leading-[1.25] text-black-soft lg:text-[36px] lg:leading-[45px]">
          {dict.services.title}
        </h2>
        <div className="rule-gold mt-5" />
        <p className="mt-6 max-w-[600px] text-[16px] font-light leading-[27px] text-graphite lg:text-[18px]">
          {dict.services.lead}
        </p>

        <div className="mt-10 grid grid-cols-2 gap-y-8 lg:grid-cols-4 lg:gap-y-0">
          {icons.map((icon, index) => (
            <div
              key={icon}
              className="flex flex-col items-center px-2.5 lg:border-r lg:border-hairline lg:last:border-r-0"
            >
              <h3 className="text-center text-[18px] font-bold uppercase tracking-[3px] text-black-soft lg:text-[28px] lg:leading-[42px]">
                {dict.services.items[index]}
              </h3>
              <DrawIcon
                src={icon}
                delay={index * 220}
                className="mt-4 h-[140px] w-[140px] lg:h-[195px] lg:w-[195px]"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
