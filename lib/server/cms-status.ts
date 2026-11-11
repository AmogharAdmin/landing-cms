import "server-only";

import { getDatabasePool, isDatabaseConfigured } from "@/lib/server/db";
import { analyticsTablesReady } from "@/lib/server/analytics";
import { isLocalDatabaseCmsEnabled, shouldUseBundledSiteData } from "@/lib/server/cms-environment";
import { isBlobUploadConfigured } from "@/lib/server/uploads";

export type CmsSetupIssue = {
  id: string;
  title: string;
  detail: string;
  fix: string;
};

export type CmsSetupWarning = {
  id: string;
  title: string;
  detail: string;
  fix?: string;
};

export type CmsStatus = {
  ready: boolean;
  databaseConfigured: boolean;
  databaseConnected: boolean;
  schemaReady: boolean;
  contentSeeded: boolean;
  authConfigured: boolean;
  blobConfigured: boolean;
  smtpConfigured: boolean;
  analyticsReady: boolean;
  summary: string;
  issues: CmsSetupIssue[];
  warnings: CmsSetupWarning[];
};

function authConfigured() {
  const secret = process.env.AUTH_SECRET?.trim();
  return Boolean(secret && secret.length >= 32);
}

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_USER?.trim()
    && process.env.SMTP_PASS?.trim()
    && process.env.MAIL_RECIPIENT?.trim(),
  );
}

function isMissingRelationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /relation .* does not exist|undefined table/i.test(message);
}

export async function getCmsStatus(): Promise<CmsStatus> {
  const issues: CmsSetupIssue[] = [];
  const warnings: CmsSetupWarning[] = [];

  const authReady = authConfigured();
  if (!authReady) {
    issues.push({
      id: "missing_auth_secret",
      title: "AUTH_SECRET is not configured",
      detail: "Admin sessions need a secret of at least 32 characters.",
      fix: "Add AUTH_SECRET to Vercel → Project Settings → Environment Variables, then redeploy.",
    });
  }

  const databaseConfigured = isDatabaseConfigured();
  if (!databaseConfigured) {
    issues.push({
      id: "missing_database_url",
      title: "DATABASE_URL is not set",
      detail: "This deployment has no PostgreSQL connection string.",
      fix: "Add the Neon pooled DATABASE_URL (-pooler in the hostname) to Vercel env vars and redeploy.",
    });

    return {
      ready: false,
      databaseConfigured: false,
      databaseConnected: false,
      schemaReady: false,
      contentSeeded: false,
      authConfigured: authReady,
      blobConfigured: isBlobUploadConfigured(),
      smtpConfigured: smtpConfigured(),
      analyticsReady: false,
      summary: "Database is not configured on this deployment.",
      issues,
      warnings,
    };
  }

  let databaseConnected = false;
  let schemaReady = false;
  let contentSeeded = false;

  try {
    const pool = getDatabasePool();
    await pool.query("SELECT 1");
    databaseConnected = true;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown connection error.";
    issues.push({
      id: "database_connection_failed",
      title: "Cannot connect to PostgreSQL",
      detail,
      fix: "Verify the Neon pooled DATABASE_URL, SSL settings, and that the database is active. Redeploy after updating env vars.",
    });

    return {
      ready: false,
      databaseConfigured: true,
      databaseConnected: false,
      schemaReady: false,
      contentSeeded: false,
      authConfigured: authReady,
      blobConfigured: isBlobUploadConfigured(),
      smtpConfigured: smtpConfigured(),
      analyticsReady: false,
      summary: "PostgreSQL connection failed.",
      issues,
      warnings,
    };
  }

  try {
    await getDatabasePool().query("SELECT id FROM site_pages LIMIT 1");
    schemaReady = true;
  } catch (error) {
    if (isMissingRelationError(error)) {
      issues.push({
        id: "missing_schema",
        title: "Database tables are not created yet",
        detail: "The site_pages table does not exist in this database.",
        fix: "Run database/postgresql-schema.sql in the Neon SQL editor, or connect locally and execute the schema file.",
      });
    } else {
      issues.push({
        id: "schema_check_failed",
        title: "Database schema check failed",
        detail: error instanceof Error ? error.message : "Unknown schema error.",
        fix: "Confirm database/postgresql-schema.sql was applied to this database.",
      });
    }

    return {
      ready: false,
      databaseConfigured: true,
      databaseConnected: true,
      schemaReady: false,
      contentSeeded: false,
      authConfigured: authReady,
      blobConfigured: isBlobUploadConfigured(),
      smtpConfigured: smtpConfigured(),
      analyticsReady: false,
      summary: "PostgreSQL is connected, but CMS tables are missing.",
      issues,
      warnings,
    };
  }

  try {
    const result = await getDatabasePool().query<{ id: number }>(
      "SELECT id FROM site_pages WHERE slug = $1 LIMIT 1",
      ["home"],
    );
    contentSeeded = result.rows.length > 0;
    if (!contentSeeded) {
      issues.push({
        id: "missing_home_content",
        title: "Initial page content is not seeded",
        detail: "The site_pages table exists, but there is no slug='home' record yet.",
        fix: "Run: DATABASE_URL=\"your-neon-url\" npm run migrate-content — then refresh this page.",
      });
    }
  } catch (error) {
    issues.push({
      id: "content_check_failed",
      title: "Unable to verify page content",
      detail: error instanceof Error ? error.message : "Unknown content check error.",
      fix: "Check PostgreSQL permissions and rerun npm run migrate-content.",
    });
  }

  if (!isBlobUploadConfigured()) {
    warnings.push({
      id: "missing_blob",
      title: "Image uploads are not configured",
      detail: "BLOB_READ_WRITE_TOKEN (and optional Blog_STORE_ID) are missing.",
      fix: "Create a Vercel Blob store for this project and add the token env vars, then redeploy.",
    });
  }

  if (!smtpConfigured()) {
    warnings.push({
      id: "missing_smtp",
      title: "Lead email delivery is not configured",
      detail: "SMTP_USER, SMTP_PASS, or MAIL_RECIPIENT is missing.",
      fix: "Add SMTP env vars in Vercel if this site should send enquiry emails.",
    });
  }

  const analyticsReady = await analyticsTablesReady();
  if (!analyticsReady) {
    warnings.push({
      id: "missing_analytics_schema",
      title: "Analytics tables are not created yet",
      detail: "Visitor tracking and form submission storage need the analytics schema.",
      fix: "Run database/postgresql-schema.sql in the Neon SQL editor, then redeploy.",
    });
  }

  if (shouldUseBundledSiteData() && isDatabaseConfigured() && !isLocalDatabaseCmsEnabled()) {
    warnings.push({
      id: "local_cms_uses_site_json",
      title: "Local CMS uses data/site.json",
      detail: "DATABASE_URL is set locally but content saves go to data/site.json and do not affect production.",
      fix: "Edit at localhost with npm run dev. Use the production /admin URL to update the live site.",
    });
  }

  const ready = issues.length === 0;
  const summary = ready
    ? "Connected securely to PostgreSQL."
    : issues[0]?.title || "Setup is incomplete.";

  return {
    ready,
    databaseConfigured: true,
    databaseConnected: true,
    schemaReady,
    contentSeeded,
    authConfigured: authReady,
    blobConfigured: isBlobUploadConfigured(),
    smtpConfigured: smtpConfigured(),
    analyticsReady,
    summary,
    issues,
    warnings,
  };
}
