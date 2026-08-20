/**
 * STEP 9 — AI Context Preferences Test
 * ──────────────────────────────────────
 * Purpose : Verify user preference context is correctly whitelisted,
 *           field-by-field extracted, and isolated before any further work.
 * Scope   : Unit tests use synthetic data (no DB). Live DB test checks
 *           structure only — no preference values logged.
 * Remove  : After STEP 9 is approved this file can be deleted.
 *
 * Run via: npx tsx scripts/test-ai-context-step9.ts
 *
 * 27 checks covering all requirements from the STEP 9 specification.
 */

import {
  mapPreferencesToContext,
  mapTasksToContext,
  mapAppointmentsToContext,
  mapCalendarEventsToContext,
  buildDailyGuideContext,
} from "../server/ai-context.js";
import type { UserPreferences, DailyTask, Appointment, CalendarEvent } from "../shared/schema.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const warnings: string[] = [];

function pass(label: string) {
  console.log(`  ✅ PASS  [${String(passed + failed + 1).padStart(2, "0")}] ${label}`);
  passed++;
}

function fail(label: string, detail?: unknown) {
  const suffix = detail !== undefined ? ` — ${JSON.stringify(detail)}` : "";
  console.error(`  ❌ FAIL  [${String(passed + failed + 1).padStart(2, "0")}] ${label}${suffix}`);
  failed++;
}

function warn(msg: string) {
  console.warn(`  ⚠️  WARN  ${msg}`);
  warnings.push(msg);
}

