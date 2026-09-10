import { requireAuth } from "@/lib/require-auth";
import { getPartners, getTexts, getSite } from "@/content/store";
import PartnersEditor from "@/components/admin/PartnersEditor";

export const dynamic = "force-dynamic";

export default async function PartnersAdminPage() {
  await requireAuth();
  return <PartnersEditor initial={await getPartners()} texts={await getTexts()} site={await getSite()} />;
}
