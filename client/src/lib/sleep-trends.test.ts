import test from 'node:test';
import assert from 'node:assert/strict';

import { sortSleepSessionsChronologically } from './sleep-trends';

function makeSessions(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    sleepDate: `2026-01-${String(index + 1).padStart(2, '0')}`,
  })).reverse();
}

for (const count of [7, 15, 31]) {
  test(`sorts all ${count} sleep sessions oldest to newest`, () => {
    const sessions = makeSessions(count);
    const sorted = sortSleepSessionsChronologically(sessions);

    assert.equal(sorted.length, count);
    assert.deepEqual(
      sorted.map((session) => session.sleepDate),
      makeSessions(count).reverse().map((session) => session.sleepDate),
    );
    assert.deepEqual(
      sessions.map((session) => session.sleepDate),
      makeSessions(count).map((session) => session.sleepDate),
    );
  });
}