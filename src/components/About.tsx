import Image from "next/image";
import type { Dictionary } from "@/i18n/dictionaries";


export default function About({
  dict,
  icons,
  photo,
}: {
  dict: Dictionary;
  icons: string[];
  photo: string;
}) {
  return (
    <section id="about" className="bg-white py-14 lg:py-[50px]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-5 lg:grid-cols-[600px_120px_1fr] lg:gap-0">
        <div className="flex flex-col justify-center">
          <h2 className="text-[28px] font-extrabold uppercase leading-[1.25] text-black-soft lg:text-[36px] lg:leading-[45px]">
            {dict.about.title}
          </h2>
          <div className="rule-gold mt-5" />
          <h3 className="mt-5 text-[18px] font-extrabold leading-[25px] text-graphite lg:text-[20px]">
            {dict.about.subtitle}
          </h3>
          <p className="mt-5 max-w-[590px] text-[16px] font-light leading-[27px] text-graphite lg:text-[18px]">
            {dict.about.text}
          </p>
        </div>

        <div className="flex flex-row items-center justify-start gap-8 lg:flex-col lg:justify-center lg:gap-0">
          {icons.map((icon, index) => (
            <div key={icon} className="flex w-[90px] flex-col items-center py-2">
              <span className="text-center text-[14px] font-extrabold leading-[17.5px] text-black-soft">
                {dict.about.specs[index]}
              </span>
              <Image
                src={icon}
                alt=""
                width={87}
                height={50}
                className="mt-2 h-[50px] w-[86px] object-contain"
              />
            </div>
          ))}
        </div>

        <div className="relative flex items-center justify-center lg:pl-20 lg:pt-10">
          <Image
            src={photo}
            alt={dict.about.subtitle}
            width={382}
            height={430}
            className="h-auto w-full max-w-[382px] shadow-[64px_64px_160px_-40px_rgba(0,0,0,0.24)]"
          />
        </div>
      </div>
    </section>
  );
}
