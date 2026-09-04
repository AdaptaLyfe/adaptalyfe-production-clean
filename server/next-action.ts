import type {
  AdaptAIContext,
  AiAppointment,
  AiGoal,
  AiTask,
} from "./ai-context.js";

type NextActionCandidate = {
  title: string;
  timeMinutes?: number;
  timeLabel?: string;
  priority: number;
  kind: "task" | "appointment" | "medication" | "goal" | "bill";
  detail?: string;
};

/**
 * Recognize requests for one actionable next step. This is deliberately
 * separate from the broader Today Briefing intent so the response can stay
 * short and focused.
 */
export function isNextActionRequest(message: string): boolean {
  const normalized = message.toLowerCase().replace(/[?!.,]/g, " ").replace(/\s+/g, " ").trim();

  return [
    /\bwhat(?:'s| is) next\b/,
    /\bwhat should i do now\b/,
    /\bwhat should i do first\b/,
    /\bwhat do i need to do next\b/,
    /\bhelp me get started\b/,
  ].some((pattern) => pattern.test(normalized));
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

function appointmentDate(appointment: AiAppointment): string | undefined {
  const match = appointment.appointmentDate.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1];
}

function taskCandidate(task: AiTask, context: AdaptAIContext): NextActionCandidate {
  const scheduledMinutes = timeMinutes(task.scheduledTime);
  const currentMinutes = timeMinutes(context.today.time);
  const isPastDueDate = Boolean(task.dueDate && task.dueDate < context.today.date);
  const scheduledTimePassed =
    scheduledMinutes !== undefined &&
    currentMinutes !== undefined &&
    scheduledMinutes < currentMinutes;
  const isRoutine =
    task.category.toLowerCase().includes("routine") ||
    task.frequency.toLowerCase() === "daily";

  return {
    title: task.title,
    timeMinutes: scheduledMinutes,
    timeLabel: formatTime(task.scheduledTime),
    priority: isPastDueDate || scheduledTimePassed ? 10 : isRoutine ? 50 : 70,
    kind: "task",
    detail: isPastDueDate || scheduledTimePassed ? "overdue" : undefined,
  };
}

function appointmentCandidate(
  appointment: AiAppointment,
  context: AdaptAIContext
): NextActionCandidate {
  const time = appointmentTime(appointment);
  const minutes = timeMinutes(time);
  const date = appointmentDate(appointment);
  const isToday = date === context.today.date;

  return {
    title: appointment.title,
    timeMinutes: minutes,
    timeLabel: formatTime(time),
    priority: 20,
    kind: "appointment",
    detail: date && !isToday ? `on ${date}` : undefined,
  };
}

function goalCandidate(goal: AiGoal): NextActionCandidate {
  return {
    title: `Work on your goal: ${goal.title}`,
    priority: goal.isDueToday || goal.priority.toLowerCase() === "high" ? 60 : 70,
    kind: "goal",
  };
}

function compareCandidates(a: NextActionCandidate, b: NextActionCandidate): number {
  if (a.priority !== b.priority) return a.priority - b.priority;
  const aHasTime = a.timeMinutes !== undefined;
  const bHasTime = b.timeMinutes !== undefined;
  if (aHasTime !== bHasTime) return aHasTime ? -1 : 1;
  if (aHasTime && bHasTime && a.timeMinutes !== b.timeMinutes) {
    return a.timeMinutes - b.timeMinutes;
  }
  return 0;
}

function describeCandidate(candidate: NextActionCandidate): string {
  if (candidate.kind === "appointment") {
    const dateDetail = candidate.detail ? ` ${candidate.detail}` : "";
    const timeDetail = candidate.timeLabel ? ` at ${candidate.timeLabel}` : "";
    return `your ${candidate.title}${dateDetail}${timeDetail}`;
  }

  if (candidate.kind === "medication") {
    const timeDetail = candidate.timeLabel ? ` at ${candidate.timeLabel}` : "";
    return `${candidate.title}${timeDetail}`;
  }

  if (candidate.kind === "bill") {
    return candidate.title;
  }

  const timeDetail = candidate.timeLabel ? ` at ${candidate.timeLabel}` : "";
  return `${candidate.title}${timeDetail}`;
}

function buildCandidates(context: AdaptAIContext): NextActionCandidate[] {
  const candidates: NextActionCandidate[] = [];

  for (const task of context.tasks?.incomplete ?? []) {
    candidates.push(taskCandidate(task, context));
  }

  const appointments = [
    ...(context.appointments?.today ?? []),
    ...(context.appointments?.upcoming ? [context.appointments.upcoming] : []),
  ];
  const seenAppointments = new Set<string>();
  for (const appointment of appointments) {
    const key = `${appointment.title}|${appointment.appointmentDate}`;
    if (seenAppointments.has(key)) continue;
    seenAppointments.add(key);
    const candidate = appointmentCandidate(appointment, context);
    const isToday = appointmentDate(appointment) === context.today.date;
    const currentMinutes = timeMinutes(context.today.time);
    const hasPassed =
      isToday &&
      candidate.timeMinutes !== undefined &&
      currentMinutes !== undefined &&
      candidate.timeMinutes < currentMinutes;
    if (!hasPassed) candidates.push(candidate);
  }

  for (const medication of context.medications?.scheduledToday ?? []) {
    const dosage = medication.dosage ? ` (${medication.dosage})` : "";
    candidates.push({
      title: `Take medication: ${medication.medicationName}${dosage}`,
      priority: 30,
      kind: "medication",
    });
  }

  for (const goal of context.goals ?? []) {
    if (!goal.isCompleted && (goal.isDueToday || goal.priority.toLowerCase() === "high")) {
      candidates.push(goalCandidate(goal));
    }
  }

  const currentDay = Number.parseInt(context.today.date.slice(8, 10), 10);
  for (const bill of context.finance?.due ?? []) {
    const isDueOrOverdue =
      Number.isFinite(currentDay) && bill.dueDayOfMonth <= currentDay;
    candidates.push({
      title: isDueOrOverdue
        ? `Pay your ${bill.name}${bill.dueDayOfMonth === currentDay ? " today" : ""}`
        : `Pay your ${bill.name}`,
      priority: isDueOrOverdue ? 10 : 70,
      kind: "bill",
    });
  }

  return candidates.sort(compareCandidates);
}

/**
 * Select and render one read-only next action from the existing context.
 * No data is created, updated, or inferred beyond explicit dates, times,
 * reminder flags, routine markers, and goal priority already in the context.
 */
export function buildNextAction(context: AdaptAIContext): string {
  const candidate = buildCandidates(context)[0];

  if (!candidate) {
    return "You don't have anything urgent right now. You're all caught up for now.";
  }

  const described = describeCandidate(candidate);
  const finish = (response: string) =>
    context.communicationProfile?.communicationPreferences.useStepByStep
      ? `1. ${response}`
      : response;
  if (candidate.priority <= 50) {
    const opening =
      candidate.detail === "overdue"
        ? "Start with this overdue item"
        : "The next important thing is";
    return finish(`${opening} ${described}.`);
  }

  if (candidate.kind === "goal") {
    return finish(`You don't have anything urgent right now. A useful next step is ${described}.`);
  }

  return finish(`You don't have anything urgent right now. Your next planned item is ${described}.`);
}