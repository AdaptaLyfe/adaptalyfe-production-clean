type SleepTimeValue = string | Date | null | undefined;

interface ParsedSleepTime {
  timestamp?: number;
  minutes?: number;
}

function parseClockTime(value: string): number | undefined {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?\s*(AM|PM)?$/i);
  if (!match) return undefined;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (!Number.isInteger(minute) || minute > 59) return undefined;

  if (meridiem) {
    if (hour < 1 || hour > 12) return undefined;
    return ((hour % 12) + (meridiem === "PM" ? 12 : 0)) * 60 + minute;
  }

  if (hour > 23) return undefined;
  return hour * 60 + minute;
}

function parseSleepTime(value: SleepTimeValue): ParsedSleepTime | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? undefined
      : { timestamp: value.getTime() };
  }

  if (typeof value !== "string" || value.trim() === "") return undefined;

  const trimmed = value.trim();
  const minutes = parseClockTime(trimmed);
  if (minutes !== undefined) return { minutes };

  const timestamp = new Date(trimmed).getTime();
  return Number.isNaN(timestamp) ? undefined : { timestamp };
}

export function getSleepTimeValidationError(
  bedtime: SleepTimeValue,
  sleepTime: SleepTimeValue,
): string | null {
  if (bedtime === null || bedtime === undefined || bedtime === ""
    || sleepTime === null || sleepTime === undefined || sleepTime === "") {
    return null;
  }

  const parsedBedtime = parseSleepTime(bedtime);
  const parsedSleepTime = parseSleepTime(sleepTime);
  if (!parsedBedtime || !parsedSleepTime) {
    return "Bedtime and time fell asleep must be valid times";
  }

  const isEarlier = parsedBedtime.timestamp !== undefined && parsedSleepTime.timestamp !== undefined
    ? parsedSleepTime.timestamp < parsedBedtime.timestamp
    : parsedSleepTime.minutes! < parsedBedtime.minutes!;

  return isEarlier ? "Time fell asleep must be the same as or later than bedtime" : null;
}

export function getWakeTimeValidationError(
  sleepTime: SleepTimeValue,
  wakeTime: SleepTimeValue,
): string | null {
  if (sleepTime === null || sleepTime === undefined || sleepTime === ""
    || wakeTime === null || wakeTime === undefined || wakeTime === "") {
    return null;
  }

  const parsedSleepTime = parseSleepTime(sleepTime);
  const parsedWakeTime = parseSleepTime(wakeTime);
  if (!parsedSleepTime || !parsedWakeTime) {
    return "Time fell asleep and wake time must be valid times";
  }

  const isEarlier = parsedSleepTime.timestamp !== undefined && parsedWakeTime.timestamp !== undefined
    ? parsedWakeTime.timestamp < parsedSleepTime.timestamp
    : parsedWakeTime.minutes! < parsedSleepTime.minutes!;

  return isEarlier ? "Wake time must be the same as or later than time fell asleep" : null;
}

export function getSleepRoutineTimeValidationError(
  bedtime: SleepTimeValue,
  sleepTime: SleepTimeValue,
  wakeTime: SleepTimeValue,
): string | null {
  return getSleepTimeValidationError(bedtime, sleepTime)
    ?? getWakeTimeValidationError(sleepTime, wakeTime);
}