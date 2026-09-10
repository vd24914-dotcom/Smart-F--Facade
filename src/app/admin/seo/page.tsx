import { requireAuth } from "@/lib/require-auth";
import { getSeo } from "@/content/store";
import SeoEditor from "@/components/admin/SeoEditor";

export const dynamic = "force-dynamic";

export default async function SeoAdminPage() {
  await requireAuth();
  return <SeoEditor initial={getSeo()} />;
}
