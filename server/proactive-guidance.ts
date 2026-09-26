import { storage, type IStorage } from "./storage.js";
import type {
  Appointment,
  CalendarEvent,
  DailyTask,
  InsertNotification,
  Medication,
  Notification,
  UserPreferences,
} from "../shared/schema.js";

export type ProactiveGuidanceScenario =
  | "appointment_preparation"
  | "scheduled_task"
  | "important_task"
  | "medication_reminder"
  | "overdue_task"
  | "schedule_transition";

export type ProactiveGuidanceSuppressionReason =
  | "invalid_user"
  | "notifications_disabled"
  | "quiet_hours"
  | "no_relevant_guidance"
  | "duplicate";

export interface ProactiveGuidanceCandidate {
  scenario: ProactiveGuidanceScenario;
  priority: number;
  sourceId: number;
  relatedId: number;
  dedupeKey: string;
  title: string;
  message: string;
  scheduledFor: Date;
}

export interface ProactiveGuidanceDecision {
  status: "ready" | "suppressed";
  candidate?: ProactiveGuidanceCandidate;
  candidatesConsidered: number;
  suppressedReason?: ProactiveGuidanceSuppressionReason;
}

export interface ProactiveGuidanceInput {
  userId: number;
  now: Date;
  localDate?: string;
  localTime?: string;
  tasks: DailyTask[];
  appointments: Appointment[];
  medications: Medication[];
  calendarEvents: CalendarEvent[];
  preferences?: UserPreferences | null;
  existingNotifications: Notification[];
}

export type ProactiveGuidanceStorage = Pick<
  IStorage,
  | "getDailyTasksByUser"
  | "getAppointmentsByUser"
  | "getMedicationsByUser"
  | "getCalendarEventsByUser"
  | "getUserPreferences"
  | "getNotificationsByUser"
  | "createNotificationIfNew"
>;

export interface ProactiveGuidanceRunResult extends ProactiveGuidanceDecision {
  notification?: Notification;
}

const DEFAULT_TASK_LEAD_MINUTES = 30;
const DEFAULT_APPOINTMENT_LEAD_MINUTES = 60;
const DEFAULT_MEDICATION_LEAD_MINUTES = 15;
const DEFAULT_TRANSITION_LEAD_MINUTES = 60;

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function booleanSetting(
  prefs: UserPreferences | null | undefined,
  section: "notificationSettings" | "reminderTiming",
  keys: readonly string[],
): boolean | undefined {
  const source = record(prefs?.[section]);
  if (!source) return undefined;
  for (const key of keys) {
    if (typeof source[key] === "boolean") return source[key] as boolean;
  }
  return undefined;
}

function minutesSetting(
  prefs: UserPreferences | null | undefined,
  keys: readonly string[],
  fallback: number,
): number {
  const source = record(prefs?.reminderTiming);
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 24 * 60) {
      return value;
    }
  }
  return fallback;
}

function notificationsEnabled(prefs: UserPreferences | null | undefined): boolean {
  const notificationSettings = record(prefs?.notificationSettings);
  if (!notificationSettings) return true;
  for (const key of ["proactiveGuidanceEnabled", "proactiveGuidance", "pushEnabled", "notificationsEnabled"]) {
    if (notificationSettings[key] === false) return false;
  }
  return true;
}

function scenarioEnabled(
  prefs: UserPreferences | null | undefined,
  scenario: ProactiveGuidanceScenario,
): boolean {
  const keys =
    scenario === "appointment_preparation" || scenario === "schedule_transition"
      ? ["appointmentReminders"]
      : scenario === "medication_reminder"
        ? ["medicationReminders"]
        : scenario === "overdue_task"
          ? ["overdueReminders", "taskReminders"]
          : ["taskReminders"];

  return keys.every((key) =>
    booleanSetting(prefs, "reminderTiming", [key]) !== false &&
    booleanSetting(prefs, "notificationSettings", [key]) !== false
  );
}

function parseClock(
  input: ProactiveGuidanceInput,
): { date: string; time: string; minutes: number } {
  const date =
    input.localDate && /^\d{4}-\d{2}-\d{2}$/.test(input.localDate)
      ? input.localDate
      : input.now.toISOString().slice(0, 10);
  const time =
    input.localTime && /^\d{2}:\d{2}$/.test(input.localTime)
      ? input.localTime
      : input.now.toISOString().slice(11, 16);
  const [hours, minutes] = time.split(":").map(Number);
  return { date, time, minutes: hours * 60 + minutes };
}

function dateKey(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
}

function timeMinutes(value: string | null | undefined): number | undefined {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return undefined;
  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) return undefined;
  return hours * 60 + minutes;
}

