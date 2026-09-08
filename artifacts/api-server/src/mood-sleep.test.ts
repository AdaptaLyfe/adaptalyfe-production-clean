import assert from "node:assert/strict";
import test from "node:test";
import type { AdaptAIContext, AiMood, AiSleep, AiTask } from "./ai-context.js";
import { buildTodayBriefing } from "./today-briefing.js";
import {
  buildMoodSleepContextNote,
  buildMoodSleepResponse,
  isMoodSleepRequest,
} from "./mood-sleep.js";

const task = (overrides: Partial<AiTask>): AiTask => ({
  title: "Task",
  category: "general",
  isCompleted: false,
  frequency: "once",
  estimatedMinutes: 10,
  ...overrides,
});

const baseContext = (overrides: Partial<AdaptAIContext> = {}): AdaptAIContext => ({
  identity: { displayName: "Alex" },
  today: { date: "2026-09-04", time: "08:30", timezone: "Asia/Calcutta" },
  ...overrides,
});

test("recognizes explicit mood and sleep questions", () => {
  assert.equal(isMoodSleepRequest("How was my sleep?"), true);
  assert.equal(isMoodSleepRequest("How am I feeling lately?"), true);
  assert.equal(isMoodSleepRequest("What should I do today?"), false);
});

test("handles missing mood and sleep data without inventing records", () => {
  const sleepResponse = buildMoodSleepResponse("How was my sleep?", baseContext());
  const moodResponse = buildMoodSleepResponse("How am I feeling?", baseContext());

  assert.equal(sleepResponse, "I don't have a recent sleep record to share.");
  assert.equal(moodResponse, "I don't have a recent mood entry to share.");
});

test("uses recent poor sleep and a busy morning to focus the plan", () => {
  const context = baseContext({
    tasks: {
      today: [
        task({ title: "Pack bag", scheduledTime: "08:45" }),
        task({ title: "Leave home", scheduledTime: "10:00" }),
      ],
      incomplete: [
        task({ title: "Pack bag", scheduledTime: "08:45" }),
        task({ title: "Leave home", scheduledTime: "10:00" }),
      ],
      completed: [],
    },
    sleep: [
      {
        date: "2026-09-03",
        totalSleepDurationMinutes: 300,
        sleepScore: 55,
        quality: "poor",
      },
      {
        date: "2026-09-02",
        totalSleepDurationMinutes: 480,
        sleepScore: 82,
        quality: "good",
      },
    ],
  });

  const note = buildMoodSleepContextNote(context);
  assert.ok(note);
  assert.match(note, /sleep was lower than your recent average yesterday/i);
  assert.match(note, /busy morning/i);
  assert.match(note, /focus on the next step first/i);
  assert.doesNotMatch(note, /because|diagnos|condition|caused/i);
});

test("enriches a relevant Today Briefing without surfacing mood or sleep elsewhere", () => {
  const context = baseContext({
    tasks: {
      today: [task({ title: "Pack bag", scheduledTime: "09:00" })],
      incomplete: [task({ title: "Pack bag", scheduledTime: "09:00" })],
      completed: [],
    },
    sleep: [
      {
        date: "2026-09-03",
        totalSleepDurationMinutes: 300,
        quality: "poor",
      },
    ],
  });

  const briefing = buildTodayBriefing(context);
  assert.match(briefing, /most recent sleep was recorded as poor/i);
  assert.match(briefing, /Pack bag/);
});

test("reports a recent low mood as a recorded rating only", () => {
  const response = buildMoodSleepResponse(
    "How am I feeling?",
    baseContext({
      mood: [{ mood: 2, date: "2026-09-03" }],
    })
  );

  assert.match(response, /mood was 2\/5 yesterday/i);
  assert.doesNotMatch(response, /depress|anxious|diagnos|caused|because/i);

  const note = buildMoodSleepContextNote(
    baseContext({
      mood: [{ mood: 2, date: "2026-09-03" }],
    })
  );
  assert.match(note ?? "", /logged a mood rating of 2\/5 yesterday/i);
  assert.match(note ?? "", /keep today's plan simple/i);
});

test("summarizes multiple recent mood and sleep entries when requested", () => {
  const moods: AiMood[] = [
    { mood: 3, date: "2026-09-03" },
    { mood: 4, date: "2026-09-02" },
    { mood: 2, date: "2026-09-01" },
  ];
  const sleep: AiSleep[] = [
    { date: "2026-09-03", totalSleepDurationMinutes: 420, sleepScore: 70, quality: "fair" },
    { date: "2026-09-02", totalSleepDurationMinutes: 480, sleepScore: 85, quality: "good" },
  ];

  const response = buildMoodSleepResponse(
    "How was my mood and sleep?",
    baseContext({ mood: moods, sleep })
  );

  assert.match(response, /3 recent mood entries/i);
  assert.match(response, /3\/5 yesterday/);
  assert.match(response, /2 recent sleep records/i);
  assert.match(response, /7 hours, score 70\/100, quality recorded as fair/i);
});

test("does not surface old mood or sleep entries as recent", () => {
  const response = buildMoodSleepResponse(
    "How was my mood and sleep?",
    baseContext({
      mood: [{ mood: 1, date: "2026-08-20" }],
      sleep: [{ date: "2026-08-20", totalSleepDurationMinutes: 120, quality: "poor" }],
    })
  );

  assert.equal(
    response,
    "I don't have a recent mood entry to share. I don't have a recent sleep record to share."
  );
});