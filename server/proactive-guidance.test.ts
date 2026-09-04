import assert from "node:assert/strict";
import test from "node:test";
import type {
  Appointment,
  CalendarEvent,
  DailyTask,
  Medication,
  Notification,
  UserPreferences,
} from "../shared/schema.js";
import {
  prioritizeProactiveGuidance,
  type ProactiveGuidanceInput,
} from "./proactive-guidance.js";

const now = new Date("2026-09-04T10:00:00.000Z");

function task(overrides: Record<string, unknown> = {}): DailyTask {
  return {
    id: 1,
    userId: 1,
    title: "Task",
    category: "general",
    isCompleted: false,
    frequency: "once",
    scheduledTime: null,
    dueDate: null,
    ...overrides,
  } as unknown as DailyTask;
}

function appointment(overrides: Record<string, unknown> = {}): Appointment {
  return {
    id: 10,
    userId: 1,
    title: "Clinic appointment",
    appointmentDate: "2026-09-04T10:30:00",
    isCompleted: false,
    ...overrides,
  } as unknown as Appointment;
}

function medication(overrides: Record<string, unknown> = {}): Medication {
  return {
    id: 20,
    userId: 1,
    medicationName: "Daily medicine",
    isActive: true,
    reminderEnabled: true,
    ...overrides,
  } as unknown as Medication;
}

function calendarEvent(overrides: Record<string, unknown> = {}): CalendarEvent {
  return {
    id: 30,
    userId: 1,
    title: "Transition to work",
    category: "transition",
    startDate: new Date("2026-09-04T10:45:00.000Z"),
    isCompleted: false,
    ...overrides,
  } as unknown as CalendarEvent;
}

function notification(overrides: Record<string, unknown> = {}): Notification {
  return {
    id: 99,
    userId: 1,
    type: "adaptai_proactive",
    title: "Existing",
    message: "Existing",
    isRead: false,
    priority: "normal",
    ...overrides,
  } as unknown as Notification;
}

function input(overrides: Partial<ProactiveGuidanceInput> = {}): ProactiveGuidanceInput {
  return {
    userId: 1,
    now,
    localDate: "2026-09-04",
    localTime: "10:00",
    tasks: [],
    appointments: [],
    medications: [],
    calendarEvents: [],
    existingNotifications: [],
    ...overrides,
  };
}

test("surfaces an incomplete appointment preparation task", () => {
  const result = prioritizeProactiveGuidance(input({
    appointments: [appointment()],
    tasks: [task({ title: "Pack a bag", category: "preparation" })],
  }));

  assert.equal(result.status, "ready");
  assert.equal(result.candidate?.scenario, "appointment_preparation");
  assert.match(result.candidate?.message ?? "", /appointment is in 30 minutes/i);
  assert.match(result.candidate?.message ?? "", /Pack a bag/);
});

test("prioritizes one overdue task instead of notifying for every candidate", () => {
  const result = prioritizeProactiveGuidance(input({
    tasks: [
      task({ id: 1, title: "Submit overdue form", dueDate: "2026-09-03" }),
      task({ id: 2, title: "Important: review plan", category: "important" }),
      task({ id: 3, title: "Start routine", scheduledTime: "10:15" }),
    ],
  }));

  assert.equal(result.status, "ready");
  assert.equal(result.candidate?.scenario, "overdue_task");
  assert.equal(result.candidatesConsidered, 3);
});

test("only creates medication guidance for active medications with reminders enabled", () => {
  const result = prioritizeProactiveGuidance(input({
    tasks: [task({ title: "Take Daily medicine", scheduledTime: "10:10" })],
    medications: [medication()],
  }));

  assert.equal(result.candidate?.scenario, "medication_reminder");
  assert.match(result.candidate?.message ?? "", /scheduled in 10 minutes/i);

  const disabled = prioritizeProactiveGuidance(input({
    tasks: [task({ title: "Take Daily medicine", scheduledTime: "10:10" })],
    medications: [medication({ reminderEnabled: false })],
  }));
  assert.equal(disabled.suppressedReason, "no_relevant_guidance");
});

test("supports important tasks, schedule transitions, and preference timing", () => {
  const important = prioritizeProactiveGuidance(input({
    tasks: [task({ title: "Important: call the office", category: "important" })],
  }));
  assert.equal(important.candidate?.scenario, "important_task");

  const transition = prioritizeProactiveGuidance(input({
    calendarEvents: [calendarEvent()],
  }));
  assert.equal(transition.candidate?.scenario, "schedule_transition");

  const delayed = prioritizeProactiveGuidance(input({
    tasks: [task({ title: "Start routine", scheduledTime: "10:15" })],
    preferences: {
      reminderTiming: { taskReminders: 10 },
    } as unknown as UserPreferences,
  }));
  assert.equal(delayed.suppressedReason, "no_relevant_guidance");
});

test("honors disabled notifications, quiet hours, scope, and stable dedupe keys", () => {
  const taskForAnotherUser = task({ userId: 2, title: "Other user's task", scheduledTime: "10:05" });
  const ownTask = task({ title: "My task", scheduledTime: "10:05" });
  const scoped = prioritizeProactiveGuidance(input({ tasks: [taskForAnotherUser, ownTask] }));
  assert.equal(scoped.candidate?.sourceId, ownTask.id);

  const duplicate = prioritizeProactiveGuidance(input({
    tasks: [ownTask],
    existingNotifications: [notification({
      dedupeKey: scoped.candidate?.dedupeKey,
    })],
  }));
  assert.equal(duplicate.suppressedReason, "duplicate");
  assert.equal(duplicate.candidate?.dedupeKey, scoped.candidate?.dedupeKey);

  const disabled = prioritizeProactiveGuidance(input({
    tasks: [ownTask],
    preferences: {
      notificationSettings: { pushEnabled: false },
    } as unknown as UserPreferences,
  }));
  assert.equal(disabled.suppressedReason, "notifications_disabled");

  const quiet = prioritizeProactiveGuidance(input({
    tasks: [ownTask],
    preferences: {
      notificationSettings: {
        quietHours: { enabled: true, start: "09:00", end: "11:00" },
      },
    } as unknown as UserPreferences,
  }));
  assert.equal(quiet.suppressedReason, "quiet_hours");
});