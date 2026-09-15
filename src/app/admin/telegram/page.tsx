import { requireAuth } from "@/lib/require-auth";
import { getIntegrations } from "@/content/store";
import TelegramEditor from "@/components/admin/TelegramEditor";

export const dynamic = "force-dynamic";

export default async function AdminTelegramPage() {
  await requireAuth();

  const integrations = await getIntegrations();

  return <TelegramEditor initial={integrations} />;
}
