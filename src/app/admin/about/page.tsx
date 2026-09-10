import { requireAuth } from "@/lib/require-auth";
import { getTexts, getSite } from "@/content/store";
import AboutEditor from "@/components/admin/AboutEditor";

export const dynamic = "force-dynamic";

export default async function AboutAdminPage() {
  await requireAuth();
  return <AboutEditor texts={getTexts()} site={getSite()} />;
}
