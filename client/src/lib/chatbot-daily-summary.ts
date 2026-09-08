import type { Appointment, CalendarEvent, DailyTask } from "@shared/schema";
import { getChatbotGreeting, getLocalDateKey } from "./chatbot-greeting";

export type ChatbotDailyPlanItem = {
  id: string;
  title: string;
  time: string;
  completed: boolean;
  sortAt: Date | null;
};

export type ChatbotDailySummary = {
  dateKey: string;
  greeting: string;
  countMessage: string;
  items: ChatbotDailyPlanItem[];
  offer: string;
  content: string;
};

function toLocalDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;

  // Date-only values should stay on the user's local calendar day instead of
  // being interpreted as midnight UTC and shifting to the previous day.
  if (typeof value === "string") {
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameLocalDay(value: Date | null, reference: Date): boolean {
  return Boolean(
    value &&
      value.getFullYear() === reference.getFullYear() &&
      value.getMonth() === reference.getMonth() &&
      value.getDate() === reference.getDate(),
  );
}

function isEventOnLocalDay(
  startDate: Date | null,
  endDate: Date | null,
  reference: Date,
): boolean {
  if (!startDate) return false;
  if (isSameLocalDay(startDate, reference) || isSameLocalDay(endDate, reference)) {
    return true;
  }

  const dayStart = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  );
  const nextDayStart = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate() + 1,
  );

  return startDate < nextDayStart && Boolean(endDate && endDate >= dayStart);
}

function parseTaskTime(
  scheduledTime: string | null | undefined,
  reference: Date,
): Date | null {
  if (!scheduledTime) return null;

  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(scheduledTime);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] || 0);
  if (hour > 23 || minute > 59 || second > 59) return null;

  return new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
    hour,
    minute,
    second,
  );
}

function formatTime(date: Date | null): string {
  if (!date) return "Any time";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getCountMessage(count: number): string {
  if (count === 0) return "You don't have anything planned today.";
  if (count === 1) return "You have 1 thing planned today.";
  return `You have ${count} things planned today.`;
}

function getDailyTaskItem(task: DailyTask, today: Date): ChatbotDailyPlanItem | null {
  const isDailyTask = task.frequency === "daily" || !task.frequency;
  const dueDate = toLocalDate(task.dueDate);
  const isDueToday = isDailyTask || isSameLocalDay(dueDate, today);
  if (!isDueToday) return null;

  const scheduledAt = parseTaskTime(task.scheduledTime, today);
  const dueTodayAt = !isDailyTask && isSameLocalDay(dueDate, today) ? dueDate : null;

  return {
    id: `task-${task.id}`,
    title: task.title,
    time: formatTime(scheduledAt || dueTodayAt),
    completed: Boolean(task.isCompleted),
    sortAt: scheduledAt || dueTodayAt,
  };
}

function getAppointmentItem(
  appointment: Appointment,
  today: Date,
): ChatbotDailyPlanItem | null {
  const startsAt = toLocalDate(appointment.appointmentDate);
  if (!startsAt || !isSameLocalDay(startsAt, today)) return null;

  return {
    id: `appointment-${appointment.id}`,
    title: appointment.title,
    time: formatTime(startsAt),
    completed: Boolean(appointment.isCompleted),
    sortAt: startsAt,
  };
}

function getCalendarEventItem(
  event: CalendarEvent,
  today: Date,
): ChatbotDailyPlanItem | null {
  const startsAt = toLocalDate(event.startDate);
  const endsAt = toLocalDate(event.endDate);
  if (!isEventOnLocalDay(startsAt, endsAt, today)) return null;

  return {
    id: `event-${event.id}`,
    title: event.title,
    time: event.allDay ? "All day" : formatTime(startsAt),
    completed: Boolean(event.isCompleted),
    sortAt: startsAt,
  };
}

export function getTodayChatbotPlan(
  tasks: DailyTask[],
  appointments: Appointment[],
  calendarEvents: CalendarEvent[],
  today: Date = new Date(),
): ChatbotDailyPlanItem[] {
  return [
    ...tasks.map((task) => getDailyTaskItem(task, today)),
    ...appointments.map((appointment) => getAppointmentItem(appointment, today)),
    ...calendarEvents.map((event) => getCalendarEventItem(event, today)),
  ]
    .filter((item): item is ChatbotDailyPlanItem => item !== null)
    .sort((first, second) => {
      if (!first.sortAt && !second.sortAt) return first.title.localeCompare(second.title);
      if (!first.sortAt) return 1;
      if (!second.sortAt) return -1;
      return first.sortAt.getTime() - second.sortAt.getTime();
    });
}

export function buildChatbotDailySummary(
  name: unknown,
  tasks: DailyTask[],
  appointments: Appointment[],
  calendarEvents: CalendarEvent[],
  openedAt: Date = new Date(),
): ChatbotDailySummary {
  const items = getTodayChatbotPlan(tasks, appointments, calendarEvents, openedAt);
  const greeting = getChatbotGreeting(name, openedAt);
  const countMessage = getCountMessage(items.length);
  const offer = "Want me to help you plan today?";
  const itemLines = items.map(
    (item) => `${item.completed ? "☑️" : "☐"} ${item.time} – ${item.title}`,
  );

  return {
    dateKey: getLocalDateKey(openedAt),
    greeting,
    countMessage,
    items,
    offer,
    content: [greeting, "", countMessage, ...itemLines, "", offer].join("\n"),
  };
}