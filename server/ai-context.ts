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
 *  Step 8  (done)    — adds today's calendar events
 *  Step 9  (current) — adds safe behavior preference subset
 */

import { storage } from "./storage.js";
import type { DailyTask, Appointment, CalendarEvent, UserPreferences } from "../shared/schema.js";
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
 * returns them as JavaScript Date objects. Serialized to ISO strings here.
 * No timezone is stored; server UTC convention applies.
 *
 * Fields intentionally excluded:
 *   id, userId, color, isRecurring, recurrenceRule, reminderMinutes,
 *   isCompleted, createdAt, updatedAt
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

/**
 * Whitelisted preference subset sent to the AI.
 *
 * Source: behavior_patterns JSONB column in user_preferences.
 * All fields are structured enum-like strings set by the user in the
 * personalization engine — never free-form sensitive text.
 *
 * Columns intentionally excluded from AI context:
 *   id, userId, createdAt, updatedAt          — internal metadata
 *   notificationSettings                       — push/email/SMS config
 *   themeSettings                              — UI display settings
 *   accessibilitySettings                      — UI a11y settings
 *   reminderTiming                             — inconsistent format in DB
 *                                                (string | object | {});
 *                                                contains medicationReminders
 *                                                (medical-adjacent); not
 *                                                useful for AI guide content
 *
 * Fields inside behavior_patterns intentionally excluded:
 *   Any field that is not a known safe string enum (guarded at extraction time)
 */
export interface AiPreferences {
  /** When the user prefers to work: "morning" | "afternoon" | "evening" */
  preferredTaskTime?: string;
  /** How the user prefers reminders: e.g. "gentle" | "firm" */
  reminderStyle?: string;
  /** User's motivation level: e.g. "low" | "medium" | "high" */
  motivationLevel?: string;
  /** Preferred task complexity: "simple" | "moderate" | "detailed" */
  complexityPreference?: string;
  /** Level of guidance the user prefers */
  supportLevel?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract a friendly first name from a full name string. */
function extractFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  return trimmed.split(/\s+/)[0] || trimmed;
}

/** Normalize a stored scheduled_time value to HH:MM. */
function normalizeScheduledTime(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().slice(0, 5);
  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : undefined;
}

/** Return current server date/time (UTC). */
function getCurrentTimeContext(): { date: string; time: string; timezone: string } {
  const now = new Date();
  return {
    date: now.toISOString().slice(0, 10),
    time: now.toISOString().slice(11, 16),
    timezone: "UTC",
  };
}

/** Coerce a Drizzle timestamp column value to Date or null. */
function toDate(val: Date | string | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Safely extract a string field from an unknown JSONB value.
 * Returns undefined if the object or field is missing, null, or not a string.
 * Never returns objects, arrays, booleans, or numbers.
 */
function safeString(obj: unknown, key: string): string | undefined {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return undefined;
  const val = (obj as Record<string, unknown>)[key];
  if (typeof val !== "string" || val.trim() === "") return undefined;
  return val;
}

// ─── Task context builder ──────────────────────────────────────────────────────

/** mapTasksToContext — exported for unit testing without DB. */
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

/** mapAppointmentsToContext — exported for unit testing without DB. */
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

/** mapCalendarEventsToContext — exported for unit testing without DB. */
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
      if (!start) return false;
      if (start > todayEnd) return false;
      if (end !== null) return end >= todayStart;
      return start >= todayStart;
    })
    .map((event): AiCalendarEvent => {
      const start = toDate(event.startDate)!;
      const end   = toDate(event.endDate);
      const result: AiCalendarEvent = {
        title:    event.title,
        startDate: start.toISOString(),
        allDay:   event.allDay ?? false,
        category: event.category ?? "personal",
      };
      if (end)               result.endDate      = end.toISOString();
      if (event.location)    result.location     = event.location;
      if (event.description) result.description  = event.description;
      return result;
    });
}

// ─── Preference context builder ────────────────────────────────────────────────

