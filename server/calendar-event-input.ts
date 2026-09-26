export class CalendarEventWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalendarEventWriteError";
  }
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function parseAllDay(value: unknown): boolean {
  if (value === undefined) return false;
  if (typeof value !== "boolean") {
    throw new CalendarEventWriteError("All-day state must be a boolean.");
  }
  return value;
}

function parseEventDate(value: unknown, allDay: boolean): Date {
  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    !(value instanceof Date)
  ) {
    throw new CalendarEventWriteError("A valid event date is required.");
  }

  if (allDay) {
    let dateKey: string | undefined;
    if (typeof value === "string") {
      dateKey = value.trim().match(/^(\d{4}-\d{2}-\d{2})(?:$|[T\s])/)?.[1];
    } else {
      const instant = value instanceof Date ? value : new Date(value);
      if (Number.isFinite(instant.getTime())) {
        dateKey = instant.toISOString().slice(0, 10);
      }
    }

    if (!dateKey) {
      throw new CalendarEventWriteError(
        "All-day event dates must include a calendar date.",
      );
    }

    const date = new Date(`${dateKey}T00:00:00.000Z`);
    if (
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== dateKey
    ) {
      throw new CalendarEventWriteError("A valid event date is required.");
    }
    return date;
  }

  const date =
    value instanceof Date
      ? new Date(value.getTime())
      : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new CalendarEventWriteError("A valid event date is required.");
  }
  return date;
}

export function normalizeCalendarEventWriteInput(
  value: unknown,
  partial = false,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new CalendarEventWriteError("Event data must be an object.");
  }

  const body = value as Record<string, unknown>;
  const normalized = { ...body };
  const includesAllDay = hasOwn(body, "allDay");

  if (!partial || includesAllDay) {
    normalized.allDay = parseAllDay(body.allDay);
  }

  const allDay = normalized.allDay === true;
  const includesStartDate = hasOwn(body, "startDate");
  if (!partial || includesStartDate) {
    normalized.startDate = parseEventDate(body.startDate, allDay);
  }

  const includesEndDate = hasOwn(body, "endDate");
  if (!partial || includesEndDate) {
    const endDate = body.endDate;
    normalized.endDate =
      endDate === undefined || endDate === null || endDate === ""
        ? null
        : parseEventDate(endDate, allDay);
  }

  return normalized;
}