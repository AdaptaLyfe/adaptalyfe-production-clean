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
 *  - Never modifies the database (read-only storage calls only)
 *
 * Growth path:
 *  Step 4  (done)    — user identity + date/time
 *  Step 5  (done)    — adds today's tasks
 *  Step 7  (current) — adds upcoming appointments
 *  Step 9            — adds today's calendar events
 *  Step 11           — adds safe preference subset
 */

import { storage } from "./storage.js";
import type { DailyTask, Appointment } from "../shared/schema.js";
import type { DailyGuideContext } from "./ai-service.js";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * The safe subset of session.user that this module is allowed to read.
 * Caller (route handler) extracts only these fields from req.session.user.
 */
export interface SafeSessionIdentity {
  /** Full display name from the users table (e.g. "Alex Johnson") */
  name: string;
}

/**
 * Whitelisted task shape sent to the AI.
 * Never includes: id, userId, pointValue, reminder metadata, completedAt, etc.
 */
export interface AiTask {
  title: string;
  description?: string;
  category: string;
  /** HH:MM format, UTC */
  scheduledTime?: string;
  isCompleted: boolean;
  frequency: string;
  estimatedMinutes: number;
  /** YYYY-MM-DD, only when a specific due date is set */
  dueDate?: string;
}

/**
 * Whitelisted appointment shape sent to the AI.
 *
 * Storage format: appointmentDate is stored as a text column with ISO-like
 * values (e.g. "2026-08-12T15:00:00") — no timezone designator.
 * The value is preserved as-is; no conversion applied.
 *
 * Fields intentionally excluded:
 *   id, userId, isCompleted, reminderSet, createdAt
 */
export interface AiAppointment {
  title: string;
  /** ISO-like string as stored: "YYYY-MM-DDTHH:MM:SS" */
  appointmentDate: string;
  provider?: string;
  location?: string;
  description?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract a friendly first name from a full name string.
 * "Alex Johnson" → "Alex"
 * "Alex" → "Alex"
 */
function extractFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  return trimmed.split(/\s+/)[0] || trimmed;
}

/**
 * Normalize a stored scheduled_time value to HH:MM.
 * The DB time column may return "HH:MM:SS" or "HH:MM".
 */
function normalizeScheduledTime(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().slice(0, 5);
  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : undefined;
}

/**
 * Return current server date/time in machine-readable formats.
 * Timezone note: no per-user timezone is stored in the DB yet — UTC is the
 * documented fallback until Step 11 / a future phase.
 */
function getCurrentTimeContext(): { date: string; time: string; timezone: string } {
  const now = new Date();
  return {
    date: now.toISOString().slice(0, 10),  // YYYY-MM-DD
    time: now.toISOString().slice(11, 16), // HH:MM
    timezone: "UTC",
  };
}

// ─── Task context builder (exported for unit testing without DB) ───────────────

/**
 * mapTasksToContext
 *
 * Filters raw DailyTask records to those relevant to today and applies
 * the explicit field whitelist. Exported so it can be unit-tested with
 * synthetic data without requiring a database connection.
 *
 * Filtering logic:
 *  - Tasks WITHOUT a dueDate are recurring routines — always included.
 *  - Tasks WITH a dueDate are included only if the due date is today or earlier.
 *    (Future-dated tasks are not relevant to today's Daily Guide.)
 */
export function mapTasksToContext(tasks: DailyTask[], todayStr: string): AiTask[] {
  return tasks
    .filter((task) => {
      if (!task.dueDate) return true;
      const dueDateStr = new Date(task.dueDate).toISOString().slice(0, 10);
      return dueDateStr <= todayStr;
    })
    .map((task): AiTask => {
      const result: AiTask = {
        title: task.title,
        category: task.category,
        isCompleted: task.isCompleted ?? false,
        frequency: task.frequency,
        estimatedMinutes: task.estimatedMinutes,
      };

      if (task.description) result.description = task.description;

      const st = normalizeScheduledTime(task.scheduledTime as string | null);
      if (st) result.scheduledTime = st;

      if (task.dueDate) {
        result.dueDate = new Date(task.dueDate).toISOString().slice(0, 10);
      }

      return result;
      // Fields intentionally excluded:
      // id, userId, pointValue, completedAt, lastCompleted,
      // lastReminderSent, lastOverdueReminder
    });
}

