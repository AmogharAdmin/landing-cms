import { readFile } from "node:fs/promises";
import path from "node:path";
import { createPostgresConnection, loadProjectEnvironment } from "./postgres-env.mjs";

const projectRoot = process.cwd();
const requiredSections = [
  "site", "theme", "offerBar", "header", "navigation", "hero", "bookingCard",
  "heroFacts", "about", "highlights", "amenities", "homes", "gallery", "location",
  "enquiry", "stickyCTA", "footer", "seo",
];

async function main() {
  await loadProjectEnvironment(projectRoot);
  const raw = await readFile(path.join(projectRoot, "data", "site.json"), "utf8");
  const content = JSON.parse(raw);
  const missing = requiredSections.filter((section) => !(section in content));
  if (!content || Array.isArray(content) || missing.length) {
    throw new Error(`data/site.json is invalid or missing sections: ${missing.join(", ")}`);
  }

  const connection = await createPostgresConnection();
  try {
    const existing = await connection.query("SELECT id FROM site_pages WHERE slug = $1 LIMIT 1", ["home"]);
    if (existing.rows.length) {
      process.stdout.write("Skipped: site_pages already contains the 'home' record. Existing production content was not overwritten.\n");
      return;
    }
    await connection.query(
      "INSERT INTO site_pages (slug, content) VALUES ($1, $2::jsonb)",
      ["home", JSON.stringify(content)],
    );
    process.stdout.write("Success: data/site.json was inserted into PostgreSQL as site_pages.slug='home'.\n");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  process.stderr.write(`Content migration failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
