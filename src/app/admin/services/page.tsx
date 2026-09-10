import { requireAuth } from "@/lib/require-auth";
import { getTexts, getSite } from "@/content/store";
import ServicesEditor from "@/components/admin/ServicesEditor";

export const dynamic = "force-dynamic";

export default async function ServicesAdminPage() {
  await requireAuth();
  return <ServicesEditor texts={await getTexts()} site={await getSite()} />;
}
