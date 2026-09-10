import type { MetadataRoute } from "next";
import { getSeo } from "@/content/store";

/** robots.txt: пока «показывать сайт» выключено — закрываем его от поиска целиком. */
export default function robots(): MetadataRoute.Robots {
  const seo = getSeo();
  const base = seo.siteUrl.trim().replace(/\/$/, "");

  if (!seo.indexing) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
    host: base || undefined,
  };
}
