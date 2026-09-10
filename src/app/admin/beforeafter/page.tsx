import { requireAuth } from "@/lib/require-auth";
import { readContent, getTexts, getSite } from "@/content/store";
import type { BeforeAfterContent } from "@/content/store";
import BeforeAfterEditor from "@/components/admin/BeforeAfterEditor";

export const dynamic = "force-dynamic";

export default async function AdminBeforeAfterPage() {
  await requireAuth();

  let content: BeforeAfterContent = { items: [] };
  try {
    content = await readContent("beforeafter") as BeforeAfterContent;
  } catch {
    // файла ещё нет — начинаем с пустого списка
  }

  return (
    <BeforeAfterEditor
      initial={{ items: content.items ?? [] }}
      texts={await getTexts()}
      site={await getSite()}
    />
  );
}
