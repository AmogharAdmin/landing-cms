import siteJson from "@/data/site.json";
import type { SiteData } from "@/types/site";

export const bundledSiteData = siteJson as SiteData;

/** @deprecated Public components should use SiteDataProvider. */
export const siteData = bundledSiteData;
