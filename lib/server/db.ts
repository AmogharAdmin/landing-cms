import "server-only";

import { lookup as dnsLookup } from "node:dns";
import { Pool, type PoolConfig } from "pg";

declare global {
  var __amoghaaPostgresPool: Pool | undefined;
  var __amoghaaPostgresPoolKey: string | undefined;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function postgresSsl(connectionString: string): PoolConfig["ssl"] {
  if (/sslmode=disable/i.test(connectionString)) return false;
  return { rejectUnauthorized: false };
}

function lookupIPv4(
  hostname: string,
  _options: unknown,
  callback: (error: NodeJS.ErrnoException | null, address: string, family: number) => void,
) {
  dnsLookup(hostname, { family: 4, all: false }, callback);
}

export function postgresClientConfig(connectionString: string, applicationName: string): PoolConfig {
  const config: PoolConfig = {
    connectionString,
    ssl: postgresSsl(connectionString),
    keepAlive: true,
    connectionTimeoutMillis: 20_000,
    idleTimeoutMillis: 30_000,
    application_name: applicationName,
  };
  return Object.assign(config, { lookup: lookupIPv4 });
}

export function getDatabasePool(): Pool {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL. Add the pooled Neon connection string to the server environment.");
  }

  const poolKey = `${connectionString}|ssl-ipv4-v2`;
  if (global.__amoghaaPostgresPool && global.__amoghaaPostgresPoolKey === poolKey) {
    return global.__amoghaaPostgresPool;
  }

  if (global.__amoghaaPostgresPool) {
    void global.__amoghaaPostgresPool.end().catch(() => undefined);
  }

  const pool = new Pool({
    ...postgresClientConfig(connectionString, "amoghaa-cms"),
    max: 10,
  });
  pool.on("error", (error) => {
    console.error("Unexpected idle PostgreSQL connection error", error);
  });
  global.__amoghaaPostgresPool = pool;
  global.__amoghaaPostgresPoolKey = poolKey;
  return pool;
}
