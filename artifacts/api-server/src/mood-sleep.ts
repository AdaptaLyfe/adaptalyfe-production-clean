import type { AdaptAIContext, AiMood, AiSleep } from "./ai-context.js";

const RECENT_DAYS = 7;

function normalize(message: string): string {
  return message.toLowerCase().replace(/[?!.,]/g, " ").replace(/\s+/g, " ").trim();
}

function dayDifference(from: string, to: string): number | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return undefined;
  }
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);
  const fromUtc = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const toUtc = Date.UTC(toYear, toMonth - 1, toDay);
  const difference = Math.round((toUtc - fromUtc) / 86_400_000);
  return Number.isFinite(difference) ? difference : undefined;
}

function recentMoodEntries(context: AdaptAIContext): AiMood[] {
  return (context.mood ?? [])
    .filter((entry) => {
      const age = dayDifference(entry.date, context.today.date);
      return age !== undefined && age >= 0 && age <= RECENT_DAYS;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function recentSleepEntries(context: AdaptAIContext): AiSleep[] {
  return (context.sleep ?? [])
    .filter((entry) => {
      const age = dayDifference(entry.date, context.today.date);
      return age !== undefined && age >= 0 && age <= RECENT_DAYS;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function dateReference(date: string, today: string): string {
  const age = dayDifference(date, today);
  if (age === 0) return "today";
  if (age === 1) return "yesterday";
  if (age !== undefined && age > 1 && age <= RECENT_DAYS) return `${age} days ago`;
  return `on ${date}`;
}

function formatDuration(minutes?: number): string | undefined {
  if (minutes === undefined || !Number.isFinite(minutes) || minutes < 0) return undefined;
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const remainingMinutes = rounded % 60;
  if (hours === 0) return `${remainingMinutes} minutes`;
  if (remainingMinutes === 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${hours} hour${hours === 1 ? "" : "s"} ${remainingMinutes} minutes`;
}

function isLowMood(entry: AiMood | undefined): boolean {
  return entry !== undefined && Number.isFinite(entry.mood) && entry.mood <= 2;
}

function isPoorSleep(entry: AiSleep | undefined): boolean {
  if (!entry) return false;
  return (
    entry.quality?.trim().toLowerCase() === "poor" ||
    (entry.sleepScore !== undefined && Number.isFinite(entry.sleepScore) && entry.sleepScore < 60)
  );
}

function sleepIsLowerThanRecentAverage(latest: AiSleep, previous: AiSleep[]): boolean {
  const previousDurations = previous
    .map((entry) => entry.totalSleepDurationMinutes)
    .filter((duration): duration is number => duration !== undefined && Number.isFinite(duration));
  if (
    latest.totalSleepDurationMinutes !== undefined &&
    previousDurations.length > 0
  ) {
    const average = previousDurations.reduce((sum, duration) => sum + duration, 0) / previousDurations.length;
    return latest.totalSleepDurationMinutes < average * 0.8;
  }

  const previousScores = previous
    .map((entry) => entry.sleepScore)
    .filter((score): score is number => score !== undefined && Number.isFinite(score));
  if (latest.sleepScore !== undefined && previousScores.length > 0) {
    const average = previousScores.reduce((sum, score) => sum + score, 0) / previousScores.length;
    return latest.sleepScore < average - 10;
  }
  return false;
}

function isBusyMorning(context: AdaptAIContext): boolean {
  const morningTasks = (context.tasks?.incomplete ?? []).filter((task) => {
    if (!task.scheduledTime || !/^\d{2}:\d{2}$/.test(task.scheduledTime)) return false;
    return Number(task.scheduledTime.slice(0, 2)) < 12;
  }).length;
  const morningAppointments = (context.appointments?.today ?? []).filter((appointment) => {
    const match = appointment.appointmentDate.match(/T(\d{2}):\d{2}/);
    return match ? Number(match[1]) < 12 : false;
  }).length;
  return morningTasks + morningAppointments >= 2;
}

function moodEntrySummary(entries: AiMood[], today: string): string {
  const latest = entries[0];
  const details = entries
    .slice(0, 3)
    .map((entry) => `${entry.mood}/5 ${dateReference(entry.date, today)}`)
    .join(", ");
  return entries.length === 1
    ? `Your latest recorded mood was ${details}.`
    : `You have ${entries.length} recent mood entries. They include ${details}.`;
}

function sleepEntrySummary(entries: AiSleep[], today: string): string {
  const latest = entries[0];
  const latestDetails = [
    formatDuration(latest.totalSleepDurationMinutes),
    latest.sleepScore !== undefined ? `score ${latest.sleepScore}/100` : undefined,
    latest.quality ? `quality recorded as ${latest.quality}` : undefined,
  ].filter(Boolean).join(", ");
  const latestSentence = latestDetails
    ? `Your latest recorded sleep was ${latestDetails} (${dateReference(latest.date, today)}).`
    : `You have a sleep record from ${dateReference(latest.date, today)}.`;

  if (entries.length === 1) return latestSentence;
  return `${latestSentence} There are ${entries.length} recent sleep records available for comparison.`;
}

/**
 * Explicitly recognized mood/sleep questions. Broader mentions such as
 * "I'm tired" can still opt into context, but remain on the normal AI path.
 */
export function isMoodSleepRequest(message: string): boolean {
  const normalized = normalize(message);
  return [
    /\b(?:how did i sleep|how was my sleep|sleep data|sleep score|sleep quality|show me my sleep)\b/,
    /\b(?:my mood|mood entries|mood data|how am i feeling|how do i feel|feeling lately)\b/,
  ].some((pattern) => pattern.test(normalized));
}

export function shouldIncludeMoodSleepContext(message: string): boolean {
  const normalized = normalize(message);
  return (
    isMoodSleepRequest(message) ||
    /\b(?:sleep|slept|sleeping|rested|rest|mood|feeling|felt|tired|overwhelmed)\b/.test(normalized)
  );
}

export function buildMoodSleepResponse(message: string, context: AdaptAIContext): string {
  const normalized = normalize(message);
  const asksSleep = /\b(?:sleep|slept|sleeping|rested|rest)\b/.test(normalized);
  const asksMood = /\b(?:mood|feeling|feel)\b/.test(normalized);
  const mood = asksMood ? recentMoodEntries(context) : [];
  const sleep = asksSleep ? recentSleepEntries(context) : [];
  const parts: string[] = [];

  if (asksMood) {
    parts.push(
      mood.length > 0
        ? moodEntrySummary(mood, context.today.date)
        : "I don't have a recent mood entry to share."
    );
  }
  if (asksSleep) {
    parts.push(
      sleep.length > 0
        ? sleepEntrySummary(sleep, context.today.date)
        : "I don't have a recent sleep record to share."
    );
  }

  return parts.length > 0
    ? parts.join(" ")
    : "I can look at your recent mood or sleep records when you ask about them directly.";
}

/**
 * Add a small wellbeing cue only to a relevant daily-plan response. It never
 * exposes mood/sleep data in unrelated responses and does not infer causation.
 */
export function buildMoodSleepContextNote(context: AdaptAIContext): string | undefined {
  const mood = recentMoodEntries(context);
  const sleep = recentSleepEntries(context);
  const latestMood = mood[0];
  const latestSleep = sleep[0];
  const notes: string[] = [];

  if (isPoorSleep(latestSleep)) {
    const lowerThanUsual =
      latestSleep !== undefined &&
      sleepIsLowerThanRecentAverage(latestSleep, sleep.slice(1));
    notes.push(
      lowerThanUsual
        ? `Your sleep was lower than your recent average ${dateReference(latestSleep.date, context.today.date)}.`
        : `Your most recent sleep was recorded as ${latestSleep?.quality?.toLowerCase() === "poor" ? "poor" : "below 60/100"}.`
    );
    notes.push(
      isBusyMorning(context)
        ? "You have a busy morning, so let's focus on the next step first."
        : "Let's keep today's next step manageable."
    );
  }

  if (isLowMood(latestMood)) {
    notes.push(
      `I see you logged a mood rating of ${latestMood?.mood}/5 ${dateReference(latestMood?.date ?? context.today.date, context.today.date)}. We can keep today's plan simple.`
    );
  }

  return notes.length > 0 ? notes.join(" ") : undefined;
}