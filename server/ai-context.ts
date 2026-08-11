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
 *  Step 7  (done)    — adds upcoming appointments
 *  Step 8  (current) — adds today's calendar events
 *  Step 11           — adds safe preference subset
 */

import { storage } from "./storage.js";
import type { DailyTask, Appointment, CalendarEvent } from "../shared/schema.js";
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

/**
 * Whitelisted calendar event shape sent to the AI.
 *
 * Storage format: startDate and endDate are timestamp columns — Drizzle
 * returns them as JavaScript Date objects. They are serialized to ISO
 * strings here. No timezone is stored; server UTC convention applies.
 *
 * Fields intentionally excluded:
 *   id, userId, color, isRecurring, recurrenceRule, reminderMinutes,
 *   isCompleted, createdAt, updatedAt
 *
 * Recurring event note:
 *   getCalendarEventsByUser returns base records only — it does not expand
 *   recurring instances. A recurring event is included only if its stored
 *   startDate falls within today's UTC window. Future instance expansion
 *   is out of scope for Phase 1.
 */
export interface AiCalendarEvent {
  title: string;
  /** ISO string (UTC): "YYYY-MM-DDTHH:MM:SS.sssZ" */
  startDate: string;
  /** ISO string (UTC), omitted for open-ended or point-in-time events */
  endDate?: string;
  /** true if the event occupies the full day with no specific time */
  allDay: boolean;
  /** "personal" | "work" | "health" | "social" | "education" */
  category: string;
  location?: string;
  description?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract a friendly first name from a full name string.
 * "Alex Johnson" → "Alex"
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
 * Timezone: UTC is the documented fallback — no per-user timezone in DB yet.
 */
function getCurrentTimeContext(): { date: string; time: string; timezone: string } {
  const now = new Date();
  return {
    date: now.toISOString().slice(0, 10),  // YYYY-MM-DD
    time: now.toISOString().slice(11, 16), // HH:MM
    timezone: "UTC",
  };
}

/**
 * Coerce a value from a Drizzle timestamp column to a Date.
 * Drizzle returns Date objects for timestamp columns; this guard handles
 * edge cases where the value might already be a string.
 */
function toDate(val: Date | string | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// ─── Task context builder ──────────────────────────────────────────────────────

/**
 * mapTasksToContext — exported for unit testing without DB.
 *
 * Filtering: tasks with no dueDate (recurring) always included;
 * tasks with dueDate included only if date <= today.
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
    });
}

// ─── Appointment context builder ───────────────────────────────────────────────

/**
 * mapAppointmentsToContext — exported for unit testing without DB.
 *
 * Upstream filtering by getUpcomingAppointments:
 *   isCompleted=false + appointmentDate >= now + userId-scoped.
 */
export function mapAppointmentsToContext(appointments: Appointment[]): AiAppointment[] {
  return appointments.map((appt): AiAppointment => {
    const result: AiAppointment = {
      title: appt.title,
      appointmentDate: appt.appointmentDate,
    };
    if (appt.provider)    result.provider = appt.provider;
    if (appt.location)    result.location = appt.location;
    if (appt.description) result.description = appt.description;
    return result;
  });
}

// ─── Calendar event context builder ───────────────────────────────────────────

/**
 * mapCalendarEventsToContext — exported for unit testing without DB.
 *
 * Filters events to those occurring on todayStr (UTC) and applies the
 * field whitelist. getCalendarEventsByUser returns all events for a user
 * with no date filter, so this function does the date scoping.
 *
 * "Occurring today" definition (UTC-based):
 *   todayStart = YYYY-MM-DDT00:00:00.000Z
 *   todayEnd   = YYYY-MM-DDT23:59:59.999Z
 *
 *   Include if:
 *     event.startDate <= todayEnd
 *     AND ( event.endDate >= todayStart  — event ends today or later
 *           OR (no endDate AND event.startDate >= todayStart) )
 *
 * This correctly handles:
 *   - Single events today (startDate today, no/same endDate)
 *   - Multi-day events spanning today (startDate before, endDate after)
 *   - All-day events (stored at UTC midnight boundaries)
 *   - Past events → excluded (endDate before todayStart)
 *   - Future events → excluded (startDate after todayEnd)
 *
 * Recurring event limitation (Phase 1):
 *   Only the base record's startDate is checked. Recurring instances
 *   are not expanded. Documented in AiCalendarEvent JSDoc.
 */
export function mapCalendarEventsToContext(
  events: CalendarEvent[],
  todayStr: string
): AiCalendarEvent[] {
  const todayStart = new Date(todayStr + "T00:00:00.000Z");
  const todayEnd   = new Date(todayStr + "T23:59:59.999Z");

  return events
    .filter((event) => {
      const start = toDate(event.startDate);
      const end   = toDate(event.endDate);

      if (!start) return false;              // invalid start — skip
      if (start > todayEnd) return false;    // starts in the future — exclude

      if (end !== null) {
        return end >= todayStart;            // ends today or later — include
      }
      // No endDate: include only if startDate is within today's window
      return start >= todayStart;
    })
    .map((event): AiCalendarEvent => {
      const start = toDate(event.startDate)!;
      const end   = toDate(event.endDate);

      const result: AiCalendarEvent = {
        title:     event.title,
        startDate: start.toISOString(),
        allDay:    event.allDay ?? false,
        category:  event.category ?? "personal",
      };

      if (end)              result.endDate     = end.toISOString();
      if (event.location)   result.location    = event.location;
      if (event.description) result.description = event.description;

      return result;
      // Fields intentionally excluded:
      // id, userId, color, isRecurring, recurrenceRule,
      // reminderMinutes, isCompleted, createdAt, updatedAt
    });
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * buildDailyGuideContext
 *
 * Assembles a safe, validated context object for the AI Daily Guide.
 *
 * @param userId      - Authenticated user's ID (from req.session.userId). Never from the frontend.
 * @param sessionUser - Explicitly whitelisted identity fields from req.session.user.
 */
export async function buildDailyGuideContext(
  userId: number,
  sessionUser: SafeSessionIdentity
): Promise<DailyGuideContext> {
  // ── Input validation ───────────────────────────────────────────────────────
  if (!userId || typeof userId !== "number" || userId < 1) {
    console.warn("[ai-context] Invalid userId received:", userId);
    const { date, time, timezone } = getCurrentTimeContext();
    return { userName: "there", date, time, timezone, tasks: [], appointments: [], calendarEvents: [] };
  }

  if (!sessionUser?.name || typeof sessionUser.name !== "string") {
    console.warn("[ai-context] Missing or invalid session name for userId:", userId);
    const { date, time, timezone } = getCurrentTimeContext();
    return { userName: "there", date, time, timezone, tasks: [], appointments: [], calendarEvents: [] };
  }

  // ── Safe identity ──────────────────────────────────────────────────────────
  const userName = extractFirstName(sessionUser.name);

  // ── Time context ───────────────────────────────────────────────────────────
  const { date, time, timezone } = getCurrentTimeContext();

  // ── Today's tasks (Step 5) ─────────────────────────────────────────────────
  let tasks: AiTask[] = [];
  try {
    const rawTasks = await storage.getDailyTasksByUser(userId);
    tasks = mapTasksToContext(rawTasks, date);
  } catch (err) {
    console.warn("[ai-context] Failed to fetch tasks for userId", userId, "—",
      err instanceof Error ? err.message : String(err));
    tasks = [];
  }

  // ── Upcoming appointments (Step 7) ─────────────────────────────────────────
  let appointments: AiAppointment[] = [];
  try {
    const rawAppointments = await storage.getUpcomingAppointments(userId);
    appointments = mapAppointmentsToContext(rawAppointments);
  } catch (err) {
    console.warn("[ai-context] Failed to fetch appointments for userId", userId, "—",
      err instanceof Error ? err.message : String(err));
    appointments = [];
  }

  // ── Today's calendar events (Step 8) ──────────────────────────────────────
  // getCalendarEventsByUser returns all events — mapCalendarEventsToContext
  // filters to those occurring today (UTC) and applies the field whitelist.
  let calendarEvents: AiCalendarEvent[] = [];
  try {
    const rawEvents = await storage.getCalendarEventsByUser(userId);
    calendarEvents = mapCalendarEventsToContext(rawEvents, date);
  } catch (err) {
    console.warn("[ai-context] Failed to fetch calendar events for userId", userId, "—",
      err instanceof Error ? err.message : String(err));
    calendarEvents = [];
  }

  // ── Build context ──────────────────────────────────────────────────────────
  const context: DailyGuideContext = {
    userName,
    date,
    time,
    timezone,
    tasks,
    appointments,
    calendarEvents,
    // preferences: populated in Step 11
  };

  return context;
}
