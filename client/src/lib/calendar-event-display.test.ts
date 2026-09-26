import assert from "node:assert/strict";
import test from "node:test";

import { getCalendarEventDisplayFields } from "./calendar-event-display";

test("keeps a reloaded all-day event date and flag in the display model", () => {
  const display = getCalendarEventDisplayFields({
    startDate: "2026-09-24T00:00:00.000Z",
    allDay: true,
  });

  assert.equal(display.dateKey, "2026-09-24");
  assert.equal(display.allDay, true);
  assert.equal(display.time, null);
});

test("keeps timed events as timed when building the display model", () => {
  const display = getCalendarEventDisplayFields({
    startDate: "2026-09-24T09:30:00.000Z",
    allDay: false,
  });

  assert.equal(display.allDay, false);
  assert.notEqual(display.time, null);
});