function minutesUntil(
  date: string,
  time: string | undefined,
  clock: { date: string; minutes: number },
): number | undefined {
  const scheduledMinutes = timeMinutes(time);
  if (scheduledMinutes === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;

  const current = new Date(`${clock.date}T00:00:00Z`).getTime();
  const scheduled = new Date(`${date}T00:00:00Z`).getTime();
  if (Number.isNaN(current) || Number.isNaN(scheduled)) return undefined;
  return Math.round((scheduled - current) / 86_400_000) * 24 * 60 +
    scheduledMinutes -
    clock.minutes;
}

function appointmentDetails(appointment: Appointment): {
  date: string;
  time?: string;
} | undefined {
  const match = appointment.appointmentDate.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/);
  return match ? { date: match[1], time: match[2] } : undefined;
}

function safeLabel(value: string | null | undefined, fallback: string): string {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return value.trim().replace(/\s+/g, " ").slice(0, 120) || fallback;
}

function formatMinutes(value: number): string {
  if (value < 60) return `in ${value} ${value === 1 ? "minute" : "minutes"}`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (minutes === 0) return `in ${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `in ${hours}h ${minutes}m`;
}

function taskText(task: DailyTask): string {
  return `${task.title} ${task.category}`.toLowerCase();
}

function isPreparationTask(task: DailyTask): boolean {
  return /\b(appointment|prepare|preparation|prep|pack|bring|paperwork|document|ready)\b/
    .test(taskText(task));
}

function isMedicationTask(task: DailyTask, medications: Medication[]): boolean {
  const text = taskText(task);
  if (/\b(medication|medicine|meds|pill|dose|prescription)\b/.test(text)) return true;
  return medications.some((medication) => {
    const name = safeLabel(medication.medicationName, "").toLowerCase();
    return name.length > 0 && text.includes(name);
  });
}

function matchesAppointmentPreparation(task: DailyTask, appointment: Appointment): boolean {
  if (!isPreparationTask(task)) return false;
  const genericPreparation = /\b(prepare|preparation|prep|pack|bring|paperwork|document|ready)\b/
    .test(taskText(task));
  if (genericPreparation) return true;
  const appointmentWords = safeLabel(appointment.title, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3 && !["appointment", "visit", "meeting"].includes(word));
  const title = task.title.toLowerCase();
  if (title.includes("appointment") || appointmentWords.length === 0) return true;
  return appointmentWords.some((word) => title.includes(word));
}

function isImportantTask(task: DailyTask): boolean {
  return /\b(important|urgent|high[- ]priority|deadline)\b/.test(taskText(task));
}

function isTransitionEvent(event: CalendarEvent): boolean {
  const text = `${event.title} ${event.category ?? ""}`.toLowerCase();
  return /\b(transition|changeover|leaving for|departing for)\b/.test(text);
}

function taskOccurrence(task: DailyTask, date: string, time?: string): string {
  return `${date}:${time ?? dateKey(task.dueDate) ?? "anytime"}`;
}

function candidate(
  scenario: ProactiveGuidanceScenario,
  priority: number,
  sourceId: number,
  occurrence: string,
  title: string,
  message: string,
  scheduledFor: Date,
): ProactiveGuidanceCandidate {
  return {
    scenario,
    priority,
    sourceId,
    relatedId: sourceId,
    dedupeKey: `adaptai-proactive:${scenario}:${sourceId}:${occurrence}`,
    title,
    message,
    scheduledFor,
  };
}

function quietHoursActive(
  prefs: UserPreferences | null | undefined,
  time: string,
): boolean {
  const notificationSettings = record(prefs?.notificationSettings);
  const reminderTiming = record(prefs?.reminderTiming);
  const quietHours = record(notificationSettings?.quietHours) ?? record(reminderTiming?.quietHours);
  if (!quietHours?.enabled || typeof quietHours.start !== "string" || typeof quietHours.end !== "string") {
    return false;
  }
  const current = timeMinutes(time);
  const start = timeMinutes(quietHours.start);
  const end = timeMinutes(quietHours.end);
  if (current === undefined || start === undefined || end === undefined || start === end) return false;
  return start < end ? current >= start && current < end : current >= start || current < end;
}

function buildCandidates(input: ProactiveGuidanceInput): ProactiveGuidanceCandidate[] {
  const clock = parseClock(input);
  const candidates: ProactiveGuidanceCandidate[] = [];
  const ownTasks = input.tasks.filter((task) => task.userId === input.userId && !task.isCompleted);
  const ownAppointments = input.appointments.filter(
    (appointment) => appointment.userId === input.userId && !appointment.isCompleted,
  );
  const ownMedications = input.medications.filter(
    (medication) => medication.userId === input.userId && medication.isActive !== false && medication.reminderEnabled !== false,
  );
  const ownEvents = input.calendarEvents.filter(
    (event) => event.userId === input.userId && !event.isCompleted,
  );

  const taskLead = minutesSetting(input.preferences, ["taskReminders"], DEFAULT_TASK_LEAD_MINUTES);
  const appointmentLead = minutesSetting(input.preferences, ["appointmentReminders"], DEFAULT_APPOINTMENT_LEAD_MINUTES);
  const medicationLead = minutesSetting(input.preferences, ["medicationReminders"], DEFAULT_MEDICATION_LEAD_MINUTES);
  const transitionLead = Math.max(appointmentLead, DEFAULT_TRANSITION_LEAD_MINUTES);

  if (scenarioEnabled(input.preferences, "appointment_preparation")) {
    for (const appointment of ownAppointments) {
      const details = appointmentDetails(appointment);
      if (!details?.time || appointment.id < 1) continue;
      const until = minutesUntil(details.date, details.time, clock);
      if (until === undefined || until < 0 || until > appointmentLead) continue;
      const prepTask = ownTasks.find((task) => matchesAppointmentPreparation(task, appointment));
      if (!prepTask || prepTask.id < 1) continue;
      const appointmentLabel = formatMinutes(until);
      const taskLabel = safeLabel(prepTask.title, "your preparation task");
      candidates.push(candidate(
        "appointment_preparation",
        100,
        appointment.id,
        appointment.appointmentDate,
        "Appointment preparation",
        `Your appointment is ${appointmentLabel}. Your "${taskLabel}" task is still incomplete.`,
        new Date(appointment.appointmentDate),
      ));
    }
  }

  if (scenarioEnabled(input.preferences, "medication_reminder")) {
    for (const task of ownTasks) {
      if (
        task.id < 1 ||
        !task.scheduledTime ||
        ownMedications.length === 0 ||
        !isMedicationTask(task, ownMedications)
      ) continue;
      const until = minutesUntil(clock.date, task.scheduledTime, clock);
      if (until === undefined || until < 0 || until > medicationLead) continue;
      const label = safeLabel(task.title, "your medication task");
      candidates.push(candidate(
        "medication_reminder",
        95,
        task.id,
        taskOccurrence(task, clock.date, task.scheduledTime),
        "Medication reminder",
        `Your "${label}" task is scheduled ${formatMinutes(until)}.`,
        new Date(`${clock.date}T${task.scheduledTime}:00Z`),
      ));
    }
  }

  if (scenarioEnabled(input.preferences, "overdue_task")) {
    for (const task of ownTasks) {
      if (task.id < 1) continue;
      const dueDate = dateKey(task.dueDate);
      const scheduled = task.scheduledTime ? timeMinutes(task.scheduledTime) : undefined;
      const overdue =
        (dueDate !== undefined && dueDate < clock.date) ||
        (dueDate === undefined || dueDate === clock.date) &&
          scheduled !== undefined &&
          scheduled < clock.minutes;
      if (!overdue) continue;
      const label = safeLabel(task.title, "your task");
      candidates.push(candidate(
        "overdue_task",
        90,
        task.id,
        taskOccurrence(task, dueDate ?? clock.date, task.scheduledTime),
        "Overdue task",
        `Your "${label}" task is overdue. You can still work on it when you're ready.`,
        new Date(`${clock.date}T00:00:00Z`),
      ));
    }
  }

  if (scenarioEnabled(input.preferences, "scheduled_task")) {
    for (const task of ownTasks) {
      if (task.id < 1 || !task.scheduledTime || isMedicationTask(task, ownMedications)) continue;
      const until = minutesUntil(clock.date, task.scheduledTime, clock);
      if (until === undefined || until < 0 || until > taskLead) continue;
      const label = safeLabel(task.title, "your task");
      candidates.push(candidate(
        "scheduled_task",
        80,
        task.id,
        taskOccurrence(task, clock.date, task.scheduledTime),
        "Upcoming task",
        `Your "${label}" task is scheduled ${formatMinutes(until)}.`,
        new Date(`${clock.date}T${task.scheduledTime}:00Z`),
      ));
    }
  }

  if (scenarioEnabled(input.preferences, "important_task")) {
    for (const task of ownTasks) {
      if (task.id < 1 || !isImportantTask(task)) continue;
      const dueDate = dateKey(task.dueDate);
      if (dueDate && dueDate > clock.date) continue;
      const label = safeLabel(task.title, "your important task");
      candidates.push(candidate(
        "important_task",
        70,
        task.id,
        taskOccurrence(task, dueDate ?? clock.date, task.scheduledTime),
        "Important task",
        `A useful next step is your "${label}" task.`,
        new Date(`${clock.date}T00:00:00Z`),
      ));
    }
  }

  if (scenarioEnabled(input.preferences, "schedule_transition")) {
    for (const event of ownEvents) {
      if (event.id < 1 || !isTransitionEvent(event)) continue;
      const eventStart = new Date(event.startDate);
      if (Number.isNaN(eventStart.getTime())) continue;
      const eventDate = eventStart.toISOString().slice(0, 10);
      const eventTime = eventStart.toISOString().slice(11, 16);
      if (!eventDate || !eventTime) continue;
      const until = minutesUntil(eventDate, eventTime, clock);
      if (until === undefined || until < 0 || until > transitionLead) continue;
      const label = safeLabel(event.title, "a schedule change");
      candidates.push(candidate(
        "schedule_transition",
        75,
        event.id,
        eventStart.toISOString(),
        "Schedule transition",
        `Your schedule changes ${formatMinutes(until)}: "${label}".`,
        eventStart,
      ));
    }
  }

  return candidates.sort((left, right) =>
    right.priority - left.priority ||
    left.scheduledFor.getTime() - right.scheduledFor.getTime() ||
    left.sourceId - right.sourceId
  );
}