/**
 * mapPreferencesToContext — exported for unit testing without DB.
 *
 * Extracts only the explicitly whitelisted fields from the behavior_patterns
 * JSONB column. Each field is individually type-checked — the entire JSONB
 * object is never passed through.
 *
 * Returns undefined (not an empty object) when no useful preferences are
 * found, so the AI receives no `preferences` key rather than an empty one.
 *
 * Excluded entirely: notificationSettings, themeSettings,
 * accessibilitySettings, reminderTiming (see AiPreferences JSDoc for reasons).
 */
export function mapPreferencesToContext(
  prefs: UserPreferences | undefined | null
): AiPreferences | undefined {
  if (!prefs) return undefined;

  // behaviorPatterns is jsonb — Drizzle returns it as unknown.
  const bp = prefs.behaviorPatterns;

  const result: AiPreferences = {};

  // Extract only the known safe string fields, one at a time.
  const preferredTaskTime  = safeString(bp, "preferredTaskTime");
  const reminderStyle      = safeString(bp, "reminderStyle");
  const motivationLevel    = safeString(bp, "motivationLevel");
  const complexityPreference = safeString(bp, "complexityPreference");
  const supportLevel       = safeString(bp, "supportLevel");

  if (preferredTaskTime)   result.preferredTaskTime   = preferredTaskTime;
  if (reminderStyle)       result.reminderStyle       = reminderStyle;
  if (motivationLevel)     result.motivationLevel     = motivationLevel;
  if (complexityPreference) result.complexityPreference = complexityPreference;
  if (supportLevel)        result.supportLevel        = supportLevel;

  // Return undefined if nothing useful was extracted.
  return Object.keys(result).length > 0 ? result : undefined;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * buildDailyGuideContext
 *
 * Assembles a safe, validated context object for the AI Daily Guide.
 *
 * @param userId      - Authenticated user's ID (from req.session.userId). Never from the frontend.
 * @param sessionUser - Explicitly whitelisted identity fields from req.session.user.
 * @param clientTime  - Optional local date/time/timezone from the user's browser (display only).
 *                      When provided, the AI uses the user's local time for time-of-day tone
 *                      (morning/afternoon/evening/night) instead of server UTC.
 */
export async function buildDailyGuideContext(
  userId: number,
  sessionUser: SafeSessionIdentity,
  clientTime?: { localDate?: string; localTime?: string; timezone?: string }
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
  // Prefer the client's local time so the AI generates morning/afternoon/evening/night
  // tone that matches what the user actually sees on their device. Fall back to server
  // UTC when the client doesn't send local time (e.g. older app versions).
  const serverCtx = getCurrentTimeContext();
  const isValidDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const isValidTime = (s?: string) => !!s && /^\d{2}:\d{2}$/.test(s);
  const date     = isValidDate(clientTime?.localDate) ? clientTime!.localDate! : serverCtx.date;
  const time     = isValidTime(clientTime?.localTime) ? clientTime!.localTime! : serverCtx.time;
  const timezone = clientTime?.timezone || serverCtx.timezone;

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
  let calendarEvents: AiCalendarEvent[] = [];
  try {
    const rawEvents = await storage.getCalendarEventsByUser(userId);
    calendarEvents = mapCalendarEventsToContext(rawEvents, date);
  } catch (err) {
    console.warn("[ai-context] Failed to fetch calendar events for userId", userId, "—",
      err instanceof Error ? err.message : String(err));
    calendarEvents = [];
  }

  // ── User preferences (Step 9) ─────────────────────────────────────────────
  // getUserPreferences is strictly read-only (db.select() only — verified).
  // Only behavior_patterns fields are extracted; other JSONB columns excluded.
  let preferences: AiPreferences | undefined;
  try {
    const rawPrefs = await storage.getUserPreferences(userId);
    preferences = mapPreferencesToContext(rawPrefs);
  } catch (err) {
    console.warn("[ai-context] Failed to fetch preferences for userId", userId, "—",
      err instanceof Error ? err.message : String(err));
    preferences = undefined;
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
    ...(preferences !== undefined ? { preferences } : {}),
  };

  return context;
}
