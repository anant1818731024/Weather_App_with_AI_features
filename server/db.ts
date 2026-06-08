import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

function parseDatabaseUrl(url: string): URL {
  return new URL(url.replace(/^postgresql:/, "postgres:"));
}

export function getDatabaseHost(url: string): string {
  try {
    return parseDatabaseUrl(url).hostname;
  } catch {
    return "(invalid DATABASE_URL)";
  }
}

export function getDatabaseConnectionInfo(url: string): {
  host: string;
  port: string;
  user: string;
  isSupabase: boolean;
  isPooler: boolean;
} {
  try {
    const parsed = parseDatabaseUrl(url);
    const host = parsed.hostname;
    return {
      host,
      port: parsed.port || "5432",
      user: parsed.username,
      isSupabase: host.includes("supabase"),
      isPooler: host.includes("pooler.supabase.com"),
    };
  } catch {
    return {
      host: "(invalid)",
      port: "?",
      user: "?",
      isSupabase: false,
      isPooler: false,
    };
  }
}

/** Ensure Supabase URLs include params node-pg + pooler expect. */
function normalizeDatabaseUrl(url: string): string {
  if (!url.includes("supabase")) {
    return url;
  }

  const parsed = parseDatabaseUrl(url);

  if (!parsed.searchParams.has("sslmode")) {
    parsed.searchParams.set("sslmode", "require");
  }

  // Transaction pooler (6543) requires pgbouncer mode for node-pg / Drizzle.
  if (parsed.port === "6543" && !parsed.searchParams.has("pgbouncer")) {
    parsed.searchParams.set("pgbouncer", "true");
  }

  return parsed.toString().replace(/^postgres:/, "postgresql:");
}

function buildPoolConfig(url: string): pg.PoolConfig & { prepare?: boolean } {
  const normalizedUrl = normalizeDatabaseUrl(url);
  const { isSupabase, isPooler } = getDatabaseConnectionInfo(normalizedUrl);

  const config: pg.PoolConfig & { prepare?: boolean } = {
    connectionString: normalizedUrl,
    max: 5,
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 30_000,
    keepAlive: true,
  };

  if (isSupabase) {
    // Required for Supabase pooler (Supavisor / PgBouncer).
    config.prepare = false;
    // Let ?sslmode=require in the URL handle TLS for Supabase.
    // An extra ssl object here can cause "Connection terminated unexpectedly".
  } else if (
    process.env.NODE_ENV === "production" ||
    url.includes("render.com")
  ) {
    config.ssl = { rejectUnauthorized: false };
  }

  if (isPooler && !normalizedUrl.includes("pgbouncer=true") && normalizedUrl.includes(":5432")) {
    console.log("Using Supabase session pooler (port 5432)");
  }

  return config;
}

const databaseUrl = process.env.DATABASE_URL;
const connectionInfo = getDatabaseConnectionInfo(databaseUrl);

if (
  connectionInfo.host.startsWith("db.") &&
  connectionInfo.host.endsWith(".supabase.co")
) {
  console.warn(
    "DATABASE_URL uses Supabase direct host (db.*.supabase.co). " +
      "Use the Session pooler URL (pooler.supabase.com) instead.",
  );
}

if (connectionInfo.isSupabase && connectionInfo.user === "postgres") {
  console.warn(
    "DATABASE_URL username is 'postgres'. For Supabase pooler use postgres.PROJECT_REF " +
      "(e.g. postgres.lhflirrgvaprhelnanqn).",
  );
}

export const pool = new Pool(buildPoolConfig(databaseUrl));

pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err.message);
});

export const db = drizzle(pool, { schema });

export async function verifyDatabaseConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    console.log(
      `Database connected (host=${connectionInfo.host}, port=${connectionInfo.port}, user=${connectionInfo.user})`,
    );
  } finally {
    client.release();
  }
}
