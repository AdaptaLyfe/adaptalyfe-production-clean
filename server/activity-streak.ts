const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

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

export function normalizeActivityDate(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : calendarDateFromUtc(value);
  }

  if (typeof value !== "string") return null;
  const dateOnly = value.slice(0, 10);
  return parseCalendarDate(dateOnly) ? dateOnly : null;
}

export function normalizedActivityDates(
  values: Iterable<unknown>,
  today: string,
): string[] {
  const todayDate = parseCalendarDate(today);
  if (!todayDate) return [];

  return [...new Set(
    [...values]
      .map(normalizeActivityDate)
      .filter((value): value is string => value !== null)
      .filter((value) => value <= today),
  )].sort();
}

export function calculateCurrentStreak(
  completionDates: Iterable<unknown>,
  today: string,
): number {
  const dates = new Set(normalizedActivityDates(completionDates, today));
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