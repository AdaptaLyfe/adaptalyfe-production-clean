import type {
  AdaptAIContext,
  AiAppointment,
  AiTask,
} from "./ai-context.js";

type AppointmentWithTime = {
  appointment: AiAppointment;
  date?: string;
  time?: string;
  minutes?: number;
};

function normalize(message: string): string {
  return message.toLowerCase().replace(/[?!.,]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Recognize appointment and transition questions. The bare "what's next?"
 * request is also supported, but the route lets the existing Next Action
 * module handle it when there are no appointments to consider.
 */
export function isAppointmentTransitionRequest(message: string): boolean {
  const normalized = normalize(message);
  return [
    /\bwhen is my next appointment\b/,
    /\bwhat do i have coming up\b/,
    /\bwhat should i get ready for\b/,
    /\bwhat(?:'s| is) next\b/,
    /\bam i running late\b/,
    /\bappointments?\b.*\b(?:next|upcoming|coming|ready|late|time)\b/,
  ].some((pattern) => pattern.test(normalized));
}

function parseAppointment(appointment: AiAppointment): AppointmentWithTime {
  const dateMatch = appointment.appointmentDate.match(/^(\d{4}-\d{2}-\d{2})/);
  const timeMatch = appointment.appointmentDate.match(/T(\d{2}):(\d{2})/);
  const date = dateMatch?.[1];
  const time = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : undefined;
  const minutes = time ? parseTimeMinutes(time) : undefined;
  return { appointment, date, time, minutes };
}

function parseTimeMinutes(time?: string): number | undefined {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return undefined;
  const [hours, minutes] = time.split(":").map(Number);
  if (hours > 23 || minutes > 59) return undefined;
  return hours * 60 + minutes;
}

function formatTime(time?: string): string | undefined {
  const minutes = parseTimeMinutes(time);
  if (minutes === undefined) return undefined;
  const hours = Math.floor(minutes / 60);
  const minutePart = minutes % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutePart).padStart(2, "0")} ${suffix}`;
}

function formatDate(date?: string): string | undefined {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function appointmentKey(appointment: AiAppointment): string {
  return `${appointment.title}|${appointment.appointmentDate}`;
}

function allAppointments(context: AdaptAIContext): AppointmentWithTime[] {
  const appointments = [
    ...(context.appointments?.today ?? []),
    ...(context.appointments?.upcoming ? [context.appointments.upcoming] : []),
  ];
  const seen = new Set<string>();
  return appointments
    .filter((appointment) => {
      const key = appointmentKey(appointment);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(parseAppointment);
}

function compareAppointments(a: AppointmentWithTime, b: AppointmentWithTime): number {
  const aValue = `${a.date ?? "9999-99-99"}|${a.time ?? "99:99"}`;
  const bValue = `${b.date ?? "9999-99-99"}|${b.time ?? "99:99"}`;
  return aValue.localeCompare(bValue);
}

function isAfterNow(
  item: AppointmentWithTime,
  context: AdaptAIContext
): boolean {
  if (!item.date) return false;
  if (item.date > context.today.date) return true;
  if (item.date < context.today.date) return false;

  const currentMinutes = parseTimeMinutes(context.today.time);
  if (item.minutes === undefined || currentMinutes === undefined) return true;
  return item.minutes >= currentMinutes;
}

function upcomingAppointments(context: AdaptAIContext): AppointmentWithTime[] {
  return allAppointments(context)
    .filter((item) => isAfterNow(item, context))
    .sort(compareAppointments);
}

function pastAppointmentsToday(context: AdaptAIContext): AppointmentWithTime[] {
  return allAppointments(context)
    .filter((item) => {
      if (item.date !== context.today.date || item.minutes === undefined) return false;
      const currentMinutes = parseTimeMinutes(context.today.time);
      return currentMinutes !== undefined && item.minutes < currentMinutes;
    })
    .sort(compareAppointments);
}

function minutesUntil(
  item: AppointmentWithTime,
  context: AdaptAIContext
): number | undefined {
  if (!item.date || item.minutes === undefined) return undefined;
  const currentMinutes = parseTimeMinutes(context.today.time);
  if (currentMinutes === undefined) return undefined;

  const appointmentDay = Date.UTC(
    Number(item.date.slice(0, 4)),
    Number(item.date.slice(5, 7)) - 1,
    Number(item.date.slice(8, 10))
  );
  const currentDay = Date.UTC(
    Number(context.today.date.slice(0, 4)),
    Number(context.today.date.slice(5, 7)) - 1,
    Number(context.today.date.slice(8, 10))
  );
  const days = Math.round((appointmentDay - currentDay) / 86_400_000);
  const result = days * 24 * 60 + item.minutes - currentMinutes;
  return result > 0 ? result : undefined;
}

function formatMinutesUntil(minutes?: number): string | undefined {
  if (minutes === undefined) return undefined;
  if (minutes < 60) return `in ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  if (minutes < 24 * 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (remainder === 0) return `in ${hours} ${hours === 1 ? "hour" : "hours"}`;
    return `in ${hours}h ${remainder}m`;
  }
  const days = Math.floor(minutes / (24 * 60));
  const remainder = minutes % (24 * 60);
  if (remainder === 0) return `in ${days} ${days === 1 ? "day" : "days"}`;
  return `in ${days}d ${Math.floor(remainder / 60)}h`;
}

function appointmentWhen(
  item: AppointmentWithTime,
  context: AdaptAIContext
): string {
  const time = formatTime(item.time);
  const sameDay = item.date === context.today.date;
  if (sameDay) return time ? `at ${time}` : "today";
  const date = formatDate(item.date);
  if (date && time) return `on ${date} at ${time}`;
  if (date) return `on ${date}`;
  return "at an unspecified time";
}

function likelyPreparationTask(
  appointment: AppointmentWithTime,
  context: AdaptAIContext
): AiTask | undefined {
  const appointmentWords = appointment.appointment.title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3 && !["appointment", "visit", "meeting"].includes(word));

  return (context.tasks?.incomplete ?? []).find((task) => {
    const title = task.title.toLowerCase();
    const explicitlyPreparationRelated =
      /\b(appointment|prepare|preparation|prep|pack|bring|paperwork|document|ready)\b/.test(title);
    if (!explicitlyPreparationRelated) return false;
    if (title.includes("appointment") || appointmentWords.length === 0) return true;
    return appointmentWords.some((word) => title.includes(word));
  });
}

