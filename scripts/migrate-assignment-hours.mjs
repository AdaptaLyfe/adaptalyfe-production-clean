import { readFile } from "node:fs/promises";
import { Pool } from "pg";

async function migrateAssignmentHours() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set for the assignment-hours migration.");
  }

  const pool = new Pool({ connectionString });
  let client;
  let transactionOpen = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transactionOpen = true;

    const { rows } = await client.query(
      `SELECT data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'assignments'
         AND column_name = 'estimated_hours'`,
    );

    if (rows.length === 0) {
      throw new Error("public.assignments.estimated_hours was not found.");
    }

    const currentType = rows[0].data_type;
    if (currentType === "real") {
      await client.query("COMMIT");
      transactionOpen = false;
      console.log("Assignment estimated_hours is already decimal-compatible (real).");
      return;
    }

    if (currentType !== "integer") {
      throw new Error(
        `Unsupported estimated_hours type "${currentType}"; no schema change was made.`,
      );
    }

    if (!process.argv.includes("--apply")) {
      await client.query("ROLLBACK");
      transactionOpen = false;
      console.error(
        "estimated_hours is integer. Re-run with --apply to convert existing values to real.",
      );
      process.exitCode = 2;
      return;
    }

    const migration = await readFile(
      new URL("../migrations/0002_assignment_estimated_hours_real.sql", import.meta.url),
      "utf8",
    );
    await client.query(migration);

    const verification = await client.query(
      `SELECT data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'assignments'
         AND column_name = 'estimated_hours'`,
    );
    if (verification.rows[0]?.data_type !== "real") {
      throw new Error("The assignment-hours migration did not produce a real column.");
    }

    await client.query("COMMIT");
    transactionOpen = false;
    console.log("Converted assignments.estimated_hours from integer to real.");
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

migrateAssignmentHours().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Assignment-hours migration failed.",
  );
  process.exitCode = 1;
});