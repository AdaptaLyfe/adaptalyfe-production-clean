import assert from "node:assert/strict";
import test from "node:test";
import type { AdaptAIContext, AiAppointment, AiTask } from "./ai-context.js";
import {
  buildAppointmentTransitionResponse,
  isAppointmentTransitionRequest,
} from "./appointment-transitions.js";

const appointment = (
  title: string,
  appointmentDate: string
): AiAppointment => ({ title, appointmentDate });

const task = (overrides: Partial<AiTask>): AiTask => ({
  title: "Task",
  category: "general",
  isCompleted: false,
  frequency: "once",
  estimatedMinutes: 10,
  ...overrides,
});

const context = (
  appointments: AiAppointment[],
  time = "09:00",
  tasks: AiTask[] = []
): AdaptAIContext => ({
  identity: { displayName: "Niraj" },
  today: { date: "2026-09-03", time, timezone: "Asia/Calcutta" },
  appointments: appointments.length ? { today: appointments } : undefined,
  tasks: tasks.length
    ? {
        today: tasks,
        incomplete: tasks.filter((item) => !item.isCompleted),
        completed: tasks.filter((item) => item.isCompleted),
      }
    : undefined,
});

test("recognizes appointment and transition questions", () => {
  const requests = [
    "When is my next appointment?",
    "What do I have coming up?",
    "What should I get ready for?",
    "What's next?",
    "Am I running late?",
  ];

  for (const request of requests) {
    assert.equal(isAppointmentTransitionRequest(request), true, request);
  }
});

test("ignores past appointments and returns the next upcoming appointment", () => {
  const response = buildAppointmentTransitionResponse(
    "When is my next appointment?",
    context(
      [
        appointment("Past appointment", "2026-09-03T08:00:00"),
        appointment("Dentist", "2026-09-03T14:00:00"),
      ],
      "10:00"
    )
  );

  assert.equal(
    response,
    "Your next appointment is Dentist at 2:00 PM, in 4 hours."
  );
  assert.doesNotMatch(response, /Past appointment/);
});

test("lists multiple upcoming appointments in chronological order", () => {
  const response = buildAppointmentTransitionResponse(
    "What do I have coming up?",
    context([
      appointment("Therapy", "2026-09-04T10:00:00"),
      appointment("Dentist", "2026-09-03T14:00:00"),
      appointment("Pharmacy", "2026-09-03T12:00:00"),
    ])
  );

  assert.equal(
    response,
    "Coming up, you have Pharmacy at 12:00 PM; Dentist at 2:00 PM; Therapy on September 4 at 10:00 AM."
  );
});

test("handles no appointments without inventing an event", () => {
  const response = buildAppointmentTransitionResponse(
    "When is my next appointment?",
    context([])
  );

  assert.equal(response, "I don't see any upcoming appointments in your schedule.");
});

test("connects an existing preparation task to the next appointment", () => {
  const response = buildAppointmentTransitionResponse(
    "What should I get ready for?",
    context(
      [appointment("Dentist appointment", "2026-09-03T14:00:00")],
      "10:00",
      [task({ title: "Pack appointment bag" })]
    )
  );

  assert.equal(
    response,
    "Your appointment is at 2:00 PM. Before that, you still need to finish your 'Pack appointment bag' task."
  );
});

test("does not invent preparation details or travel timing", () => {
  const response = buildAppointmentTransitionResponse(
    "What should I get ready for?",
    context([appointment("Dentist", "2026-09-03T14:00:00")])
  );

  assert.equal(
    response,
    "Your appointment is at 2:00 PM. I don't see a specific preparation task for it yet."
  );
  assert.doesNotMatch(response, /travel|leave|minutes early|bring your ID/i);
});

test("answers running-late questions without claiming to know the user's location", () => {
  const response = buildAppointmentTransitionResponse(
    "Am I running late?",
    context([appointment("Dentist", "2026-09-03T08:00:00")], "10:00")
  );

  assert.equal(
    response,
    "Your Dentist was scheduled at 8:00 AM. I can't tell from your schedule whether you're running late."
  );
});