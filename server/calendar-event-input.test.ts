import assert from "node:assert/strict";
import test from "node:test";

import {
  CalendarEventWriteError,
  normalizeCalendarEventWriteInput,
} from "./calendar-event-input";

test("normalizes an all-day create to an explicit true and UTC date anchors", () => {
  const event = normalizeCalendarEventWriteInput({
    title: "Holiday",
    allDay: true,
    startDate: "2026-09-24",
    endDate: "2026-09-26T23:30:00-07:00",
  });

  assert.equal(event.allDay, true);
  assert.equal(
    (event.startDate as Date).toISOString(),
    "2026-09-24T00:00:00.000Z",
  );
  assert.equal(
    (event.endDate as Date).toISOString(),
    "2026-09-26T00:00:00.000Z",
  );
});

test("normalizes a timed create to an explicit false and preserves instants", () => {
  const event = normalizeCalendarEventWriteInput({
    allDay: false,
    startDate: "2026-09-24T09:30:00-07:00",
    endDate: "2026-09-24T10:30:00-07:00",
  });

  assert.equal(event.allDay, false);
  assert.equal(
    (event.startDate as Date).toISOString(),
    "2026-09-24T16:30:00.000Z",
  );
  assert.equal(
    (event.endDate as Date).toISOString(),
    "2026-09-24T17:30:00.000Z",
  );
});

test("partial updates preserve allDay when the caller does not change it", () => {
  const event = normalizeCalendarEventWriteInput(
    { title: "Renamed holiday" },
    true,
  );

  assert.equal("allDay" in event, false);
  assert.equal("startDate" in event, false);
});

test("rejects malformed allDay values and invalid all-day dates", () => {
  assert.throws(
    () =>
      normalizeCalendarEventWriteInput({
        allDay: "true",
        startDate: "2026-09-24",
      }),
    CalendarEventWriteError,
  );
  assert.throws(
    () =>
      normalizeCalendarEventWriteInput({
        allDay: true,
        startDate: "2026-02-30",
      }),
    CalendarEventWriteError,
  );
});