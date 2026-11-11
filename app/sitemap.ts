import type { MetadataRoute } from "next";
import { getSiteData } from "@/lib/server/site-data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteData = await getSiteData();
  return [
    {
      url: siteData.seo.canonical,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
