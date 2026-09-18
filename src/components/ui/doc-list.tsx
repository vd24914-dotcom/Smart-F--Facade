import { Download, FileText, FileSpreadsheet, Image as ImageIcon } from "lucide-react";
import Reveal, { RevealGroup } from "@/components/ui/reveal";

export type DocFile = { title: string; text: string; file: string };

/** Значок по расширению: человеку сразу видно, PDF это или фотография. */
function kindOf(file: string) {
  const ext = file.toLowerCase().split("?")[0].split(".").pop() ?? "";
  if (["xls", "xlsx", "csv"].includes(ext)) return { Icon: FileSpreadsheet, label: ext.toUpperCase() };
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return { Icon: ImageIcon, label: ext.toUpperCase() };
  return { Icon: FileText, label: ext ? ext.toUpperCase() : "ФАЙЛ" };
}

/**
 * Список документов под карточками блока «Документы и сертификаты».
 *
 * Карточки выше объясняют, какие бумаги бывают. Здесь лежат сами файлы —
 * их можно открыть или скачать, не звоня и не спрашивая.
 */
export default function DocList({
  title,
  items,
  downloadLabel,
}: {
  title: string;
  items: DocFile[];
  downloadLabel: string;
}) {
  const ready = items.filter((item) => item.file?.trim() && item.title?.trim());
  if (ready.length === 0) return null;

  return (
    <div className="mt-12">
      {title?.trim() && (
        <Reveal>
          <h3 className="text-[15px] font-bold uppercase tracking-[1.5px] text-navy">{title}</h3>
        </Reveal>
      )}

      <RevealGroup className="mt-5 grid gap-3 md:grid-cols-2" step={70}>
        {ready.map((item, index) => {
          const { Icon, label } = kindOf(item.file);
          return (
            <a
              key={item.file + index}
              href={item.file}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-navy/10 bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-navy/30 hover:shadow-[0_25px_60px_-45px_rgba(8,19,36,0.55)]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-mist text-navy transition-colors group-hover:bg-navy group-hover:text-white">
                <Icon className="size-5" strokeWidth={1.6} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold text-navy">{item.title}</span>
                {item.text?.trim() && (
                  <span className="mt-0.5 block text-[13px] leading-[19px] text-graphite">{item.text}</span>
                )}
              </span>

              <span className="flex shrink-0 items-center gap-2 text-[12px] font-semibold uppercase tracking-[1px] text-slate-400 transition-colors group-hover:text-navy">
                <span className="hidden sm:inline">{label}</span>
                <Download className="size-4" strokeWidth={1.8} />
                <span className="sr-only">{downloadLabel}</span>
              </span>
            </a>
          );
        })}
      </RevealGroup>
    </div>
  );
}
