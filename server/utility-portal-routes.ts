import { createHash, randomBytes } from "node:crypto";
import type { Express, NextFunction, Request, Response } from "express";
import { Router } from "express";
import type { Pool } from "pg";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";

const COOKIE_NAME = "utility.sid";
const COOKIE_PATH = "/api/utility-portal";
const SESSION_HOURS = 8;
const REMEMBER_DAYS = 30;

type UtilityRequest = Request & {
  utilityUserId?: number;
  utilityConsumerId?: number;
};

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function numericRows(rows: Record<string, unknown>[], fields: string[]) {
  return rows.map((row) => ({
    ...row,
    ...Object.fromEntries(fields.map((field) => [field, Number(row[field])])),
  }));
}

async function loadDashboard(pool: Pool, userId: number) {
  const consumerResult = await pool.query(
    `SELECT id, full_name, consumer_number, service_address
     FROM utility_consumers
     WHERE utility_user_id = $1`,
    [userId],
  );
  const consumer = consumerResult.rows[0];
  if (!consumer) return null;

  const consumerId = Number(consumer.id);
  const [connections, bills, payments, requests] = await Promise.all([
    pool.query(
      `SELECT utility_type, connection_number, meter_number,
              current_reading, consumption, consumption_unit, current_bill, is_active
       FROM utility_connections
       WHERE consumer_id = $1
       ORDER BY CASE utility_type WHEN 'electricity' THEN 0 ELSE 1 END`,
      [consumerId],
    ),
    pool.query(
      `SELECT utility_type, bill_number, billing_period_start, billing_period_end,
              due_date, amount, status, issued_at
       FROM utility_bills
       WHERE consumer_id = $1
       ORDER BY billing_period_start DESC, utility_type`,
      [consumerId],
    ),
    pool.query(
      `SELECT payment.payment_reference, payment.amount, payment.payment_method,
              payment.paid_at, payment.status, bill.utility_type, bill.bill_number
       FROM utility_payments payment
       JOIN utility_bills bill ON bill.id = payment.bill_id
       WHERE payment.consumer_id = $1
       ORDER BY payment.paid_at DESC
       LIMIT 8`,
      [consumerId],
    ),
    pool.query(
      `SELECT ticket_number, category, description, status, created_at
       FROM utility_service_requests
       WHERE consumer_id = $1
       ORDER BY created_at DESC
       LIMIT 8`,
      [consumerId],
    ),
  ]);

  return {
    consumer: {
      name: consumer.full_name,
      consumerNumber: consumer.consumer_number,
      serviceAddress: consumer.service_address,
    },
    connections: numericRows(connections.rows, [
      "current_reading",
      "consumption",
      "current_bill",
    ]),
    bills: numericRows(bills.rows, ["amount"]),
    payments: numericRows(payments.rows, ["amount"]),
    serviceRequests: requests.rows,
  };
}

