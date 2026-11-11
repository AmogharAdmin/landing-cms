import { readFile } from "node:fs/promises";
import path from "node:path";
import { createPostgresConnection, loadProjectEnvironment } from "./postgres-env.mjs";

const projectRoot = process.cwd();

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Add newly introduced defaults without replacing values already managed in /admin.
 * Object arrays with stable `id` fields receive new fields on matching items, while
 * deleted/reordered items remain deleted/reordered. Other existing arrays are kept.
 */
function mergeMissing(defaultValue, currentValue) {
  if (Array.isArray(defaultValue)) {
    if (!Array.isArray(currentValue)) return clone(defaultValue);
    const defaultsById = new Map(
      defaultValue
        .filter((item) => isRecord(item) && typeof item.id === "string")
        .map((item) => [item.id, item]),
    );
    if (!defaultsById.size) return currentValue;
    return currentValue.map((item) => {
      if (!isRecord(item) || typeof item.id !== "string") return item;
      const matchingDefault = defaultsById.get(item.id);
      return matchingDefault ? mergeMissing(matchingDefault, item) : item;
    });
  }

  if (isRecord(defaultValue)) {
    if (!isRecord(currentValue)) return clone(defaultValue);
    const merged = { ...currentValue };
    for (const [key, value] of Object.entries(defaultValue)) {
      merged[key] = key in currentValue ? mergeMissing(value, currentValue[key]) : clone(value);
    }
    return merged;
  }

  return currentValue === undefined ? defaultValue : currentValue;
}

/** Preserve the older GA-coupled GTM setting when adding the standalone GTM object. */
function migrateLegacyGoogleTagManager(currentValue) {
  if (!isRecord(currentValue) || "googleTagManager" in currentValue) return currentValue;
  const legacy = currentValue.googleAnalytics;
  if (!isRecord(legacy) || typeof legacy.gtmContainerId !== "string") return currentValue;

  const containerId = legacy.gtmContainerId.trim().toUpperCase();
  if (!/^GTM-[A-Z0-9]+$/.test(containerId)) return currentValue;

  return {
    ...currentValue,
    googleTagManager: {
      enabled: legacy.enabled === true,
      containerId,
    },
  };
}

async function main() {
  await loadProjectEnvironment(projectRoot);
  const defaults = JSON.parse(await readFile(path.join(projectRoot, "data", "site.json"), "utf8"));
  if (!isRecord(defaults)) throw new Error("data/site.json must contain a JSON object.");

  const connection = await createPostgresConnection();
  try {
    await connection.query("BEGIN");
    const result = await connection.query(
      "SELECT id, content FROM site_pages WHERE slug = $1 LIMIT 1 FOR UPDATE",
      ["home"],
    );

    if (!result.rows[0]) {
      await connection.query(
        "INSERT INTO site_pages (slug, content) VALUES ($1, $2::jsonb)",
        ["home", JSON.stringify(defaults)],
      );
      await connection.query("COMMIT");
      process.stdout.write("Success: created the 'home' page from data/site.json.\n");
      return;
    }

    const row = result.rows[0];
    const storedCurrent = typeof row.content === "string" ? JSON.parse(row.content) : row.content;
    const current = migrateLegacyGoogleTagManager(storedCurrent);
    const merged = mergeMissing(defaults, current);
    if (JSON.stringify(merged) === JSON.stringify(storedCurrent)) {
      await connection.query("COMMIT");
      process.stdout.write("No changes: PostgreSQL already contains every payload field.\n");
      return;
    }

    await connection.query(
      "INSERT INTO site_page_versions (site_page_id, content, changed_by) VALUES ($1, $2::jsonb, NULL)",
      [row.id, JSON.stringify(storedCurrent)],
    );
    await connection.query(
      "UPDATE site_pages SET content = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [JSON.stringify(merged), row.id],
    );
    await connection.query("COMMIT");
    process.stdout.write("Success: missing payload fields were added without overwriting existing CMS values.\n");
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  process.stderr.write(`Content synchronization failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
