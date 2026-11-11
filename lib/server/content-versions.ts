import "server-only";

import { canWriteCmsToDatabase } from "@/lib/server/cms-environment";
import { getDatabasePool, isDatabaseConfigured } from "@/lib/server/db";
import { normalizeRecordIds } from "@/lib/server/normalize-ids";
import { updatePageContent } from "@/lib/server/site-content";
import type { SiteData } from "@/types/site";

const DEFAULT_PAGE_SLUG = "home";

export type ContentVersionListItem = {
  id: number;
  site_page_id: number;
  created_at: Date | string;
  changed_by: number | null;
  changed_by_email: string | null;
  site_name: string;
  seo_title: string;
  bytes: number;
  is_current: boolean;
};

export type ContentVersionDetail = ContentVersionListItem & {
  content: SiteData;
};

function pagination(page = 1, limit = 20) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(100, limit));
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

export async function listContentVersions(page = 1, limit = 20) {
  if (!isDatabaseConfigured()) {
    return { items: [], total: 0, page: 1, limit };
  }

  const { page: safePage, limit: safeLimit, offset } = pagination(page, limit);

  const pool = getDatabasePool();
  const [rows, countResult] = await Promise.all([
    pool.query<ContentVersionListItem>(
      `SELECT
        v.id,
        v.site_page_id,
        v.changed_by,
        v.created_at,
        u.email AS changed_by_email,
        COALESCE(v.content->'site'->>'name', 'Untitled') AS site_name,
        COALESCE(v.content->'seo'->>'title', '') AS seo_title,
        COALESCE(octet_length(v.content::text), 0)::int AS bytes,
        (
          v.id = (
            SELECT v2.id
            FROM site_page_versions v2
            WHERE md5(v2.content::text) = (
              SELECT md5(p.content::text)
              FROM site_pages p
              WHERE p.slug = $3
              LIMIT 1
            )
            ORDER BY v2.created_at DESC
            LIMIT 1
          )
        ) AS is_current
       FROM site_page_versions v
       LEFT JOIN admin_users u ON u.id = v.changed_by
       ORDER BY v.created_at DESC
       LIMIT $1 OFFSET $2`,
      [safeLimit, offset, DEFAULT_PAGE_SLUG],
    ),
    pool.query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM site_page_versions`),
  ]);

  return {
    items: rows.rows,
    total: Number(countResult.rows[0]?.total || 0),
    page: safePage,
    limit: safeLimit,
  };
}

export async function getContentVersion(id: number): Promise<ContentVersionDetail | null> {
  if (!isDatabaseConfigured()) return null;

  const result = await getDatabasePool().query<ContentVersionListItem & { content: SiteData }>(
    `SELECT
      v.id,
      v.site_page_id,
      v.changed_by,
      v.created_at,
      u.email AS changed_by_email,
      COALESCE(v.content->'site'->>'name', 'Untitled') AS site_name,
      COALESCE(v.content->'seo'->>'title', '') AS seo_title,
      COALESCE(octet_length(v.content::text), 0)::int AS bytes,
      v.content
     FROM site_page_versions v
     LEFT JOIN admin_users u ON u.id = v.changed_by
     WHERE v.id = $1
     LIMIT 1`,
    [id],
  );

  const row = result.rows[0];
  if (!row) return null;

  const content = typeof row.content === "string" ? JSON.parse(row.content) as SiteData : row.content;
  return { ...row, content };
}

export async function deleteContentVersion(id: number) {
  const result = await getDatabasePool().query<{ id: number }>(
    `DELETE FROM site_page_versions WHERE id = $1 RETURNING id`,
    [id],
  );
  return result.rows.length > 0;
}

export async function deleteContentVersions(ids: Array<number | string>) {
  const unique = normalizeRecordIds(ids);
  if (!unique.length) return 0;

  const result = await getDatabasePool().query<{ id: number }>(
    `DELETE FROM site_page_versions WHERE id = ANY($1::bigint[]) RETURNING id`,
    [unique],
  );
  return result.rows.length;
}

/** Stores the current live page. Called only from the Backup now action. */
export async function createManualContentBackup(adminUserId: number, slug = DEFAULT_PAGE_SLUG) {
  if (!canWriteCmsToDatabase()) {
    throw new Error("Backups can only be saved on the live production site.");
  }

  const pool = getDatabasePool();
  const existing = await pool.query<{ id: number | string; content: unknown }>(
    "SELECT id, content FROM site_pages WHERE slug = $1 LIMIT 1",
    [slug],
  );
  const page = existing.rows[0];
  if (!page) throw new Error(`No site page exists for slug "${slug}".`);

  const payload = typeof page.content === "string" ? page.content : JSON.stringify(page.content);
  const inserted = await pool.query<{ id: number | string; created_at: Date | string }>(
    `INSERT INTO site_page_versions (site_page_id, content, changed_by)
     VALUES ($1, $2::jsonb, $3)
     RETURNING id, created_at`,
    [page.id, payload, adminUserId],
  );
  const row = inserted.rows[0];
  return {
    id: Number(row.id),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

export async function restoreContentVersion(
  versionId: number,
  adminUserId: number,
  slug = DEFAULT_PAGE_SLUG,
): Promise<{ restoredAt: string }> {
  if (!canWriteCmsToDatabase()) {
    throw new Error(
      "Restoring backups to PostgreSQL is only allowed on the live production site.",
    );
  }

  const version = await getContentVersion(versionId);
  if (!version) throw new Error("Backup version not found.");

  await updatePageContent(slug, version.content, adminUserId);
  return { restoredAt: new Date().toISOString() };
}

export async function contentVersionsTableReady() {
  if (!isDatabaseConfigured()) return false;
  try {
    await getDatabasePool().query("SELECT id FROM site_page_versions LIMIT 1");
    return true;
  } catch {
    return false;
  }
}