export function registerUtilityPortalRoutes(app: Express, pool: Pool) {
  const router = Router();
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many sign-in attempts. Please try again in 15 minutes." },
  });

  const loginSchema = z.object({
    username: z.string().trim().min(1).max(80),
    password: z.string().min(1).max(200),
    rememberMe: z.boolean().optional().default(false),
  });

  const requireUtilitySession = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const token = readCookie(request, COOKIE_NAME);
      if (!token || !/^[a-f0-9]{64}$/.test(token)) {
        return response.status(401).json({ message: "Utility portal sign-in required." });
      }

      const sessionResult = await pool.query(
        `SELECT session.utility_user_id, consumer.id AS consumer_id
         FROM utility_sessions session
         JOIN utility_users account ON account.id = session.utility_user_id
         JOIN utility_consumers consumer ON consumer.utility_user_id = account.id
         WHERE session.token_hash = $1
           AND session.expires_at > NOW()
           AND account.is_active = TRUE`,
        [hashToken(token)],
      );
      if (sessionResult.rows.length === 0) {
        response.clearCookie(COOKIE_NAME, { path: COOKIE_PATH, sameSite: "lax" });
        return response.status(401).json({ message: "Utility portal sign-in required." });
      }

      const authenticated = request as UtilityRequest;
      authenticated.utilityUserId = Number(sessionResult.rows[0].utility_user_id);
      authenticated.utilityConsumerId = Number(sessionResult.rows[0].consumer_id);
      return next();
    } catch (error) {
      console.error("Utility portal session check failed.", error);
      return response.status(500).json({ message: "The utility portal is temporarily unavailable." });
    }
  };

  router.post("/auth/login", loginLimiter, async (request, response) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ message: "Enter your Consumer ID and password." });
    }

    try {
      const username = parsed.data.username.toLowerCase();
      const accountResult = await pool.query(
        `SELECT account.id, account.password_hash
         FROM utility_users account
         LEFT JOIN utility_consumers consumer ON consumer.utility_user_id = account.id
         WHERE account.is_active = TRUE
           AND (lower(account.username) = $1 OR upper(consumer.consumer_number) = upper($1))
         LIMIT 1`,
        [username],
      );
      const account = accountResult.rows[0];
      const passwordMatches = account
        ? await bcrypt.compare(parsed.data.password, account.password_hash)
        : false;

      if (!account || !passwordMatches) {
        return response.status(401).json({ message: "Consumer ID or password is incorrect." });
      }

      const userId = Number(account.id);
      const consumerResult = await pool.query(
        "SELECT id FROM utility_consumers WHERE utility_user_id = $1",
        [userId],
      );
      if (consumerResult.rows.length === 0) {
        return response.status(401).json({ message: "Consumer ID or password is incorrect." });
      }

      const token = randomBytes(32).toString("hex");
      const sessionDuration = parsed.data.rememberMe
        ? REMEMBER_DAYS * 24 * 60 * 60 * 1000
        : SESSION_HOURS * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + sessionDuration);

      await pool.query(
        "DELETE FROM utility_sessions WHERE utility_user_id = $1 AND expires_at <= NOW()",
        [userId],
      );
      await pool.query(
        `INSERT INTO utility_sessions (token_hash, utility_user_id, expires_at)
         VALUES ($1, $2, $3)`,
        [hashToken(token), userId, expiresAt],
      );

      response.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: request.secure || request.get("x-forwarded-proto") === "https",
        sameSite: "lax",
        path: COOKIE_PATH,
        ...(parsed.data.rememberMe ? { maxAge: sessionDuration } : {}),
      });
      return response.json({ success: true });
    } catch (error) {
      console.error("Utility portal sign-in failed.", error);
      return response.status(500).json({ message: "The utility portal is temporarily unavailable." });
    }
  });

  router.post("/auth/logout", async (request, response) => {
    try {
      const token = readCookie(request, COOKIE_NAME);
      if (token && /^[a-f0-9]{64}$/.test(token)) {
        await pool.query("DELETE FROM utility_sessions WHERE token_hash = $1", [hashToken(token)]);
      }
      response.clearCookie(COOKIE_NAME, { path: COOKIE_PATH, sameSite: "lax" });
      return response.json({ success: true });
    } catch (error) {
      console.error("Utility portal sign-out failed.", error);
      return response.status(500).json({ message: "Unable to sign out right now." });
    }
  });

  router.get("/dashboard", requireUtilitySession, async (request, response) => {
    try {
      const authenticated = request as UtilityRequest;
      const dashboard = await loadDashboard(pool, authenticated.utilityUserId!);
      if (!dashboard) {
        return response.status(404).json({ message: "Consumer record was not found." });
      }
      return response.json(dashboard);
    } catch (error) {
      console.error("Utility portal dashboard load failed.", error);
      return response.status(500).json({ message: "Unable to load utility account details." });
    }
  });

  app.use("/api/utility-portal", router);
}