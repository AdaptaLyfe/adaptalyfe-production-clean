import assert from "node:assert/strict";
import test from "node:test";

import { buildCalendarEventPayload } from "./calendar-event-payload";
import { toCalendarDateTimeIso } from "./calendar-date";

const baseEvent = {
  title: "Appointment",
  description: "",
  startDate: "2026-09-24",
  startTime: "09:30",
  endDate: "2026-09-24",
  endTime: "10:30",
  allDay: false,
  category: "personal",
  color: "#3b82f6",
  location: "",
  reminderMinutes: 15,
};

test("includes allDay true and date-only values in an all-day payload", () => {
  const payload = buildCalendarEventPayload({
    ...baseEvent,
    allDay: true,
    startTime: "09:30",
    endTime: "10:30",
  });

  assert.equal(payload.allDay, true);
  assert.equal(payload.startDate, "2026-09-24");
  assert.equal(payload.endDate, "2026-09-24");
});

test("includes allDay false and explicit instants in a timed payload", () => {
  const payload = buildCalendarEventPayload(baseEvent);

  assert.equal(payload.allDay, false);
  assert.equal(payload.startDate, toCalendarDateTimeIso("2026-09-24", "09:30"));
  assert.equal(payload.endDate, toCalendarDateTimeIso("2026-09-24", "10:30"));
});