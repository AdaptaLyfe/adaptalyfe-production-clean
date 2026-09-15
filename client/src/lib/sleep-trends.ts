export interface SleepTrendSession {
  id: number;
  sleepDate: string;
}

/**
 * The sleep API returns sessions newest-first. Trends need the complete
 * response in oldest-first order, without changing the query cache array.
 */
export function sortSleepSessionsChronologically<T extends SleepTrendSession>(
  sessions: readonly T[],
): T[] {
  return [...sessions].sort((a, b) => {
    const dateOrder = a.sleepDate.localeCompare(b.sleepDate);
    return dateOrder || a.id - b.id;
  });
}

/**
 * Returns the most recently dated sessions first without mutating the query
 * cache. The id provides a stable logged-order tie breaker for the same date.
 */
export function getRecentSleepSessions<T extends SleepTrendSession>(
  sessions: readonly T[],
  limit = 7,
): T[] {
  if (limit <= 0) return [];
  return sortSleepSessionsChronologically(sessions).slice(-limit).reverse();
}