import "server-only";

import { isDatabaseConfigured } from "@/lib/server/db";

/** Running on any Vercel deployment (production or preview). */
export function isVercelDeployment(): boolean {
  return process.env.VERCEL === "1";
}

/** Live production deployment — the only hosted environment that may write CMS content to PostgreSQL. */
export function isProductionCmsDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/**
 * Opt-in: use PostgreSQL for CMS read/write on a local machine (migration/sync testing).
 * Routine local editing should leave this unset and use data/site.json instead.
 */
export function isLocalDatabaseCmsEnabled(): boolean {
  return process.env.CMS_USE_DATABASE === "true";
}

/** Read and write site content from data/site.json instead of PostgreSQL. */
export function shouldUseBundledSiteData(): boolean {
  if (isLocalDatabaseCmsEnabled()) return false;
  return !isVercelDeployment();
}

/** Whether PostgreSQL CMS writes are permitted in the current environment. */
export function canWriteCmsToDatabase(): boolean {
  if (!isDatabaseConfigured()) return false;
  if (isLocalDatabaseCmsEnabled()) return true;
  return isProductionCmsDeployment();
}

export function getCmsStorageLabel(): string {
  if (shouldUseBundledSiteData()) return "data/site.json (local only)";
  if (canWriteCmsToDatabase()) return "PostgreSQL (production)";
  return "PostgreSQL (read-only)";
}
