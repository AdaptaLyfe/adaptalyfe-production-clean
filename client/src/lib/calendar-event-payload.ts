import { toCalendarEventDateValue } from "./calendar-date";

export interface CalendarEventDraft {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  category: string;
  color: string;
  location: string;
  reminderMinutes: number;
}

export function buildCalendarEventPayload(event: CalendarEventDraft) {
  const allDay = event.allDay === true;

  return {
    title: event.title,
    description: event.description || "",
    startDate: toCalendarEventDateValue(
      event.startDate,
      event.startTime || "12:00",
      allDay,
    ),
    endDate:
      event.endDate && event.endTime
        ? toCalendarEventDateValue(event.endDate, event.endTime, allDay)
        : null,
    allDay,
    category: event.category,
    color: event.color,
    location: event.location || "",
    reminderMinutes: event.reminderMinutes || 15,
  };
}