import { requireAuth } from "@/lib/require-auth";
import { getTexts, getSite } from "@/content/store";
import GeneralEditor from "@/components/admin/GeneralEditor";

export const dynamic = "force-dynamic";

export default async function GeneralAdminPage() {
  await requireAuth();
  return <GeneralEditor texts={await getTexts()} site={await getSite()} />;
}
