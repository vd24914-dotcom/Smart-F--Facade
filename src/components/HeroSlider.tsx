import LuminaInteractiveList, { type LuminaSlide } from "@/components/ui/lumina-interactive-list";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Project, SiteContent } from "@/content/store";

/**
 * Главный экран: фотографии проектов переключаются «стеклянным» переходом,
 * справа — список названий с полосками прогресса.
 * Телефоны и кнопки временно убраны — переедут в другой блок.
 */
export default function HeroSlider({
  dict,
  locale,
  site,
  projects,
}: {
  dict: Dictionary;
  locale: Locale;
  site: SiteContent;
  projects: Project[];
}) {
  void site;

  const slides: LuminaSlide[] = projects.slice(0, 6).map((project) => {
    const text = project.texts[locale];
    return {
      id: project.id,
      title: text.title,
      description: text.description?.trim() || text.text,
      image: project.image,
      href: `/${locale}/projects/${project.id}`,
    };
  });

  if (slides.length === 0) return null;

  return (
    <LuminaInteractiveList
      slides={slides}
      eyebrow={dict.hero.title.join(" ")}
      linkLabel={dict.pages.projects.open}
      className="h-[100svh] min-h-[620px] max-h-[900px]"
    />
  );
}
