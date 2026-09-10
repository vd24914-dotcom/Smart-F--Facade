import type { MetadataRoute } from "next";
import { getSeo } from "@/content/store";
import { siteOrigin } from "@/data/seo";

/** robots.txt: пока «показывать сайт» выключено — закрываем его от поиска целиком. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeo();
  const base = siteOrigin(seo.siteUrl);

  if (!seo.indexing) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
    host: base || undefined,
  };
}
