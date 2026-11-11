import type { MetadataRoute } from "next";
import { getSiteData } from "@/lib/server/site-data";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteData = await getSiteData();
  const base = siteData.seo.canonical.replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
