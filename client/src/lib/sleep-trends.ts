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