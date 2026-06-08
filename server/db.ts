import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const databaseUrl = process.env.DATABASE_URL;

export function getDatabaseHost(url: string): string {
  try {
    return new URL(url.replace(/^postgresql:/, "postgres:")).hostname;
  } catch {
    return "(invalid DATABASE_URL)";
  }
}

function useSsl(url: string): boolean | { rejectUnauthorized: boolean } {
  if (
    process.env.NODE_ENV === "production" ||
    url.includes("supabase") ||
    url.includes("render.com") ||
    /sslmode=(require|verify-full)/.test(url)
  ) {
    return { rejectUnauthorized: false };
  }
  return false;
}

// Supabase pooler (PgBouncer) closes connections that use prepared statements.
function usesPgBouncer(url: string): boolean {
  return (
    url.includes("pooler.supabase.com") ||
    url.includes("pgbouncer=true") ||
    url.includes(":6543/")
  );
}

const dbHost = getDatabaseHost(databaseUrl);
if (dbHost.startsWith("db.") && dbHost.endsWith(".supabase.co")) {
  console.warn(
    "DATABASE_URL uses Supabase direct connection (db.*.supabase.co). " +
      "Use the Session pooler URL (pooler.supabase.com) on Render instead.",
  );
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSsl(databaseUrl),
  max: 10,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 30_000,
  ...(usesPgBouncer(databaseUrl) && { prepare: false }),
});

pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err.message);
});

export const db = drizzle(pool, { schema });

export async function verifyDatabaseConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    console.log(`Database connected (${dbHost}, ssl=${!!useSsl(databaseUrl)})`);
  } finally {
    client.release();
  }
}