export function prioritizeProactiveGuidance(
  input: ProactiveGuidanceInput,
): ProactiveGuidanceDecision {
  if (!Number.isInteger(input.userId) || input.userId < 1) {
    return { status: "suppressed", candidatesConsidered: 0, suppressedReason: "invalid_user" };
  }

  const clock = parseClock(input);
  if (!notificationsEnabled(input.preferences)) {
    return { status: "suppressed", candidatesConsidered: 0, suppressedReason: "notifications_disabled" };
  }
  if (quietHoursActive(input.preferences, clock.time)) {
    return { status: "suppressed", candidatesConsidered: 0, suppressedReason: "quiet_hours" };
  }

  const candidates = buildCandidates(input);
  const selected = candidates[0];
  if (!selected) {
    return { status: "suppressed", candidatesConsidered: 0, suppressedReason: "no_relevant_guidance" };
  }

  const duplicate = input.existingNotifications.some(
    (notification) =>
      notification.userId === input.userId &&
      notification.dedupeKey === selected.dedupeKey,
  );
  if (duplicate) {
    return {
      status: "suppressed",
      candidate: selected,
      candidatesConsidered: candidates.length,
      suppressedReason: "duplicate",
    };
  }

  return {
    status: "ready",
    candidate: selected,
    candidatesConsidered: candidates.length,
  };
}

