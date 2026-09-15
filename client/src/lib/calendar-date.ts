/**
 * Calendar dates are user-facing local dates. Do not derive a calendar day
 * from Date#toISOString(), because local midnight can become the previous UTC
 * day.
 */
export function formatLocalCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the date shown to the user for a calendar value.
 *
 * All-day events intentionally keep their stored date-only portion. Timed
 * events are instants and are converted to the user's local calendar date.
 */
export function getCalendarEventDateKey(
  value: Date | string,
  allDay = false,
): string {
  if (typeof value === "string") {
    const dateOnly = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (allDay && dateOnly) return dateOnly[1];
  }

  const date = value instanceof Date ? value : new Date(value);
  return formatLocalCalendarDate(date);
}

/**
 * Converts the date and time selected in the local form into an explicit
 * instant for the API, without making the server guess the user's timezone.
 */
export function toCalendarDateTimeIso(date: string, time: string): string {
  const localDateTime = new Date(`${date}T${time}:00`);
  if (Number.isNaN(localDateTime.getTime())) {
    throw new Error("Invalid calendar date or time");
  }
  return localDateTime.toISOString();
}