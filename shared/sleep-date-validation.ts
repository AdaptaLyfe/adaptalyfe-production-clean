const SLEEP_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatDateParts(date: Date, timeZone?: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function getLocalDateString(date = new Date()): string {
  return formatDateParts(date);
}

export function getDateStringInTimeZone(date: Date, timeZone?: string): string {
  if (!timeZone) return getLocalDateString(date);

  try {
    return formatDateParts(date, timeZone);
  } catch {
    return getLocalDateString(date);
  }
}

export function isValidSleepDate(value: unknown): value is string {
  if (typeof value !== "string" || !SLEEP_DATE_PATTERN.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function getSleepDateValidationError(
  value: unknown,
  now = new Date(),
  timeZone?: string,
): string | null {
  if (!isValidSleepDate(value)) {
    return "Sleep date must be a valid date";
  }

  const today = getDateStringInTimeZone(now, timeZone);
  return value > today ? "Sleep date cannot be in the future" : null;
}