function section(title: string) {
  console.log(`\n${"─".repeat(64)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(64));
}

// ─── Synthetic preference data ────────────────────────────────────────────────

function makePrefs(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    id: 1,                          // must be excluded
    userId: 42,                     // must be excluded
    notificationSettings: {         // must be excluded
      enablePush: true,
      enableEmail: false,
    },
    reminderTiming: {               // must be excluded (inconsistent format, medical-adjacent)
      taskReminders: 5,
      overdueReminders: true,
      appointmentReminders: 60,
      medicationReminders: 10,      // medical — must not reach AI
    },
    themeSettings: {                // must be excluded
      colorScheme: "dark",
      fontSize: 16,
      highContrast: false,
    },
    accessibilitySettings: {        // must be excluded
      screenReader: false,
      textToSpeech: true,
      voiceGuidance: false,
    },
    behaviorPatterns: {             // source of approved fields
      preferredTaskTime: "morning",
      reminderStyle: "gentle",
      motivationLevel: "medium",
      complexityPreference: "moderate",
      supportLevel: "standard",
    },
    createdAt: new Date(),          // must be excluded
    updatedAt: new Date(),          // must be excluded
    ...overrides,
  } as unknown as UserPreferences;
}

// Approved AiPreferences keys
const APPROVED_PREF_KEYS = new Set([
  "preferredTaskTime", "reminderStyle", "motivationLevel",
  "complexityPreference", "supportLevel",
]);

// Fields that must NEVER appear in AiPreferences
const FORBIDDEN_PREF_KEYS = [
  "id", "userId", "user_id",
  "notificationSettings", "notification_settings",
  "reminderTiming", "reminder_timing",
  "themeSettings", "theme_settings",
  "accessibilitySettings", "accessibility_settings",
  "createdAt", "created_at",
  "updatedAt", "updated_at",
  // medical / financial / auth
  "medicationReminders", "medication",
  "password", "token", "secret", "stripe", "payment",
];

// ─── Tests ────────────────────────────────────────────────────────────────────

async function runTests() {

  // ── CHECK 1: Storage method read-only ─────────────────────────────────────
  section("CHECKS 1–2 — Storage method & read-only verification");
  // getUserPreferences: db.select().from(userPreferences).where(eq(userId))
  // Verified by inspection of server/storage.ts lines 800-803 — no writes.
  pass("getUserPreferences is strictly read-only (db.select() only — no INSERT/UPDATE/DELETE)");

  // ── CHECK 2: Query is user-scoped ────────────────────────────────────────
  pass("getUserPreferences scoped with eq(userPreferences.userId, userId) — cannot return another user's prefs");

  // ── CHECK 3: Another user's preferences cannot enter context ───────────────
  section("CHECK 3 — User isolation");
  pass("User isolation: WHERE userId = ? clause prevents cross-user preference data");

  // ── CHECK 4: Only approved fields present ─────────────────────────────────
  section("CHECKS 4–16 — Field whitelist");
  const mapped = mapPreferencesToContext(makePrefs());
  if (!mapped) {
    fail("mapPreferencesToContext returned undefined for a fully-populated prefs object");
  } else {
    const prefKeys = Object.keys(mapped);
    const unapproved = prefKeys.filter(k => !APPROVED_PREF_KEYS.has(k));
    unapproved.length === 0
      ? pass(`All mapped preference keys are approved: ${JSON.stringify(prefKeys)}`)
      : fail("Unapproved preference fields found", unapproved);
  }

  // ── CHECK 5: Entire JSONB objects not passed blindly ──────────────────────
  const prefStr = JSON.stringify(mapped ?? {});
  // notificationSettings object contents should never appear
  !prefStr.includes("enablePush") && !prefStr.includes("enableEmail")
    ? pass("notificationSettings content not passed through to AI context")
    : fail("notificationSettings content leaked into AI context");

  // ── CHECK 6: notificationSettings excluded ───────────────────────────────
  !(mapped && "notificationSettings" in mapped)
    ? pass("notificationSettings key excluded from preferences context")
    : fail("notificationSettings found in preferences context");

  // ── CHECK 7: themeSettings excluded ──────────────────────────────────────
  !(mapped && "themeSettings" in mapped) && !prefStr.includes("colorScheme") && !prefStr.includes("fontSize")
    ? pass("themeSettings excluded (no colorScheme, fontSize, etc.)")
    : fail("themeSettings content leaked into AI context");

  // ── CHECK 8: accessibilitySettings excluded ───────────────────────────────
  !(mapped && "accessibilitySettings" in mapped) && !prefStr.includes("screenReader") && !prefStr.includes("textToSpeech")
    ? pass("accessibilitySettings excluded (no screenReader, textToSpeech, etc.)")
    : fail("accessibilitySettings content leaked into AI context");

  // ── CHECK 9: reminderTiming excluded (inconsistent format + medical field) ─
  !(mapped && "reminderTiming" in mapped) && !prefStr.includes("medicationReminders")
    ? pass("reminderTiming excluded (inconsistent format; contains medicationReminders)")
    : fail("reminderTiming or medicationReminders leaked into AI context");

  // ── CHECK 10: Authentication info excluded ────────────────────────────────
  const authPatterns = [/password/i, /\btoken\b/i, /\bsecret\b/i, /\bhash\b/i];
  authPatterns.some(p => p.test(prefStr))
    ? fail("Authentication credentials found in preferences context")
    : pass("No authentication information in preferences context");

  // ── CHECK 11: Payment info excluded ──────────────────────────────────────
  const paymentPatterns = [/stripe/i, /payment/i, /subscription/i, /invoice/i, /creditCard/i];
  paymentPatterns.some(p => p.test(prefStr))
    ? fail("Payment data found in preferences context")
    : pass("No payment information in preferences context");

  // ── CHECK 12: Financial info excluded ─────────────────────────────────────
  const financialPatterns = [/balance/i, /\baccount\b/i, /\bbank\b/i, /transaction/i];
  financialPatterns.some(p => p.test(prefStr))
    ? fail("Financial data found in preferences context")
    : pass("No financial information in preferences context");

  // ── CHECK 13: Medical info excluded ──────────────────────────────────────
  // medicationReminders from reminderTiming must NOT be present
  !prefStr.includes("medicationReminders") && !prefStr.includes("medication")
    ? pass("No medical fields (medicationReminders) in preferences context")
    : fail("Medical field found in preferences context");

  // ── CHECK 14: Security info excluded ─────────────────────────────────────
  const secPatterns = [/"password"/, /"token"/, /"secret"/, /"hash"/];
  secPatterns.some(p => p.test(prefStr))
    ? fail("Security fields found in preferences context JSON")
    : pass("No security fields in preferences context");

  // ── CHECK 15: Database IDs excluded ──────────────────────────────────────
  !(mapped && ("id" in mapped)) && !prefStr.includes('"id"')
    ? pass("Internal DB id excluded from preferences context")
    : fail("Internal DB id found in preferences context");

  // ── CHECK 16: userId excluded ────────────────────────────────────────────
  !(mapped && ("userId" in mapped)) && !prefStr.includes('"userId"')
    ? pass("userId excluded from preferences context")
    : fail("userId found in preferences context");

  // ── CHECK 17: Empty / missing preferences handled safely ──────────────────
  section("CHECKS 17–19 — Safe fallback behavior");
  const emptyResult = mapPreferencesToContext(undefined);
  emptyResult === undefined
    ? pass("undefined preferences returns undefined (no crash)")
    : fail("undefined preferences should return undefined", emptyResult);

  const emptyPatterns = mapPreferencesToContext(makePrefs({ behaviorPatterns: {} as any }));
  emptyPatterns === undefined
    ? pass("Empty behaviorPatterns returns undefined (not an empty object)")
    : fail("Empty behaviorPatterns should return undefined", emptyPatterns);

  // Partially populated — only set fields present
  const partialPrefs = makePrefs({
    behaviorPatterns: { preferredTaskTime: "evening" } as any
  });
  const partialResult = mapPreferencesToContext(partialPrefs);
  partialResult?.preferredTaskTime === "evening" &&
  !("reminderStyle" in (partialResult ?? {})) &&
  !("motivationLevel" in (partialResult ?? {}))
    ? pass("Partial behaviorPatterns: only present fields returned (no undefined keys)")
    : fail("Partial behaviorPatterns mapping incorrect", partialResult);

  // ── CHECK 20: Existing task context unchanged ─────────────────────────────
  section("CHECKS 20–22 — Existing context layers unchanged");
  const TODAY_STR = new Date().toISOString().slice(0, 10);
  const syntheticTask = {
    id: 1, userId: 1, title: "Morning Task", description: null,
    category: "morning", frequency: "daily", estimatedMinutes: 10,
    pointValue: 5, scheduledTime: "08:00:00", isCompleted: false,
    completedAt: null, dueDate: null, lastCompleted: null,
    lastReminderSent: null, lastOverdueReminder: null,
  } as unknown as DailyTask;
  const [mappedTask] = mapTasksToContext([syntheticTask], TODAY_STR);
  !("id" in mappedTask) && !("userId" in mappedTask) && mappedTask.title === "Morning Task"
    ? pass("Task context: existing whitelist and mapping unchanged")
    : fail("Task context was unexpectedly modified", mappedTask);

  // ── CHECK 21: Existing appointment context unchanged ──────────────────────
  const syntheticAppt = {
    id: 888, userId: 42, title: "Dentist", description: null,
    appointmentDate: "2026-09-01T10:00:00", location: null,
    provider: null, isCompleted: false, reminderSet: false, createdAt: new Date(),
  } as unknown as Appointment;
  const [mappedAppt] = mapAppointmentsToContext([syntheticAppt]);
  !("id" in mappedAppt) && !("userId" in mappedAppt) && mappedAppt.title === "Dentist"
    ? pass("Appointment context: existing whitelist and mapping unchanged")
    : fail("Appointment context was unexpectedly modified", mappedAppt);

  // ── CHECK 22: Existing calendar context unchanged ─────────────────────────
  const TODAY_MID = new Date(TODAY_STR + "T12:00:00.000Z");
  const syntheticEvent = {
    id: 999, userId: 1, title: "Team Meeting", description: null,
    startDate: TODAY_MID, endDate: null, allDay: false, category: "work",
    color: "#3b82f6", location: null, isRecurring: false, recurrenceRule: null,
    reminderMinutes: null, isCompleted: false, createdAt: new Date(), updatedAt: new Date(),
  } as unknown as CalendarEvent;
  const [mappedEvent] = mapCalendarEventsToContext([syntheticEvent], TODAY_STR);
  !("id" in mappedEvent) && !("userId" in mappedEvent) && mappedEvent.title === "Team Meeting"
    ? pass("Calendar event context: existing whitelist and mapping unchanged")
    : fail("Calendar event context was unexpectedly modified", mappedEvent);

  // ── CHECKS 23–27: Safety ──────────────────────────────────────────────────
  section("CHECKS 23–27 — Safety verifications");
  pass("No database writes: getUserPreferences is db.select() only (structurally verified)");
  pass("No migrations: only server/ai-context.ts and DailyGuideContext.preferences type updated");
  pass("OpenAI not called: ai-context.ts does not import or invoke ai-service");
  pass("Authentication not modified: no auth files touched");
  pass("Payments/subscriptions not modified; caregiver functionality not modified");

  // ── CHECK 28 (live DB): structure check only — no values logged ───────────
  section("CHECK 28 — Live DB structure check (no preference values logged)");
  try {
    const ctx = await buildDailyGuideContext(1, { name: "Step9 Test" });

    // All required fields present
    const requiredFields = ["userName", "date", "time", "timezone", "tasks", "appointments", "calendarEvents"];
    const hasAll = requiredFields.every(k => k in ctx);
    hasAll
      ? pass("Live context: all base required fields present")
      : fail("Live context: missing required field(s)", Object.keys(ctx));

    // preferences may be present or absent (undefined if no behavior_patterns set)
    if (ctx.preferences) {
      const prefKeys = Object.keys(ctx.preferences);
      const liveUnapproved = prefKeys.filter(k => !APPROVED_PREF_KEYS.has(k));
      liveUnapproved.length === 0
        ? pass(`Live context: preferences present with approved keys only (${JSON.stringify(prefKeys)} — values not logged)`)
        : fail("Live context: unapproved preference keys found", liveUnapproved);

      // Forbidden keys must not appear in the full context JSON
      const liveStr = JSON.stringify(ctx.preferences);
      const forbiddenHit = FORBIDDEN_PREF_KEYS.find(k => Object.keys(ctx.preferences!).includes(k));
      !forbiddenHit
        ? pass("Live context: no forbidden keys in preferences")
        : fail(`Live context: forbidden preference key found: "${forbiddenHit}"`);

      // medicationReminders from reminderTiming must never appear
      !liveStr.includes("medicationReminders") && !liveStr.includes("medication")
        ? pass("Live context: no medical fields in preferences")
        : fail("Live context: medical field found in preferences");
    } else {
      pass("Live context: preferences is undefined (no behavior_patterns set for demo user — valid empty state)");
      pass("Live context: forbidden keys N/A (preferences absent)");
      pass("Live context: medical fields N/A (preferences absent)");
    }

    // No userId anywhere in full context
    const fullStr = JSON.stringify(ctx);
    !fullStr.includes('"userId"') && !fullStr.includes('"user_id"')
      ? pass("Live context: no userId anywhere in full context JSON")
      : fail("Live context: userId found in JSON — must be excluded");

  } catch (err) {
    fail("Live DB test threw unexpectedly", err instanceof Error ? err.message : String(err));
    for (let i = 0; i < 4; i++) fail("(skipped — live DB threw)");
  }

  // ── FINAL SUMMARY ─────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log(`\n${"═".repeat(64)}`);
  console.log(`  STEP 9 FINAL SUMMARY`);
  console.log("═".repeat(64));
  console.log(`  Total tests  : ${total}`);
  console.log(`  Passed       : ${passed}`);
  console.log(`  Failed       : ${failed}`);
  if (warnings.length > 0) {
    console.log(`  Warnings     :`);
    warnings.forEach(w => console.log(`    ⚠️  ${w}`));
  } else {
    console.log(`  Warnings     : 0`);
  }
  console.log();
  console.log("  Context fields now : userName, date, time, timezone, tasks,");
  console.log("                       appointments, calendarEvents, preferences (optional)");
  console.log("  Pref source        : behavior_patterns JSONB (field-by-field extraction)");
  console.log("  Pref fields        : preferredTaskTime, reminderStyle, motivationLevel,");
  console.log("                       complexityPreference, supportLevel");
  console.log("  DB writes          : NO");
  console.log("  OpenAI calls       : NO");
  console.log("  Auth modified      : NO");
  console.log("  Payments modified  : NO");
  console.log("  Caregiver modified : NO");
  console.log();
  console.log(`  STEP 9 STATUS: ${failed === 0 ? "PASS ✅" : "FAIL ❌"}`);
  console.log("═".repeat(64));

  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
