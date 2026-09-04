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

import { storage, type IStorage } from "./storage.js";
import type {
  Appointment,
  AdverseMedication,
  Allergy,
  Bill,
  CalendarEvent,
  DailyTask,
  MealPlan,
  MedicalCondition,
  Medication,
  Reward,
  SavingsGoal,
  ShoppingList,
  SleepSession,
  TransitionSkill,
  UserPreferences,
  UserAchievement,
  MoodEntry,
  PointsTransaction,
  UserPointsBalance,
} from "../shared/schema.js";
import type { DailyGuideContext } from "./ai-service.js";

const MAX_DISPLAY_NAME_LENGTH = 80;

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
 * The structured, user-scoped context supplied to the AdaptAI chat flow.
 *
 * Every field is a deliberately small, AI-safe projection of existing rows.
 * Internal IDs, auth data, account numbers, payment links, and free-form
 * secrets are never part of this type.
 */
export interface AdaptAIContext {
  identity: {
    displayName: string;
  };
  today: {
    date: string;
    time: string;
    timezone: string;
  };
  tasks?: {
    today: AiTask[];
    incomplete: AiTask[];
    completed: AiTask[];
  };
  appointments?: {
    today?: AiAppointment[];
    upcoming?: AiAppointment;
  };
  medications?: {
    /** All active medications recorded for this authenticated user. */
    recorded?: AiMedication[];
    /** Recorded medications whose reminderEnabled flag is true. */
    scheduledToday: AiMedication[];
  };
  medical?: {
    conditions: AiMedicalCondition[];
    allergies: AiAllergy[];
    adverseMedications: AiAdverseMedication[];
  };
  goals?: AiGoal[];
  mood?: AiMood[];
  sleep?: AiSleep[];
  meals?: AiMeal[];
  shopping?: AiShoppingItem[];
  finance?: {
    due: AiBill[];
  };
  progress?: {
    points?: AiPointsBalance;
    recentAchievements?: AiAchievement[];
    recentRewards?: AiReward[];
    recentActivity?: AiPointsActivity[];
    skills?: AiSkill[];
  };
  preferences?: {
    behavior?: AiPreferences;
    accessibility?: AiAccessibility;
  };
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

export interface AiAccessibility {
  highContrast?: boolean;
  voiceEnabled?: boolean;
  voiceSpeed?: number;
  textSize?: string;
  reducedMotion?: boolean;
  screenReader?: boolean;
}

export interface AiMedication {
  medicationName: string;
  dosage?: string;
  instructions?: string;
  reminderEnabled: boolean;
}

export interface AiMedicalCondition {
  condition: string;
  status: string;
  diagnosedDate?: string;
}

export interface AiAllergy {
  allergen: string;
  severity: string;
  reaction?: string;
}

export interface AiAdverseMedication {
  medicationName: string;
  reaction: string;
  severity: string;
}

export interface AiGoal {
  title: string;
  description?: string;
  category: string;
  priority: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  isDueToday: boolean;
  isCompleted: boolean;
}

export interface AiSkillMilestone {
  title: string;
  isCompleted: boolean;
}

export interface AiSkill {
  skillCategory: string;
  skillName: string;
  description?: string;
  currentLevel: number;
  targetLevel: number;
  milestones: AiSkillMilestone[];
  lastPracticed?: string;
}

export interface AiMood {
  mood: number;
  date: string;
}

export interface AiSleep {
  date: string;
  totalSleepDurationMinutes?: number;
  sleepScore?: number;
  quality?: string;
}

export interface AiMeal {
  mealType: string;
  mealName: string;
  plannedDate: string;
  isCompleted: boolean;
  cookingTimeMinutes?: number;
}

export interface AiShoppingItem {
  itemName: string;
  category: string;
  quantity?: string;
  estimatedCost?: number;
}

export interface AiBill {
  name: string;
  amount: number;
  dueDayOfMonth: number;
  category: string;
  isPaid: boolean;
}

export interface AiPointsBalance {
  availablePoints: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

export interface AiAchievement {
  title: string;
  category: string;
  points: number;
  description?: string;
  earnedAt?: string;
}

export interface AiReward {
  title: string;
  category: string;
  pointsRequired: number;
  description?: string;
}

export interface AiPointsActivity {
  points: number;
  transactionType: string;
  description?: string;
  createdAt?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract a friendly first name from a full name string. */
function extractFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  return trimmed.split(/\s+/)[0] || trimmed;
}

function isEmailAddress(value: string): boolean {
  return value.includes("@");
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
  return val.trim().slice(0, 100);
}

function safeText(value: string | null | undefined, maxLength = 200): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value.trim().slice(0, maxLength);
}

function dateOnly(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = toDate(value);
  return parsed ? parsed.toISOString().slice(0, 10) : undefined;
}

function isoDate(value: Date | string | null | undefined): string | undefined {
  const parsed = toDate(value);
  return parsed ? parsed.toISOString() : undefined;
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

/** Extract only presentation and interaction settings that can help AdaptAI. */
export function mapAccessibilityToContext(
  prefs: UserPreferences | undefined | null
): AiAccessibility | undefined {
  if (!prefs || !prefs.accessibilitySettings) return undefined;

  const source = prefs.accessibilitySettings;
  if (!source || typeof source !== "object" || Array.isArray(source)) return undefined;

  const result: AiAccessibility = {};
  const values = source as Record<string, unknown>;

  if (typeof values.highContrast === "boolean") result.highContrast = values.highContrast;
  if (typeof values.voiceEnabled === "boolean") result.voiceEnabled = values.voiceEnabled;
  if (typeof values.voiceSpeed === "number" && Number.isFinite(values.voiceSpeed)) {
    result.voiceSpeed = values.voiceSpeed;
  }
  if (typeof values.textSize === "string" && values.textSize.trim()) {
    result.textSize = values.textSize.trim().slice(0, 30);
  }
  if (typeof values.reducedMotion === "boolean") result.reducedMotion = values.reducedMotion;
  if (typeof values.screenReader === "boolean") result.screenReader = values.screenReader;

  return Object.keys(result).length > 0 ? result : undefined;
}

export function mapMedicationsToContext(
  medications: Medication[],
  userId?: number
): AiMedication[] {
  return medications
    .filter((medication) => userId === undefined || medication.userId === userId)
    .filter((medication) => medication.isActive !== false)
    .slice(0, 20)
    .map((medication) => ({
      medicationName: medication.medicationName,
      ...(safeText(medication.dosage, 100) ? { dosage: safeText(medication.dosage, 100) } : {}),
      ...(safeText(medication.instructions, 200)
        ? { instructions: safeText(medication.instructions, 200) }
        : {}),
      reminderEnabled: medication.reminderEnabled !== false,
    }));
}

export function mapMedicalConditionsToContext(
  conditions: MedicalCondition[],
  userId?: number
): AiMedicalCondition[] {
  return conditions
    .filter((condition) => userId === undefined || condition.userId === userId)
    .slice(0, 20)
    .map((condition) => ({
      condition: condition.condition,
      status: condition.status,
      ...(condition.diagnosedDate
        ? { diagnosedDate: dateOnly(condition.diagnosedDate) }
        : {}),
    }));
}

export function mapAllergiesToContext(
  allergies: Allergy[],
  userId?: number
): AiAllergy[] {
  return allergies
    .filter((allergy) => userId === undefined || allergy.userId === userId)
    .slice(0, 20)
    .map((allergy) => ({
      allergen: allergy.allergen,
      severity: allergy.severity,
      ...(safeText(allergy.reaction, 200) ? { reaction: safeText(allergy.reaction, 200) } : {}),
    }));
}

export function mapAdverseMedicationsToContext(
  adverseMedications: AdverseMedication[],
  userId?: number
): AiAdverseMedication[] {
  return adverseMedications
    .filter((entry) => userId === undefined || entry.userId === userId)
    .slice(0, 20)
    .map((entry) => ({
      medicationName: entry.medicationName,
      reaction: entry.reaction,
      severity: entry.severity,
    }));
}

export function mapGoalsToContext(
  goals: SavingsGoal[],
  todayStr: string,
  userId?: number
): AiGoal[] {
  return goals
    .filter((goal) => userId === undefined || goal.userId === userId)
    .filter((goal) => goal.isActive !== false)
    .slice(0, 20)
    .map((goal) => {
      const targetDate = dateOnly(goal.targetDate);
      return {
        title: goal.title,
        ...(safeText(goal.description, 200) ? { description: safeText(goal.description, 200) } : {}),
        category: goal.category,
        priority: goal.priority,
        ...(goal.targetAmount != null ? { targetAmount: goal.targetAmount } : {}),
        ...(goal.currentAmount != null ? { currentAmount: goal.currentAmount } : {}),
        ...(targetDate ? { targetDate } : {}),
        isDueToday: targetDate === todayStr,
        isCompleted: goal.isCompleted ?? false,
      };
    });
}

export function mapMoodToContext(entries: MoodEntry[], userId?: number): AiMood[] {
  return entries
    .filter((entry) => userId === undefined || entry.userId === userId)
    .slice(0, 7)
    .map((entry) => ({
      mood: entry.mood,
      date: isoDate(entry.entryDate) ?? "",
    }))
    .filter((entry) => entry.date !== "");
}

export function mapSleepToContext(sessions: SleepSession[], userId?: number): AiSleep[] {
  return sessions
    .filter((session) => userId === undefined || session.userId === userId)
    .slice(0, 7)
    .map((session) => ({
      date: dateOnly(session.sleepDate) ?? "",
      ...(session.totalSleepDuration != null
        ? { totalSleepDurationMinutes: session.totalSleepDuration }
        : {}),
      ...(session.sleepScore != null ? { sleepScore: session.sleepScore } : {}),
      ...(safeText(session.quality, 30) ? { quality: safeText(session.quality, 30) } : {}),
    }))
    .filter((session) => session.date !== "");
}

export function mapMealsToContext(meals: MealPlan[]): AiMeal[] {
  return meals.slice(0, 12).map((meal) => ({
    mealType: meal.mealType,
    mealName: meal.mealName,
    plannedDate: meal.plannedDate,
    isCompleted: meal.isCompleted ?? false,
    ...(meal.cookingTime != null ? { cookingTimeMinutes: meal.cookingTime } : {}),
  }));
}

export function mapShoppingToContext(items: ShoppingList[]): AiShoppingItem[] {
  return items.slice(0, 30).map((item) => ({
    itemName: item.itemName,
    category: item.category,
    ...(safeText(item.quantity, 60) ? { quantity: safeText(item.quantity, 60) } : {}),
    ...(item.estimatedCost != null ? { estimatedCost: item.estimatedCost } : {}),
  }));
}

export function mapBillsToContext(bills: Bill[]): AiBill[] {
  return bills.slice(0, 20).map((bill) => ({
    name: bill.name,
    amount: bill.amount,
    dueDayOfMonth: bill.dueDate,
    category: bill.category,
    isPaid: bill.isPaid ?? false,
  }));
}

export function mapPointsBalanceToContext(
  balance: UserPointsBalance | undefined
): AiPointsBalance | undefined {
  if (!balance) return undefined;
  return {
    availablePoints: balance.availablePoints ?? 0,
    lifetimeEarned: balance.lifetimeEarned ?? 0,
    lifetimeSpent: balance.lifetimeSpent ?? 0,
  };
}

export function mapTransitionSkillsToContext(
  skills: TransitionSkill[],
  userId?: number
): AiSkill[] {
  return skills
    .filter((skill) => userId === undefined || skill.userId === userId)
    .slice(0, 20)
    .map((skill) => {
      const rawMilestones = Array.isArray(skill.milestones) ? skill.milestones : [];
      const milestones = rawMilestones
        .map((milestone): AiSkillMilestone | undefined => {
          if (typeof milestone === "string" && milestone.trim()) {
            return { title: milestone.trim().slice(0, 160), isCompleted: true };
          }
          if (!milestone || typeof milestone !== "object" || Array.isArray(milestone)) {
            return undefined;
          }

          const source = milestone as Record<string, unknown>;
          const title =
            typeof source.title === "string"
              ? source.title
              : typeof source.name === "string"
                ? source.name
                : undefined;
          if (!title?.trim()) return undefined;
          const isCompleted =
            typeof source.isCompleted === "boolean"
              ? source.isCompleted
              : typeof source.completed === "boolean"
                ? source.completed
                : true;
          return { title: title.trim().slice(0, 160), isCompleted };
        })
        .filter((milestone): milestone is AiSkillMilestone => milestone !== undefined)
        .slice(0, 20);

      return {
        skillCategory: skill.skillCategory,
        skillName: skill.skillName,
        ...(safeText(skill.description, 200)
          ? { description: safeText(skill.description, 200) }
          : {}),
        currentLevel: skill.currentLevel ?? 1,
        targetLevel: skill.targetLevel ?? 5,
        milestones,
        ...(isoDate(skill.lastPracticed)
          ? { lastPracticed: isoDate(skill.lastPracticed) }
          : {}),
      };
    });
}

export function mapAchievementsToContext(
  achievements: UserAchievement[],
  userId?: number
): AiAchievement[] {
  return achievements
    .filter((achievement) => userId === undefined || achievement.userId === userId)
    .slice(0, 5)
    .map((achievement) => ({
      title: achievement.title,
      category: achievement.category,
      points: achievement.points ?? 0,
      ...(safeText(achievement.description, 200)
        ? { description: safeText(achievement.description, 200) }
        : {}),
      ...(isoDate(achievement.earnedAt) ? { earnedAt: isoDate(achievement.earnedAt) } : {}),
    }));
}

export function mapRewardsToContext(rewards: Reward[], userId?: number): AiReward[] {
  return rewards
    .filter((reward) => userId === undefined || reward.userId === userId)
    .slice(0, 5)
    .map((reward) => ({
      title: reward.title,
      category: reward.category,
      pointsRequired: reward.pointsRequired,
      ...(safeText(reward.description, 200)
        ? { description: safeText(reward.description, 200) }
        : {}),
    }));
}

export function mapPointsActivityToContext(
  transactions: PointsTransaction[],
  userId?: number
): AiPointsActivity[] {
  return transactions
    .filter((transaction) => userId === undefined || transaction.userId === userId)
    .slice(0, 10)
    .map((transaction) => ({
      points: transaction.points,
      transactionType: transaction.transactionType,
      ...(safeText(transaction.description, 200)
        ? { description: safeText(transaction.description, 200) }
        : {}),
      ...(isoDate(transaction.createdAt)
        ? { createdAt: isoDate(transaction.createdAt) }
        : {}),
    }));
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

type AdaptAIContextStorage = Pick<
  IStorage,
  | "getUserById"
  | "getDailyTasksByUser"
  | "getAppointmentsByDate"
  | "getNextAppointment"
  | "getMedicationsByUser"
  | "getAllergiesByUser"
  | "getMedicalConditionsByUser"
  | "getAdverseMedicationsByUser"
  | "getSavingsGoalsByUser"
  | "getTransitionSkillsByUser"
  | "getRecentMoodEntriesByUser"
  | "getRecentSleepSessionsByUser"
  | "getMealPlansByDate"
  | "getActiveShoppingItems"
  | "getRelevantBillsByUser"
  | "getExistingUserPointsBalance"
  | "getRecentUserAchievements"
  | "getActiveRewardsByUser"
  | "getRecentPointsTransactionsByUser"
  | "getUserPreferences"
>;

async function loadContextSection<T>(
  label: string,
  loader: () => Promise<T>
): Promise<T | undefined> {
  try {
    return await loader();
  } catch (error) {
    // A missing optional data source should not prevent chat from working.
    // Do not log returned records or user-entered values.
    console.warn(
      `[ai-context] Unable to load ${label}:`,
      error instanceof Error ? error.message : String(error)
    );
    return undefined;
  }
}

function resolveDisplayName(
  sessionUser: SafeSessionIdentity,
  storedName: string | null | undefined
): string {
  const candidate = storedName?.trim() || sessionUser.name?.trim() || "";
  if (!candidate || isEmailAddress(candidate)) return "there";

  const cleaned = candidate.replace(/[^\p{L}\p{N}' -]/gu, " ").replace(/\s+/g, " ").trim();
  return cleaned.slice(0, MAX_DISPLAY_NAME_LENGTH) || "there";
}

/**
 * Build the complete AdaptAI context for one authenticated user.
 *
 * This function accepts the authenticated user ID from the route, never a
 * requested target ID. Every data read is delegated to a storage method that
 * includes that user ID in its query. Caregiver-to-user context switching is
 * intentionally not supported here; a caregiver's chat can only see the
 * caregiver's own records until an explicitly permission-checked target flow
 * is designed.
 */
export async function buildAdaptAIContext(
  userId: number,
  sessionUser: SafeSessionIdentity,
  clientTime?: { localDate?: string; localTime?: string; timezone?: string },
  contextStorage: AdaptAIContextStorage = storage,
  options: { includeMedicalInfo?: boolean; includeMoodSleep?: boolean } = {}
): Promise<AdaptAIContext> {
  if (!Number.isInteger(userId) || userId < 1) {
    throw new Error("An authenticated user ID is required to build AdaptAI context");
  }

  const serverTime = getCurrentTimeContext();
  const isValidDate = (value?: string) => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const isValidTime = (value?: string) => !!value && /^\d{2}:\d{2}$/.test(value);
  const date = isValidDate(clientTime?.localDate)
    ? clientTime!.localDate!
    : serverTime.date;
  const time = isValidTime(clientTime?.localTime)
    ? clientTime!.localTime!
    : serverTime.time;
  const timezone = clientTime?.timezone?.trim().slice(0, 80) || serverTime.timezone;

  const storedUser = await loadContextSection("identity", () =>
    contextStorage.getUserById(userId)
  );

  const [
    rawTasks,
    rawAppointments,
    rawUpcomingAppointment,
    rawMedications,
    rawAllergies,
    rawMedicalConditions,
    rawAdverseMedications,
    rawGoals,
    rawSkills,
    rawMood,
    rawSleep,
    rawMeals,
    rawShopping,
    rawBills,
    pointsBalance,
    recentAchievements,
    activeRewards,
    recentPointsActivity,
    rawPreferences,
  ] = await Promise.all([
    loadContextSection("tasks", () => contextStorage.getDailyTasksByUser(userId)),
    loadContextSection("today's appointments", () =>
      contextStorage.getAppointmentsByDate(userId, date)
    ),
    loadContextSection("upcoming appointment", () =>
      contextStorage.getNextAppointment(userId, `${date}T${time}:00`)
    ),
    loadContextSection("medications", () => contextStorage.getMedicationsByUser(userId)),
    options.includeMedicalInfo
      ? loadContextSection("allergies", () => contextStorage.getAllergiesByUser(userId))
      : Promise.resolve(undefined),
    options.includeMedicalInfo
      ? loadContextSection("medical conditions", () =>
          contextStorage.getMedicalConditionsByUser(userId)
        )
      : Promise.resolve(undefined),
    options.includeMedicalInfo
      ? loadContextSection("adverse medication reactions", () =>
          contextStorage.getAdverseMedicationsByUser(userId)
        )
      : Promise.resolve(undefined),
    loadContextSection("goals", () => contextStorage.getSavingsGoalsByUser(userId)),
    loadContextSection("transition skills", () => contextStorage.getTransitionSkillsByUser(userId)),
    options.includeMoodSleep
      ? loadContextSection("mood", () => contextStorage.getRecentMoodEntriesByUser(userId, 7))
      : Promise.resolve(undefined),
    options.includeMoodSleep
      ? loadContextSection("sleep", () => contextStorage.getRecentSleepSessionsByUser(userId, 7))
      : Promise.resolve(undefined),
    loadContextSection("meals", () => contextStorage.getMealPlansByDate(userId, date)),
    loadContextSection("shopping", () => contextStorage.getActiveShoppingItems(userId)),
    loadContextSection("finance", () =>
      contextStorage.getRelevantBillsByUser(userId, Number(date.slice(8, 10)), 7)
    ),
    loadContextSection("points balance", () =>
      contextStorage.getExistingUserPointsBalance(userId)
    ),
    loadContextSection("recent achievements", () =>
      contextStorage.getRecentUserAchievements(userId, 5)
    ),
    loadContextSection("active rewards", () =>
      contextStorage.getActiveRewardsByUser(userId, 5)
    ),
    loadContextSection("recent points activity", () =>
      contextStorage.getRecentPointsTransactionsByUser(userId, 10)
    ),
    loadContextSection("preferences", () => contextStorage.getUserPreferences(userId)),
  ]);

  const todayTasks = rawTasks ? mapTasksToContext(rawTasks, date) : [];
  const todayAppointments = rawAppointments
    ? mapAppointmentsToContext(rawAppointments)
    : [];
  const upcomingAppointment = rawUpcomingAppointment
    ? mapAppointmentsToContext([rawUpcomingAppointment])[0]
    : undefined;
  const medications = rawMedications ? mapMedicationsToContext(rawMedications, userId) : [];
  const medicalConditions = rawMedicalConditions
    ? mapMedicalConditionsToContext(rawMedicalConditions, userId)
    : [];
  const allergies = rawAllergies ? mapAllergiesToContext(rawAllergies, userId) : [];
  const adverseMedications = rawAdverseMedications
    ? mapAdverseMedicationsToContext(rawAdverseMedications, userId)
    : [];
  const goals = rawGoals ? mapGoalsToContext(rawGoals, date, userId) : [];
  const skills = rawSkills ? mapTransitionSkillsToContext(rawSkills, userId) : [];
  const mood = rawMood ? mapMoodToContext(rawMood, userId) : [];
  const sleep = rawSleep ? mapSleepToContext(rawSleep, userId) : [];
  const meals = rawMeals ? mapMealsToContext(rawMeals) : [];
  const shopping = rawShopping ? mapShoppingToContext(rawShopping) : [];
  const dueBills = rawBills ? mapBillsToContext(rawBills) : [];
  const behaviorPreferences = mapPreferencesToContext(rawPreferences);
  const accessibility = mapAccessibilityToContext(rawPreferences);
  const points = mapPointsBalanceToContext(pointsBalance);
  const achievements = recentAchievements
    ? mapAchievementsToContext(recentAchievements, userId)
    : [];
  const rewards = activeRewards ? mapRewardsToContext(activeRewards, userId) : [];
  const pointsActivity = recentPointsActivity
    ? mapPointsActivityToContext(recentPointsActivity, userId)
    : [];

  const context: AdaptAIContext = {
    identity: {
      displayName: resolveDisplayName(sessionUser, storedUser?.name),
    },
    today: { date, time, timezone },
  };

  if (todayTasks.length > 0) {
    context.tasks = {
      today: todayTasks,
      incomplete: todayTasks.filter((task) => !task.isCompleted),
      completed: todayTasks.filter((task) => task.isCompleted),
    };
  }

  if (todayAppointments.length > 0 || upcomingAppointment) {
    context.appointments = {
      ...(todayAppointments.length > 0 ? { today: todayAppointments } : {}),
      ...(upcomingAppointment ? { upcoming: upcomingAppointment } : {}),
    };
  }

  if (medications.length > 0) {
    context.medications = {
      recorded: medications,
      scheduledToday: medications.filter((medication) => medication.reminderEnabled),
    };
  }
  if (
    options.includeMedicalInfo &&
    (medicalConditions.length > 0 || allergies.length > 0 || adverseMedications.length > 0)
  ) {
    context.medical = {
      conditions: medicalConditions,
      allergies,
      adverseMedications,
    };
  }
  if (goals.length > 0) context.goals = goals;
  if (mood.length > 0) context.mood = mood;
  if (sleep.length > 0) context.sleep = sleep;
  if (meals.length > 0) context.meals = meals;
  if (shopping.length > 0) context.shopping = shopping;
  if (dueBills.length > 0) context.finance = { due: dueBills };

  if (
    points ||
    achievements.length > 0 ||
    rewards.length > 0 ||
    pointsActivity.length > 0 ||
    skills.length > 0
  ) {
    context.progress = {
      ...(points ? { points } : {}),
      ...(achievements.length > 0 ? { recentAchievements: achievements } : {}),
      ...(rewards.length > 0 ? { recentRewards: rewards } : {}),
      ...(pointsActivity.length > 0 ? { recentActivity: pointsActivity } : {}),
      ...(skills.length > 0 ? { skills } : {}),
    };
  }

  if (behaviorPreferences || accessibility) {
    context.preferences = {
      ...(behaviorPreferences ? { behavior: behaviorPreferences } : {}),
      ...(accessibility ? { accessibility } : {}),
    };
  }

  return context;
}
