import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

export async function loadProjectEnvironment(projectRoot) {
  const candidates = [".env.local", ".env.production.local", ".env.production", ".env"];
  for (const name of candidates) {
    try {
      const content = await readFile(path.join(projectRoot, name), "utf8");
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const separator = line.indexOf("=");
        if (separator < 1) continue;
        const key = line.slice(0, separator).trim();
        let value = line.slice(separator + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = value;
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

function connectionConfig() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL. Add the pooled Neon connection string to .env.local or the server environment.");
  }
  return {
    connectionString,
    ssl: /sslmode=disable/i.test(connectionString) ? false : { rejectUnauthorized: false },
    keepAlive: true,
    connectionTimeoutMillis: 20_000,
    application_name: "amoghaa-cms-script",
  };
}

export async function createPostgresConnection() {
  const client = new Client(connectionConfig());
  await client.connect();
  return client;
}
