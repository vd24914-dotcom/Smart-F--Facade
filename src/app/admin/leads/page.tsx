import { requireAuth } from "@/lib/require-auth";
import { getIntegrations, getLeads } from "@/content/store";
import LeadsEditor from "@/components/admin/LeadsEditor";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  await requireAuth();

  const { items } = await getLeads();
  const integrations = await getIntegrations();

  return <LeadsEditor initial={items} integrations={integrations} />;
}
