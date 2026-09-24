import { getCalendarEventDateKey } from "./calendar-date";

export interface CalendarEventDisplayInput {
  startDate: Date | string;
  allDay: boolean | null;
}

export function getCalendarEventDisplayFields(event: CalendarEventDisplayInput) {
  const allDay = event.allDay === true;

  return {
    dateKey: getCalendarEventDateKey(event.startDate, allDay),
    allDay,
    time: allDay
      ? null
      : new Date(event.startDate).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
  };
}