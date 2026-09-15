import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateSleepMetrics,
  calculateSleepStats,
} from "./sleep-calculations";

const session = (sleepDate: string, duration: number, score?: number) => ({
  id: Number(sleepDate.slice(-2)),
  sleepDate,
  bedtime: new Date(new Date(`${sleepDate}T22:00:00.000Z`).getTime() - 30 * 60_000),
  sleepTime: new Date(`${sleepDate}T22:00:00.000Z`),
  wakeTime: new Date(new Date(`${sleepDate}T22:00:00.000Z`).getTime() + duration * 60_000),
  totalSleepDuration: null,
  sleepEfficiency: null,
  sleepScore: score ?? null,
  quality: "good",
  expectedDuration: duration,
});

test("returns no stats when there is no sleep data", () => {
  assert.equal(calculateSleepStats([]), null);
});

test("calculates one overnight session from its saved times", () => {
  const metrics = calculateSleepMetrics(session("2026-01-01", 480));

  assert.equal(metrics.totalSleepDuration, 480);
  assert.equal(metrics.timeInBedDuration, 510);
  assert.equal(metrics.sleepEfficiency, 94.12);
  assert.equal(metrics.sleepScore, 100);
});

test("calculates daily, recent, overall, and goal metrics for 7+ days", () => {
  const sessions = [
    session("2026-01-08", 480, 90),
    session("2026-01-07", 420, 80),
    session("2026-01-06", 450, 85),
    session("2026-01-05", 390, 70),
    session("2026-01-04", 480, 95),
    session("2026-01-03", 450, 88),
    session("2026-01-02", 420, 82),
    session("2026-01-01", 360, 60),
  ];

  const stats = calculateSleepStats(sessions, 480, "2026-01-08");

  assert.ok(stats);
  assert.equal(stats.dailyDuration, 480);
  assert.equal(stats.dailyScore, 90);
  assert.equal(stats.avgSleepDuration, 441);
  assert.equal(stats.avgSleepScore, 81);
  assert.equal(stats.avgEfficiency, 93);
  assert.equal(stats.goalProgress, 92);
  assert.equal(stats.totalSessions, 7);
});

test("does not invent metrics for incomplete records", () => {
  const stats = calculateSleepStats([{
    sleepDate: "2026-01-08",
    bedtime: null,
    sleepTime: null,
    wakeTime: null,
    totalSleepDuration: null,
    sleepEfficiency: null,
    sleepScore: null,
  }], 480, "2026-01-08");

  assert.ok(stats);
  assert.equal(stats.dailyDuration, undefined);
  assert.equal(stats.dailyScore, undefined);
  assert.equal(stats.avgSleepDuration, undefined);
  assert.equal(stats.avgSleepScore, undefined);
  assert.equal(stats.avgEfficiency, undefined);
  assert.equal(stats.goalProgress, undefined);
  assert.equal(stats.totalSessions, 0);
});