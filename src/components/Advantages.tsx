import FeatureGrid from "@/components/ui/feature-grid";
import type { Dictionary } from "@/i18n/dictionaries";

/** Оставлено для совместимости: блок преимуществ теперь собирается из FeatureGrid. */
export default function Advantages({ dict, icons }: { dict: Dictionary; icons: string[] }) {
  return (
    <FeatureGrid
      title={dict.pages.about.advantagesTitle}
      description={dict.pages.about.advantagesLead}
      items={dict.pages.about.advantages.map((item, index) => ({ ...item, icon: icons[index] }))}
    />
  );
}
