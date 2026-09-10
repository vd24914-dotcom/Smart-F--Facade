import { requireAuth } from "@/lib/require-auth";
import { getTexts, getSite } from "@/content/store";
import HomeEditor from "@/components/admin/HomeEditor";

export const dynamic = "force-dynamic";

export default async function HomeAdminPage() {
  await requireAuth();
  return <HomeEditor texts={await getTexts()} site={await getSite()} />;
}