function nextAppointmentResponse(context: AdaptAIContext): string {
  const next = upcomingAppointments(context)[0];
  if (!next) return "I don't see any upcoming appointments in your schedule.";

  const timeUntil = formatMinutesUntil(minutesUntil(next, context));
  const detail = appointmentWhen(next, context);
  return `Your next appointment is ${next.appointment.title} ${detail}${timeUntil ? `, ${timeUntil}` : ""}.`;
}

function comingUpResponse(context: AdaptAIContext): string {
  const itemLimit = context.communicationProfile?.detailLevel === "concise" ? 1 : 3;
  const upcoming = upcomingAppointments(context).slice(0, itemLimit);
  if (upcoming.length === 0) {
    return "I don't see any upcoming appointments in your schedule.";
  }

  const items = upcoming.map((item) => `${item.appointment.title} ${appointmentWhen(item, context)}`);
  if (items.length === 1) return `Coming up, you have ${items[0]}.`;
  return `Coming up, you have ${items.join("; ")}.`;
}

function preparationResponse(context: AdaptAIContext): string {
  const next = upcomingAppointments(context)[0];
  if (!next) return "I don't see an upcoming appointment with enough details to suggest preparation.";

  const detail = appointmentWhen(next, context);
  const preparationTask = likelyPreparationTask(next, context);
  if (preparationTask) {
    return `Your appointment is ${detail}. Before that, you still need to finish your '${preparationTask.title}' task.`;
  }
  return `Your appointment is ${detail}. I don't see a specific preparation task for it yet.`;
}

function runningLateResponse(context: AdaptAIContext): string {
  const upcoming = upcomingAppointments(context)[0];
  if (upcoming) {
    return `Your next appointment is ${upcoming.appointment.title} ${appointmentWhen(upcoming, context)}. It hasn't started yet based on your schedule.`;
  }

  const past = pastAppointmentsToday(context).at(-1);
  if (past) {
    return `Your ${past.appointment.title} was scheduled ${appointmentWhen(past, context)}. I can't tell from your schedule whether you're running late.`;
  }

  return "I don't see an appointment time in your schedule to compare with right now.";
}

/**
 * Build a short, read-only appointment or transition response. Dates and
 * times are interpreted as the local values already supplied by the Context
 * Engine; no travel or preparation duration is invented.
 */
export function buildAppointmentTransitionResponse(
  message: string,
  context: AdaptAIContext
): string {
  const normalized = normalize(message);
  if (normalized.includes("late")) return runningLateResponse(context);
  if (normalized.includes("ready")) return preparationResponse(context);
  if (normalized.includes("coming up")) return comingUpResponse(context);
  return nextAppointmentResponse(context);
}