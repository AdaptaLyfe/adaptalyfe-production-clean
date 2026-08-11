/**
 * Adaptalyfe Guide — AI Context Service (Phase 1)
 * ─────────────────────────────────────────────────
 * Single controlled place where application data is transformed
 * into a safe, explicitly-whitelisted context for the AI service.
 *
 * Security rules (enforced here, not in the AI service):
 *  - Never accepts a userId from the frontend
 *  - Never queries another user's data
 *  - Never returns sensitive fields (passwords, tokens, payment IDs, etc.)
 *  - Never modifies the database
 *  - Read-only
 *
 * Growth path:
 *  Step 4  (current) — user identity + date/time only
 *  Step 5  — adds today's tasks
 *  Step 7  — adds upcoming appointments
 *  Step 9  — adds today's calendar events
 *  Step 11 — adds safe preference subset
 */

import type { DailyGuideContext } from "./ai-service.js";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * The safe subset of session.user that this module is allowed to read.
 * Caller (route handler) extracts only these fields from req.session.user
 * before passing them here — the full session object is never accepted.
 */
export interface SafeSessionIdentity {
  /** Full display name from the users table (e.g. "Alex Johnson") */
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract a friendly first name from a full name string.
 * "Alex Johnson" → "Alex"
 * "Alex" → "Alex"
 */
function extractFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  const firstWord = trimmed.split(/\s+/)[0];
  return firstWord || trimmed;
}

/**
 * Return current server date/time in machine-readable formats.
 *
 * Timezone note: The Adaptalyfe database and user_preferences table
 * currently have no stored timezone field. Server clock (UTC) is used
 * as the fallback. When per-user timezone is added in a future step,
 * this function will accept it as a parameter.
 */
function getCurrentTimeContext(): { date: string; time: string; timezone: string } {
  const now = new Date();

  // YYYY-MM-DD
  const date = now.toISOString().slice(0, 10);

  // HH:MM (24-hour, UTC)
  const time = now.toISOString().slice(11, 16);

  // UTC until per-user timezone is available (Step 11 / future)
  const timezone = "UTC";

  return { date, time, timezone };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * buildDailyGuideContext
 *
 * Assembles a safe, validated context object for the AI Daily Guide.
 *
 * @param userId        - Authenticated user's ID (from req.session.userId).
 *                        Used for database queries in Steps 5+.
 *                        Never accepted from the frontend.
 * @param sessionUser   - Explicitly whitelisted identity fields only.
 *                        Caller must extract these from req.session.user;
 *                        the full session object must not be passed here.
 *
 * @returns             DailyGuideContext ready to pass to generateDailyGuide().
 *                      Never throws — returns a minimal safe context on error.
 */
export async function buildDailyGuideContext(
  userId: number,
  sessionUser: SafeSessionIdentity
): Promise<DailyGuideContext> {
  // Validate inputs defensively
  if (!userId || typeof userId !== "number" || userId < 1) {
    console.warn("[ai-context] Invalid userId received:", userId);
    // Return a minimal anonymous context rather than throwing
    const { date, time, timezone } = getCurrentTimeContext();
    return { userName: "there", date, time, timezone };
  }

  if (!sessionUser?.name || typeof sessionUser.name !== "string") {
    console.warn("[ai-context] Missing or invalid session name for userId:", userId);
    const { date, time, timezone } = getCurrentTimeContext();
    return { userName: "there", date, time, timezone };
  }

  // ── Safe identity ──────────────────────────────────────────────────────────
  // Use first name only — friendly, minimal, not an identifier
  const userName = extractFirstName(sessionUser.name);

  // ── Time context ───────────────────────────────────────────────────────────
  const { date, time, timezone } = getCurrentTimeContext();

  // ── Build context ──────────────────────────────────────────────────────────
  // Future steps will add tasks, appointments, calendarEvents, preferences here.
  // They are intentionally absent in Step 4.
  const context: DailyGuideContext = {
    userName,
    date,
    time,
    timezone,
    // tasks:         populated in Step 5
    // appointments:  populated in Step 7
    // calendarEvents: populated in Step 9
    // preferences:   populated in Step 11
  };

  return context;
}
