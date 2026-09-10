import Image from "next/image";

/** Шапка внутренней страницы: карточка с фото, отступы от краёв и скруглённые углы. */
export default function PageHero({ title, image }: { title: string; image: string }) {
  return (
    <section className="bg-white px-3 pb-2 pt-24 sm:px-5 lg:pt-28">
      <div className="relative isolate mx-auto max-w-[1320px] overflow-hidden rounded-[28px] lg:rounded-[40px]">
        <Image
          src={image}
          alt=""
          fill
          sizes="100vw"
          priority
          className="-z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-ink/70" aria-hidden />

        <div className="mx-auto flex max-w-[1200px] items-center px-6 py-16 sm:px-10 lg:px-12 lg:py-20">
          <h1 className="text-[28px] font-extrabold uppercase leading-[1.25] text-white lg:text-[46px]">
            {title}
          </h1>
        </div>
      </div>
    </section>
  );
}
