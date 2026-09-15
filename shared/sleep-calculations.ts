export const DEFAULT_SLEEP_GOAL_MINUTES = 480;

export interface SleepCalculationSession {
  id?: number;
  sleepDate?: string | null;
  bedtime?: string | Date | null;
  sleepTime?: string | Date | null;
  wakeTime?: string | Date | null;
  totalSleepDuration?: number | string | null;
  sleepEfficiency?: number | string | null;
  sleepScore?: number | string | null;
  quality?: string | null;
}

export interface SleepMetrics {
  totalSleepDuration?: number;
  timeInBedDuration?: number;
  sleepEfficiency?: number;
  sleepScore?: number;
}

export interface SleepStats extends SleepMetrics {
  dailyDuration?: number;
  dailyScore?: number;
  avgSleepDuration?: number;
  avgSleepScore?: number;
  avgEfficiency?: number;
  goalProgress?: number;
  totalSessions: number;
}

const MINUTES_PER_DAY = 24 * 60;

function asFiniteNumber(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function asDate(value: string | Date | null | undefined): Date | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function minutesBetween(start: string | Date | null | undefined, end: string | Date | null | undefined): number | undefined {
  const startDate = asDate(start);
  const endDate = asDate(end);
  if (!startDate || !endDate) return undefined;

  let difference = (endDate.getTime() - startDate.getTime()) / 60_000;
  if (difference <= 0) difference += MINUTES_PER_DAY;
  return Math.round(difference);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function dayNumber(value: string | null | undefined): number | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? undefined : date.getTime() / 86_400_000;
}

function round(value: number): number {
  return Math.round(value);
}

export function calculateSleepMetrics(
  session: SleepCalculationSession,
  targetSleepDuration = DEFAULT_SLEEP_GOAL_MINUTES,
): SleepMetrics {
  const calculatedDuration = minutesBetween(session.sleepTime, session.wakeTime);
  const storedDuration = asFiniteNumber(session.totalSleepDuration);
  const totalSleepDuration = calculatedDuration ?? (
    storedDuration !== undefined && storedDuration > 0 ? round(storedDuration) : undefined
  );

  const timeInBedDuration = minutesBetween(session.bedtime, session.wakeTime);
  const storedEfficiency = asFiniteNumber(session.sleepEfficiency);
  const sleepEfficiency = timeInBedDuration && totalSleepDuration !== undefined
    ? round(clamp((totalSleepDuration / timeInBedDuration) * 100, 0, 100) * 100) / 100
    : storedEfficiency !== undefined ? round(clamp(storedEfficiency, 0, 100) * 100) / 100 : undefined;

  const storedScore = asFiniteNumber(session.sleepScore);
  const sleepScore = storedScore !== undefined
    ? round(clamp(storedScore, 0, 100))
    : totalSleepDuration !== undefined && targetSleepDuration > 0
      ? round(clamp((totalSleepDuration / targetSleepDuration) * 100, 0, 100))
      : undefined;

  return {
    totalSleepDuration,
    timeInBedDuration,
    sleepEfficiency,
    sleepScore,
  };
}

export function calculateSleepStats(
  sessions: readonly SleepCalculationSession[],
  targetSleepDuration = DEFAULT_SLEEP_GOAL_MINUTES,
  referenceDate?: string,
): SleepStats | null {
  if (sessions.length === 0) return null;

  const anchor = referenceDate ?? sessions
    .map((session) => session.sleepDate)
    .filter((date): date is string => dayNumber(date) !== undefined)
    .sort()
    .at(-1);
  if (!anchor || dayNumber(anchor) === undefined) return null;

  const anchorDay = dayNumber(anchor)!;
  const metrics = sessions.map((session) => ({
    session,
    metrics: calculateSleepMetrics(session, targetSleepDuration),
  }));
  const recent = metrics.filter(({ session }) => {
    const date = dayNumber(session.sleepDate);
    return date !== undefined && date >= anchorDay - 6 && date <= anchorDay;
  });
  const selected = metrics.find(({ session }) => session.sleepDate === anchor)?.metrics;

  const durations = recent
    .map(({ metrics }) => metrics.totalSleepDuration)
    .filter((value): value is number => value !== undefined);
  const scores = metrics
    .map(({ metrics }) => metrics.sleepScore)
    .filter((value): value is number => value !== undefined);
  const efficiencies = metrics
    .map(({ metrics }) => metrics.sleepEfficiency)
    .filter((value): value is number => value !== undefined);

  const average = (values: number[]): number | undefined =>
    values.length > 0 ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : undefined;

  const avgSleepDuration = average(durations);
  const avgSleepScore = average(scores);
  const avgEfficiency = average(efficiencies);

  return {
    dailyDuration: selected?.totalSleepDuration,
    dailyScore: selected?.sleepScore,
    avgSleepDuration,
    avgSleepScore,
    avgEfficiency,
    totalSleepDuration: avgSleepDuration,
    sleepScore: avgSleepScore,
    sleepEfficiency: avgEfficiency,
    goalProgress: avgSleepDuration === undefined || targetSleepDuration <= 0
      ? undefined
      : round(clamp((avgSleepDuration / targetSleepDuration) * 100, 0, 100)),
    totalSessions: durations.length,
  };
}