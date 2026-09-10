import { requireAuth } from "@/lib/require-auth";
import { getContacts, getTexts, getSite } from "@/content/store";
import ContactsEditor from "@/components/admin/ContactsEditor";

export const dynamic = "force-dynamic";

export default async function ContactsAdminPage() {
  await requireAuth();
  return <ContactsEditor contacts={await getContacts()} texts={await getTexts()} site={await getSite()} />;
}
