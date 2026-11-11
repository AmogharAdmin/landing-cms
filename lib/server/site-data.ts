import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import { bundledSiteData } from "@/lib/site";
import { shouldUseBundledSiteData } from "@/lib/server/cms-environment";
import { getPageContent } from "@/lib/server/site-content";
import { readSiteJsonFile } from "@/lib/server/site-json-file";
import { isDatabaseConfigured } from "@/lib/server/db";
import type { SiteData } from "@/types/site";

export { shouldUseBundledSiteData } from "@/lib/server/cms-environment";

async function loadBundledSiteData(): Promise<SiteData> {
  try {
    return await readSiteJsonFile();
  } catch (error) {
    console.error("Unable to read data/site.json. Falling back to bundled import.", error);
    return bundledSiteData;
  }
}

export const getSiteData = cache(async (): Promise<SiteData> => {
  if (shouldUseBundledSiteData()) return loadBundledSiteData();

  await connection();
  if (!isDatabaseConfigured()) {
    console.warn("PostgreSQL is not configured. Serving the bundled JSON fallback.");
    return bundledSiteData;
  }

  try {
    const content = await getPageContent("home");
    if (content) return content;
    console.error("The PostgreSQL site_pages table has no 'home' record. Serving the bundled JSON fallback.");
  } catch (error) {
    console.error("Unable to read landing-page content from PostgreSQL. Serving the bundled JSON fallback.", error);
  }
  return bundledSiteData;
});
