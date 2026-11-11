import "server-only";

import { getDatabasePool } from "@/lib/server/db";

let ensured: Promise<void> | null = null;

const REQUIRED_COLUMNS: Record<string, Record<string, string>> = {
  form_submissions: {
    utm_term: "VARCHAR(200) NULL",
    gclid: "VARCHAR(255) NULL",
  },
  crm_lead_forwards: {
    utm_term: "VARCHAR(200) NULL",
    gclid: "VARCHAR(255) NULL",
  },
  visitor_sessions: {
    utm_source: "VARCHAR(200) NULL",
    utm_medium: "VARCHAR(200) NULL",
    utm_campaign: "VARCHAR(200) NULL",
    utm_term: "VARCHAR(200) NULL",
    utm_content: "VARCHAR(200) NULL",
    gclid: "VARCHAR(255) NULL",
    landing_path: "VARCHAR(300) NULL",
    source_channel: "VARCHAR(32) NOT NULL DEFAULT 'direct'",
  },
};

/**
 * Adds attribution / traffic-source columns on databases created before they existed.
 * Only missing columns on existing tables are altered: ALTER TABLE requires table
 * ownership even with IF NOT EXISTS, and the app role is not always the owner.
 * Failures are logged, never thrown, so reads keep working once the schema SQL has been applied.
 */
export function ensureAttributionColumns(): Promise<void> {
  if (!ensured) {
    ensured = runEnsure().catch((error) => {
      console.error("Attribution column check failed", error);
      ensured = null;
    });
  }
  return ensured;
}

async function runEnsure() {
  const pool = getDatabasePool();
  const existing = await pool.query<{ table_name: string; column_name: string }>(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = ANY($1::text[])`,
    [Object.keys(REQUIRED_COLUMNS)],
  );

  const columnsByTable = new Map<string, Set<string>>();
  for (const row of existing.rows) {
    if (!columnsByTable.has(row.table_name)) columnsByTable.set(row.table_name, new Set());
    columnsByTable.get(row.table_name)!.add(row.column_name);
  }

  for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
    const present = columnsByTable.get(table);
    if (!present) continue;
    const missing = Object.entries(columns).filter(([column]) => !present.has(column));
    if (!missing.length) continue;
    try {
      await pool.query(
        `ALTER TABLE ${table} ${missing
          .map(([column, definition]) => `ADD COLUMN IF NOT EXISTS ${column} ${definition}`)
          .join(", ")}`,
      );
      if (table === "visitor_sessions") {
        await pool.query(
          `CREATE INDEX IF NOT EXISTS idx_visitor_sessions_channel
             ON visitor_sessions (source_channel, first_seen_at DESC)`,
        );
      }
    } catch (error) {
      console.error(`Unable to add attribution columns to ${table}`, error);
    }
  }
}
