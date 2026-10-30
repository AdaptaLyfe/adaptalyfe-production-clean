import ws from "ws";
import pg from "pg";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;
const isNeon = connectionString.includes("neon.tech");

/** Neon uses websocket pool; local Postgres (127.0.0.1) uses node-postgres. */
export const pool = isNeon
  ? (() => {
      neonConfig.webSocketConstructor = ws;
      return new NeonPool({ connectionString });
    })()
  : new pg.Pool({
      connectionString,
      // Store and read every timestamp in UTC. `timestamp` columns have no time
      // zone, and the app reads them back as UTC; a Postgres server running in
      // a local zone (e.g. India, UTC+5:30) would otherwise save defaultNow()
      // values 5.5 hours ahead, making the 7-day trial run long.
      options: "-c TimeZone=UTC",
    });

export const db = isNeon
  ? drizzleNeon({ client: pool as NeonPool, schema })
  : drizzlePg({ client: pool as pg.Pool, schema });
