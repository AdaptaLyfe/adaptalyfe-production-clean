import assert from "node:assert/strict";
import test from "node:test";
import type { AdaptAIContext } from "./ai-context.js";
import { buildTodayBriefing, isTodayBriefingRequest } from "./today-briefing.js";

const baseContext = (overrides: Partial<AdaptAIContext> = {}): AdaptAIContext => ({
  identity: { displayName: "Niraj" },
  today: { date: "2026-09-03", time: "09:00", timezone: "Asia/Calcutta" },
  ...overrides,
});

test("recognizes natural-language Today Briefing requests", () => {
  const requests = [
    "What do I need to do today?",
    "What's on my schedule today?",
    "What do I have today?",
    "What should I do today?",
    "What's important today?",
    "Plan my day.",
  ];

  for (const request of requests) {
    assert.equal(isTodayBriefingRequest(request), true, request);
  }

  assert.equal(isTodayBriefingRequest("What happened today?"), false);
});

test("sorts multiple time-based events chronologically", () => {
  const briefing = buildTodayBriefing(
    baseContext({
      tasks: {
        today: [
          {
            title: "Evening routine",
            category: "routine",
            scheduledTime: "17:00",
            isCompleted: false,
            frequency: "daily",
            estimatedMinutes: 15,
          },
          {
            title: "Morning routine",
            category: "routine",
            scheduledTime: "09:00",
            isCompleted: false,
            frequency: "daily",
            estimatedMinutes: 15,
          },
        ],
        incomplete: [
          {
            title: "Evening routine",
            category: "routine",
            scheduledTime: "17:00",
            isCompleted: false,
            frequency: "daily",
            estimatedMinutes: 15,
          },
          {
            title: "Morning routine",
            category: "routine",
            scheduledTime: "09:00",
            isCompleted: false,
            frequency: "daily",
            estimatedMinutes: 15,
          },
        ],
        completed: [],
      },
      appointments: {
        today: [
          {
            title: "Doctor appointment",
            appointmentDate: "2026-09-03T14:30:00",
          },
        ],
      },
    })
  );

  assert.match(briefing, /Good morning, Niraj\./);
  assert.match(briefing, /You have 3 things planned today/);
  assert.ok(briefing.indexOf("9:00 AM — Morning routine") < briefing.indexOf("2:30 PM — Doctor appointment"));
  assert.ok(briefing.indexOf("2:30 PM — Doctor appointment") < briefing.indexOf("5:00 PM — Evening routine"));
});

test("renders an empty day naturally and suggests a data-based next action", () => {
  const briefing = buildTodayBriefing(
    baseContext({
      goals: [
        {
          title: "Save for a bicycle",
          category: "personal",
          priority: "normal",
          isDueToday: false,
          isCompleted: false,
        },
      ],
    })
  );

  assert.match(briefing, /Good morning, Niraj\./);
  assert.match(briefing, /don’t have anything else planned today/i);
  assert.match(briefing, /make a little progress on your goal: Save for a bicycle/i);
});

test("does not list completed tasks when active work is available", () => {
  const briefing = buildTodayBriefing(
    baseContext({
      tasks: {
        today: [],
        incomplete: [
          {
            title: "Call the clinic",
            category: "health",
            isCompleted: false,
            frequency: "once",
            estimatedMinutes: 10,
          },
        ],
        completed: [
          {
            title: "Already finished task",
            category: "routine",
            isCompleted: true,
            frequency: "daily",
            estimatedMinutes: 10,
          },
        ],
      },
    })
  );

  assert.match(briefing, /Call the clinic/);
  assert.doesNotMatch(briefing, /Already finished task/);
});

test("places items without times after timed items without inventing times", () => {
  const briefing = buildTodayBriefing(
    baseContext({
      tasks: {
        today: [],
        incomplete: [
          {
            title: "Flexible routine",
            category: "routine",
            isCompleted: false,
            frequency: "daily",
            estimatedMinutes: 15,
          },
        ],
        completed: [],
      },
      appointments: {
        today: [
          {
            title: "Time not specified appointment",
            appointmentDate: "2026-09-03",
          },
        ],
      },
    })
  );

  assert.match(briefing, /Anytime — Time not specified appointment/);
  assert.match(briefing, /Anytime — Flexible routine/);
  assert.doesNotMatch(briefing, /12:00 AM/);
});

test("combines medication reminders, appointments, and tasks", () => {
  const briefing = buildTodayBriefing(
    baseContext({
      medications: {
        scheduledToday: [
          {
            medicationName: "Vitamin D",
            dosage: "1 tablet",
            reminderEnabled: true,
          },
        ],
      },
      appointments: {
        today: [
          {
            title: "Therapy appointment",
            appointmentDate: "2026-09-03T10:30:00",
          },
        ],
      },
      tasks: {
        today: [],
        incomplete: [
          {
            title: "Pack lunch",
            category: "routine",
            scheduledTime: "12:00",
            isCompleted: false,
            frequency: "daily",
            estimatedMinutes: 10,
          },
        ],
        completed: [],
      },
    })
  );

  assert.match(briefing, /You have 3 things planned today/);
  assert.ok(briefing.indexOf("10:30 AM — Therapy appointment") < briefing.indexOf("12:00 PM — Pack lunch"));
  assert.ok(briefing.indexOf("12:00 PM — Pack lunch") < briefing.indexOf("Anytime — Take medication: Vitamin D"));
});