import { requireAuth } from "@/lib/require-auth";
import { getProjects, getDict, getTexts, getSite } from "@/content/store";
import ProjectsEditor from "@/components/admin/ProjectsEditor";

export const dynamic = "force-dynamic";

export default async function ProjectsAdminPage() {
  await requireAuth();
  return (
    <ProjectsEditor
      initial={getProjects()}
      labels={getDict("ru")}
      texts={getTexts()}
      site={getSite()}
    />
  );
}
