import assert from "node:assert/strict";
import test from "node:test";
import type { AdaptAIContext } from "./ai-context.js";
import { buildNextAction, isNextActionRequest } from "./next-action.js";

const baseContext = (overrides: Partial<AdaptAIContext> = {}): AdaptAIContext => ({
  identity: { displayName: "Niraj" },
  today: { date: "2026-09-03", time: "09:00", timezone: "Asia/Calcutta" },
  ...overrides,
});

test("recognizes Next Action requests", () => {
  const requests = [
    "What's next?",
    "What should I do now?",
    "What should I do first?",
    "What do I need to do next?",
    "Help me get started.",
  ];

  for (const request of requests) {
    assert.equal(isNextActionRequest(request), true, request);
  }

  assert.equal(isNextActionRequest("What do I need to do today?"), false);
});

test("prioritizes an overdue task over an appointment and reminder", () => {
  const response = buildNextAction(
    baseContext({
      tasks: {
        today: [],
        incomplete: [
          {
            title: "Submit overdue form",
            category: "admin",
            dueDate: "2026-09-02",
            isCompleted: false,
            frequency: "once",
            estimatedMinutes: 10,
          },
        ],
        completed: [],
      },
      appointments: {
        today: [{ title: "Dentist", appointmentDate: "2026-09-03T14:00:00" }],
      },
      medications: {
        scheduledToday: [
          { medicationName: "Vitamin D", reminderEnabled: true },
        ],
      },
    })
  );

  assert.match(response, /overdue/i);
  assert.match(response, /Submit overdue form/);
  assert.doesNotMatch(response, /Dentist|Vitamin D/);
});

test("prioritizes the next appointment before a medication reminder", () => {
  const response = buildNextAction(
    baseContext({
      appointments: {
        today: [{ title: "Dentist appointment", appointmentDate: "2026-09-03T14:00:00" }],
      },
      medications: {
        scheduledToday: [
          { medicationName: "Vitamin D", reminderEnabled: true },
        ],
      },
    })
  );

  assert.equal(
    response,
    "The next important thing is your Dentist appointment at 2:00 PM."
  );
});

test("ignores an appointment whose scheduled time has already passed", () => {
  const response = buildNextAction(
    baseContext({
      today: { date: "2026-09-03", time: "15:00", timezone: "Asia/Calcutta" },
      appointments: {
        today: [{ title: "Finished appointment", appointmentDate: "2026-09-03T10:00:00" }],
      },
      tasks: {
        today: [],
        incomplete: [
          {
            title: "Review notes",
            category: "organization",
            scheduledTime: "16:00",
            isCompleted: false,
            frequency: "once",
            estimatedMinutes: 10,
          },
        ],
        completed: [],
      },
    })
  );

  assert.equal(
    response,
    "You don't have anything urgent right now. Your next planned item is Review notes at 4:00 PM."
  );
  assert.doesNotMatch(response, /Finished appointment/);
});

test("prioritizes a scheduled medication when there is no urgent task or appointment", () => {
  const response = buildNextAction(
    baseContext({
      medications: {
        scheduledToday: [
          { medicationName: "Morning medicine", dosage: "1 tablet", reminderEnabled: true },
        ],
      },
      tasks: {
        today: [],
        incomplete: [
          {
            title: "Tidy room",
            category: "organization",
            isCompleted: false,
            frequency: "weekly",
            estimatedMinutes: 20,
          },
        ],
        completed: [],
      },
    })
  );

  assert.match(response, /next important thing/i);
  assert.match(response, /Take medication: Morning medicine \(1 tablet\)/);
  assert.doesNotMatch(response, /Tidy room/);
});

test("uses an important routine before a goal-related action", () => {
  const response = buildNextAction(
    baseContext({
      tasks: {
        today: [],
        incomplete: [
          {
            title: "Morning routine",
            category: "routine",
            scheduledTime: "10:00",
            isCompleted: false,
            frequency: "daily",
            estimatedMinutes: 15,
          },
        ],
        completed: [],
      },
      goals: [
        {
          title: "Save for a bicycle",
          category: "personal",
          priority: "high",
          isDueToday: true,
          isCompleted: false,
        },
      ],
    })
  );

  assert.equal(response, "The next important thing is Morning routine at 10:00 AM.");
});

test("falls back to the next planned item when nothing is urgent", () => {
  const response = buildNextAction(
    baseContext({
      tasks: {
        today: [],
        incomplete: [
          {
            title: "Pick up groceries",
            category: "shopping",
            scheduledTime: "17:00",
            isCompleted: false,
            frequency: "once",
            estimatedMinutes: 30,
          },
        ],
        completed: [],
      },
    })
  );

  assert.equal(
    response,
    "You don't have anything urgent right now. Your next planned item is Pick up groceries at 5:00 PM."
  );
});

test("does not invent a time when the next action has no time", () => {
  const response = buildNextAction(
    baseContext({
      medications: {
        scheduledToday: [
          { medicationName: "Evening medicine", reminderEnabled: true },
        ],
      },
    })
  );

  assert.match(response, /Take medication: Evening medicine/);
  assert.doesNotMatch(response, /\bat \d{1,2}:\d{2}/);
});

test("handles an empty context without creating an action", () => {
  assert.equal(
    buildNextAction(baseContext()),
    "You don't have anything urgent right now. You're all caught up for now."
  );
});