const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export type ActivityTimeZone = string | number;

export function calendarDateWithOffset(
  date: Date,
  offsetMinutes: number,
): string | null {
  if (
    Number.isNaN(date.getTime()) ||
    !Number.isInteger(offsetMinutes) ||
    Math.abs(offsetMinutes) > 14 * 60
  ) {
    return null;
  }

  return new Date(date.getTime() + offsetMinutes * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export function shouldIncludeLegacyTaskActivity(
  completionTableAvailable: boolean,
  frequency: string,
  hasDateScopedCompletion: boolean,
): boolean {
  return (
    !completionTableAvailable ||
    frequency !== "daily" ||
    !hasDateScopedCompletion
  );
}

export function completedMealActivityDates(
  meals: Iterable<{
    isCompleted: boolean | null;
    plannedDate: unknown;
  }>,
): unknown[] {
  return [...meals]
    .filter((meal) => meal.isCompleted && meal.plannedDate != null)
    .map((meal) => meal.plannedDate);
}

function parseCalendarDate(value: string): Date | null {
  if (!CALENDAR_DATE_PATTERN.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== value
    ? null
    : parsed;
}

function calendarDateFromUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function calendarDateForInstant(
  date: Date,
  timeZone?: ActivityTimeZone,
): string {
  if (typeof timeZone === "number") {
    return calendarDateWithOffset(date, timeZone) ?? calendarDateFromUtc(date);
  }

  if (typeof timeZone === "string" && timeZone.trim() !== "") {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(date);
      const values = Object.fromEntries(
        parts
          .filter((part) => part.type !== "literal")
          .map((part) => [part.type, part.value]),
      );
      const localDate = `${values.year}-${values.month}-${values.day}`;
      if (parseCalendarDate(localDate)) return localDate;
    } catch {
      // Invalid timezone identifiers fall back to the existing UTC behavior.
    }
  }

  return calendarDateFromUtc(date);
}

export function normalizeActivityDate(
  value: unknown,
  timeZone?: ActivityTimeZone,
): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : calendarDateForInstant(value, timeZone);
  }

  if (typeof value !== "string") return null;
  if (CALENDAR_DATE_PATTERN.test(value)) {
    return parseCalendarDate(value) ? value : null;
  }

  const timestamp = new Date(value);
  if (!Number.isNaN(timestamp.getTime())) {
    return calendarDateForInstant(timestamp, timeZone);
  }

  const dateOnly = value.slice(0, 10);
  return parseCalendarDate(dateOnly) ? dateOnly : null;
}

export function normalizedActivityDates(
  values: Iterable<unknown>,
  today: string,
  timeZone?: ActivityTimeZone,
): string[] {
  const todayDate = parseCalendarDate(today);
  if (!todayDate) return [];

  return [...new Set(
    [...values]
      .map((value) => normalizeActivityDate(value, timeZone))
      .filter((value): value is string => value !== null)
      .filter((value) => value <= today),
  )].sort();
}

export function calculateCurrentStreak(
  completionDates: Iterable<unknown>,
  today: string,
  timeZone?: ActivityTimeZone,
): number {
  const dates = new Set(
    normalizedActivityDates(completionDates, today, timeZone),
  );
  const todayDate = parseCalendarDate(today);
  if (!todayDate) return 0;

  let streak = 0;
  let cursor = todayDate;
  while (dates.has(calendarDateFromUtc(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_IN_MILLISECONDS);
  }
  return streak;
}