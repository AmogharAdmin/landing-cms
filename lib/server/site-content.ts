import "server-only";

import { canWriteCmsToDatabase } from "@/lib/server/cms-environment";
import { getDatabasePool } from "@/lib/server/db";
import { parseSiteData } from "@/lib/content-schema";
import type { SiteData } from "@/types/site";

type PageRow = {
  id: number | string;
  content: string | SiteData;
  updated_at: Date;
};

function decodeContent(value: PageRow["content"]): SiteData {
  const decoded = typeof value === "string" ? JSON.parse(value) : value;
  return parseSiteData(decoded) as SiteData;
}

export async function getPageContent(slug: string): Promise<SiteData | null> {
  const result = await getDatabasePool().query<PageRow>(
    "SELECT id, content, updated_at FROM site_pages WHERE slug = $1 LIMIT 1",
    [slug],
  );
  if (!result.rows[0]) return null;
  return decodeContent(result.rows[0].content);
}

export async function updatePageContent(
  slug: string,
  content: SiteData,
  _adminUserId: number,
): Promise<void> {
  if (!canWriteCmsToDatabase()) {
    throw new Error(
      "PostgreSQL CMS writes are disabled outside the production deployment. Local edits save to data/site.json only.",
    );
  }

  const validated = parseSiteData(content);
  const connection = await getDatabasePool().connect();

  try {
    await connection.query("BEGIN");
    const result = await connection.query<PageRow>(
      "SELECT id, content, updated_at FROM site_pages WHERE slug = $1 LIMIT 1 FOR UPDATE",
      [slug],
    );
    const existing = result.rows[0];
    if (!existing) throw new Error(`No site page exists for slug \"${slug}\". Run the content migration first.`);

    await connection.query(
      "UPDATE site_pages SET content = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [JSON.stringify(validated), existing.id],
    );
    await connection.query("COMMIT");
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    connection.release();
  }
}
