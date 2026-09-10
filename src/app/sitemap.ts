import type { MetadataRoute } from "next";
import { getProjects, getSeo } from "@/content/store";
import { locales } from "@/i18n/config";
import { siteOrigin } from "@/data/seo";

const sections = ["", "/about", "/services", "/projects", "/partners", "/contacts"];

/** Карта сайта собирается сама: разделы на трёх языках плюс страницы всех объектов. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getSeo();
  const base = siteOrigin(seo.siteUrl);
  if (!base) return [];

  const now = new Date();
  const projects = (await getProjects()).map((project) => `/projects/${project.id}`);
  const paths = [...sections, ...projects];

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${base}/${locale}${path}`,
      lastModified: now,
      changeFrequency: (path === "" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: path === "" ? 1 : path.startsWith("/projects/") ? 0.6 : 0.8,
      alternates: {
        languages: Object.fromEntries(locales.map((loc) => [loc, `${base}/${loc}${path}`])),
      },
    }))
  );
}
