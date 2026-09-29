import { readFile } from "node:fs/promises";
import { Pool } from "pg";

async function migrateUtilityPortal() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set for the utility-portal migration.");
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("neon.tech") ? { rejectUnauthorized: false } : false,
    max: 1,
  });
  let client;
  let transactionOpen = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionOpen = true;

    const migration = await readFile(
      new URL("../migrations/0005_create_utility_portal.sql", import.meta.url),
      "utf8",
    );
    await client.query(migration);

    const { rows } = await client.query(
      `SELECT count(*)::int AS table_count
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = ANY($1::text[])`,
      [[
        "utility_users",
        "utility_consumers",
        "utility_connections",
        "utility_bills",
        "utility_payments",
        "utility_service_requests",
        "utility_sessions",
      ]],
    );
    if (rows[0]?.table_count !== 7) {
      throw new Error("Utility portal table verification failed.");
    }

    await client.query("COMMIT");
    transactionOpen = false;
    console.log("Utility portal tables and fictional demo records are ready.");
  } catch (error) {
    if (transactionOpen && client) {
      await client.query("ROLLBACK").catch(() => {});
    }
    throw error;
  } finally {
    client?.release();
    await pool.end();
  }
}

migrateUtilityPortal().catch((error) => {
  console.error(error instanceof Error ? error.message : "Utility portal migration failed.");
  process.exitCode = 1;
});