export async function evaluateAndSurfaceProactiveGuidance(
  userId: number,
  now = new Date(),
  contextStorage: ProactiveGuidanceStorage = storage,
): Promise<ProactiveGuidanceRunResult> {
  if (!Number.isInteger(userId) || userId < 1) {
    return { status: "suppressed", candidatesConsidered: 0, suppressedReason: "invalid_user" };
  }

  const [
    tasks,
    appointments,
    medications,
    calendarEvents,
    preferences,
    existingNotifications,
  ] = await Promise.all([
    contextStorage.getDailyTasksByUser(userId),
    contextStorage.getAppointmentsByUser(userId),
    contextStorage.getMedicationsByUser(userId),
    contextStorage.getCalendarEventsByUser(userId),
    contextStorage.getUserPreferences(userId),
    contextStorage.getNotificationsByUser(userId),
  ]);

  const decision = prioritizeProactiveGuidance({
    userId,
    now,
    tasks: tasks.filter((task) => task.userId === userId),
    appointments: appointments.filter((appointment) => appointment.userId === userId),
    medications: medications.filter((medication) => medication.userId === userId),
    calendarEvents: calendarEvents.filter((event) => event.userId === userId),
    preferences,
    existingNotifications: existingNotifications.filter(
      (notification) => notification.userId === userId,
    ),
  });

  if (decision.status !== "ready" || !decision.candidate) return decision;

  const notificationData: InsertNotification = {
    userId,
    type: "adaptai_proactive",
    title: decision.candidate.title,
    message: decision.candidate.message,
    isRead: false,
    scheduledFor: decision.candidate.scheduledFor,
    relatedId: decision.candidate.relatedId,
    dedupeKey: decision.candidate.dedupeKey,
    priority: decision.candidate.priority >= 90 ? "high" : "normal",
  };
  const notification = await contextStorage.createNotificationIfNew(notificationData);
  if (!notification) {
    return {
      ...decision,
      status: "suppressed",
      suppressedReason: "duplicate",
    };
  }
  return { ...decision, notification };
}