import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getRecentSleepSessions,
  sortSleepSessionsChronologically,
} from './sleep-trends';

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

test('returns the latest seven sessions newest first', () => {
  const sessions = makeSessions(15);
  const recent = getRecentSleepSessions(sessions);

  assert.equal(recent.length, 7);
  assert.deepEqual(
    recent.map((session) => session.sleepDate),
    [
      '2026-01-15',
      '2026-01-14',
      '2026-01-13',
      '2026-01-12',
      '2026-01-11',
      '2026-01-10',
      '2026-01-09',
    ],
  );
});

test('returns every session when fewer than seven exist', () => {
  const sessions = makeSessions(3);
  const recent = getRecentSleepSessions(sessions);

  assert.deepEqual(
    recent.map((session) => session.sleepDate),
    ['2026-01-03', '2026-01-02', '2026-01-01'],
  );
});

test('puts the newest logged session first when sessions share a date', () => {
  const recent = getRecentSleepSessions([
    { id: 12, sleepDate: '2026-01-10' },
    { id: 13, sleepDate: '2026-01-10' },
    { id: 11, sleepDate: '2026-01-09' },
  ]);

  assert.equal(recent[0].id, 13);
  assert.deepEqual(
    recent.map((session) => session.id),
    [13, 12, 11],
  );
});