// ─── Appointment context builder (exported for unit testing without DB) ────────

/**
 * mapAppointmentsToContext
 *
 * Applies the explicit field whitelist to raw Appointment records.
 * Exported so it can be unit-tested with synthetic data without requiring
 * a database connection.
 *
 * Upstream filtering is handled by getUpcomingAppointments:
 *   - isCompleted = false
 *   - appointmentDate >= now (ISO string comparison)
 *   - Scoped to authenticated userId
 *
 * No additional date filtering is added here — the storage method
 * already restricts to upcoming appointments, which is exactly the
 * right scope for the Daily Guide.
 *
 * Date format note:
 *   appointmentDate is stored as text ("YYYY-MM-DDTHH:MM:SS") with no
 *   timezone designator. The value is preserved exactly as stored.
 *   The AI system prompt documents this as server-local (UTC) time.
 */
export function mapAppointmentsToContext(appointments: Appointment[]): AiAppointment[] {
  return appointments.map((appt): AiAppointment => {
    const result: AiAppointment = {
      title: appt.title,
      appointmentDate: appt.appointmentDate,
    };

    // Optional fields — omit if empty/null
    if (appt.provider)     result.provider = appt.provider;
    if (appt.location)     result.location = appt.location;
    if (appt.description)  result.description = appt.description;

    return result;
    // Fields intentionally excluded:
    // id, userId, isCompleted, reminderSet, createdAt
  });
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * buildDailyGuideContext
 *
 * Assembles a safe, validated context object for the AI Daily Guide.
 *
 * @param userId      - Authenticated user's ID (from req.session.userId).
 *                      Used for all database queries. Never from the frontend.
 * @param sessionUser - Explicitly whitelisted identity fields only.
 *                      Caller must extract these from req.session.user.
 */
export async function buildDailyGuideContext(
  userId: number,
  sessionUser: SafeSessionIdentity
): Promise<DailyGuideContext> {
  // ── Input validation ───────────────────────────────────────────────────────
  if (!userId || typeof userId !== "number" || userId < 1) {
    console.warn("[ai-context] Invalid userId received:", userId);
    const { date, time, timezone } = getCurrentTimeContext();
    return { userName: "there", date, time, timezone, tasks: [], appointments: [] };
  }

  if (!sessionUser?.name || typeof sessionUser.name !== "string") {
    console.warn("[ai-context] Missing or invalid session name for userId:", userId);
    const { date, time, timezone } = getCurrentTimeContext();
    return { userName: "there", date, time, timezone, tasks: [], appointments: [] };
  }

  // ── Safe identity ──────────────────────────────────────────────────────────
  const userName = extractFirstName(sessionUser.name);

  // ── Time context ───────────────────────────────────────────────────────────
  const { date, time, timezone } = getCurrentTimeContext();

  // ── Today's tasks (Step 5) ─────────────────────────────────────────────────
  // getDailyTasksByUser is strictly read-only (verified in Step 5 safety check).
  let tasks: AiTask[] = [];
  try {
    const rawTasks = await storage.getDailyTasksByUser(userId);
    tasks = mapTasksToContext(rawTasks, date);
  } catch (err) {
    console.warn(
      "[ai-context] Failed to fetch tasks for userId",
      userId,
      "—",
      err instanceof Error ? err.message : String(err)
    );
    tasks = [];
  }

  // ── Upcoming appointments (Step 7) ─────────────────────────────────────────
  // getUpcomingAppointments is strictly read-only (verified in Step 7 safety check).
  // It filters to: userId-scoped + isCompleted=false + appointmentDate >= now.
  // This is exactly the right scope for the Daily Guide — no additional
  // date filtering is needed here.
  let appointments: AiAppointment[] = [];
  try {
    const rawAppointments = await storage.getUpcomingAppointments(userId);
    appointments = mapAppointmentsToContext(rawAppointments);
  } catch (err) {
    console.warn(
      "[ai-context] Failed to fetch appointments for userId",
      userId,
      "—",
      err instanceof Error ? err.message : String(err)
    );
    appointments = [];
  }

  // ── Build context ──────────────────────────────────────────────────────────
  const context: DailyGuideContext = {
    userName,
    date,
    time,
    timezone,
    tasks,
    appointments,
    // calendarEvents: populated in Step 9
    // preferences:    populated in Step 11
  };

  return context;
}
