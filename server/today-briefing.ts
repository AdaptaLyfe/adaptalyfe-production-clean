import type { AdaptAIContext, AiAppointment, AiTask } from "./ai-context.js";
import { buildMealsGroceryContextNote } from "./meals-grocery.js";
import { buildMoodSleepContextNote } from "./mood-sleep.js";

const MAX_BRIEFING_ITEMS = 12;

type BriefingItem = {
  title: string;
  timeMinutes?: number;
  timeLabel?: string;
  sortPriority: number;
};

/**
 * Recognize the small set of natural-language requests that mean "show me
 * today's personalized plan." Keep this intentionally narrow so questions
 * such as "what happened today?" still use the normal chat flow.
 */
export function isTodayBriefingRequest(message: string): boolean {
  const normalized = message.toLowerCase().replace(/[?!.,]/g, " ").replace(/\s+/g, " ").trim();

  return [
    /\bwhat do i need to do today\b/,
    /\bwhat(?:'s| is) on my schedule today\b/,
    /\bwhat do i have today\b/,
    /\bwhat should i do today\b/,
    /\bwhat(?:'s| is) important today\b/,
    /\bplan my day\b/,
    /\btoday(?:'s| is) (?:briefing|plan|schedule)\b/,
  ].some((pattern) => pattern.test(normalized));
}

function greetingForTime(time: string): string {
  const hour = Number.parseInt(time.slice(0, 2), 10);
  if (Number.isFinite(hour) && hour >= 5 && hour < 12) return "Good morning";
  if (Number.isFinite(hour) && hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatTime(time?: string): string | undefined {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return undefined;
  const [hours, minutes] = time.split(":").map(Number);
  if (hours > 23 || minutes > 59) return undefined;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function timeMinutes(time?: string): number | undefined {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return undefined;
  const [hours, minutes] = time.split(":").map(Number);
  if (hours > 23 || minutes > 59) return undefined;
  return hours * 60 + minutes;
}

function appointmentTime(appointment: AiAppointment): string | undefined {
  const match = appointment.appointmentDate.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : undefined;
}

function taskItem(task: AiTask): BriefingItem {
  return {
    title: task.title,
    timeMinutes: timeMinutes(task.scheduledTime),
    timeLabel: formatTime(task.scheduledTime),
    sortPriority: 30,
  };
}

function appointmentItem(appointment: AiAppointment): BriefingItem {
  const time = appointmentTime(appointment);
  return {
    title: appointment.title,
    timeMinutes: timeMinutes(time),
    timeLabel: formatTime(time),
    sortPriority: 10,
  };
}

function sortBriefingItems(items: BriefingItem[]): BriefingItem[] {
  return items
    .sort((a, b) => {
      const aHasTime = a.timeMinutes !== undefined;
      const bHasTime = b.timeMinutes !== undefined;
      if (aHasTime !== bHasTime) return aHasTime ? -1 : 1;
      if (aHasTime && bHasTime && a.timeMinutes !== b.timeMinutes) {
        return a.timeMinutes - b.timeMinutes;
      }
      return a.sortPriority - b.sortPriority;
    })
    .slice(0, MAX_BRIEFING_ITEMS);
}

function formatCompletedProgress(context: AdaptAIContext): string | undefined {
  const completed = context.tasks?.completed ?? [];
  if (completed.length === 0) return undefined;

  const titles = completed.slice(0, 3).map((task) => task.title).join(", ");
  const suffix = completed.length > 3 ? ` and ${completed.length - 3} more` : "";
  return `You’ve already completed ${completed.length === 1 ? "a task" : `${completed.length} tasks`}: ${titles}${suffix}.`;
}

function emptyDayNextAction(context: AdaptAIContext): string {
  const firstGoal = context.goals?.find((goal) => !goal.isCompleted);
  if (firstGoal) return `You could make a little progress on your goal: ${firstGoal.title}.`;

  const firstShoppingItem = context.shopping?.[0];
  if (firstShoppingItem) return `A useful next step could be reviewing your shopping list, starting with ${firstShoppingItem.itemName}.`;

  return "A useful next step could be adding one small task for today when you’re ready.";
}

/**
 * Render a concise, truthful daily briefing from the existing Context Engine.
 * No database access or model call happens here, so ordering and omissions are
 * deterministic and cannot introduce events that are not in the context.
 */
export function buildTodayBriefing(context: AdaptAIContext): string {
  const items: BriefingItem[] = [];

  for (const task of context.tasks?.incomplete ?? []) {
    items.push(taskItem(task));
  }

  for (const appointment of context.appointments?.today ?? []) {
    items.push(appointmentItem(appointment));
  }

  for (const medication of context.medications?.scheduledToday ?? []) {
    const dosage = medication.dosage ? ` (${medication.dosage})` : "";
    items.push({
      title: `Take medication: ${medication.medicationName}${dosage}`,
      sortPriority: 20,
    });
  }

  for (const goal of context.goals ?? []) {
    if (goal.isCompleted || (!goal.isDueToday && goal.priority.toLowerCase() !== "high")) {
      continue;
    }
    items.push({
      title: `Goal: ${goal.title}`,
      sortPriority: 40,
    });
  }

  for (const bill of context.finance?.due ?? []) {
    items.push({
      title: `Bill due: ${bill.name}`,
      sortPriority: 50,
    });
  }

  for (const meal of context.meals ?? []) {
    if (meal.isCompleted) continue;
    items.push({
      title: `${meal.mealType}: ${meal.mealName}`,
      sortPriority: 60,
    });
  }

  const sortedItems = sortBriefingItems(items);
  const greeting = `${greetingForTime(context.today.time)}, ${context.identity.displayName}.`;
  const wellbeingNote = buildMoodSleepContextNote(context);
  const mealsGroceryNote = buildMealsGroceryContextNote(context);

  if (sortedItems.length === 0) {
    const progress = formatCompletedProgress(context);
    return [
      greeting,
      ...(wellbeingNote ? ["", wellbeingNote] : []),
      ...(mealsGroceryNote ? ["", mealsGroceryNote] : []),
      "",
      "You don’t have anything else planned today.",
      ...(progress ? [progress] : []),
      emptyDayNextAction(context),
      "",
      "Want me to help you plan your day?",
    ].join("\n");
  }

  const itemCount = sortedItems.length;
  const lines = sortedItems.map((item) => {
    const timeLabel = item.timeLabel ?? "Anytime";
    return `✓ ${timeLabel} — ${item.title}`;
  });

  return [
    greeting,
    ...(wellbeingNote ? ["", wellbeingNote] : []),
    ...(mealsGroceryNote ? ["", mealsGroceryNote] : []),
    "",
    `You have ${itemCount} ${itemCount === 1 ? "thing" : "things"} planned today:`,
    "",
    ...lines,
    "",
    "Want me to help you plan your day?",
  ].join("\n");
}