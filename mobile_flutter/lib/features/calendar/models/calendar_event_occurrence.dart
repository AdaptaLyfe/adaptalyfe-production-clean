import '../../../core/date/calendar_date.dart';
import 'calendar_models.dart';

/// Returns whether an event should be shown on [date].
///
/// Recurrences are expanded for display only. This function never creates or
/// persists occurrence rows, so one saved recurring event cannot duplicate
/// itself in storage.
bool calendarEventOccursOnDate(CalendarEventModel event, DateTime date) {
  final day = calendarDateOnly(date);
  final start = calendarDateOnly(event.startDate);
  final storedEnd =
      event.endDate == null ? start : calendarDateOnly(event.endDate!);
  final end = storedEnd.isBefore(start) ? start : storedEnd;

  if (!event.isRecurring) {
    return event.allDay
        ? !day.isBefore(start) && !day.isAfter(end)
        : _sameCalendarDay(start, day);
  }

  final rule = event.recurrenceRule?.trim().toLowerCase();
  if (rule == null || rule.isEmpty) {
    return event.allDay
        ? !day.isBefore(start) && !day.isAfter(end)
        : _sameCalendarDay(start, day);
  }

  final recurrenceForDay = _recursOnDate(rule, start, day);
  if (recurrenceForDay == null) {
    return event.allDay
        ? !day.isBefore(start) && !day.isAfter(end)
        : _sameCalendarDay(start, day);
  }
  if (!event.allDay) {
    return recurrenceForDay;
  }

  // Treat endDate as the inclusive duration of each all-day occurrence. Check
  // prior recurrence starts too, so longer occurrences still cover each day.
  final durationDays = _calendarDaysBetween(start, end);
  final maxDaysBack = switch (rule) {
    'daily' => 0,
    'weekly' => 6,
    'monthly' => 61,
    'yearly' => 1461,
    _ => 0,
  };
  final daysToCheck =
      durationDays < maxDaysBack ? durationDays : maxDaysBack;
  for (var daysBack = 0; daysBack <= daysToCheck; daysBack++) {
    final occurrenceStart =
        DateTime(day.year, day.month, day.day - daysBack);
    if (_recursOnDate(rule, start, occurrenceStart) == true) return true;
  }
  return false;
}

bool? _recursOnDate(String rule, DateTime start, DateTime day) {
  if (day.isBefore(start)) return false;

  final daysSinceStart = _calendarDaysBetween(start, day);
  switch (rule) {
    case 'daily':
      return true;
    case 'weekly':
      return daysSinceStart % 7 == 0;
    case 'monthly':
      return day.day == start.day;
    case 'yearly':
      return day.month == start.month && day.day == start.day;
    default:
      return null;
  }
}

int _calendarDaysBetween(DateTime start, DateTime end) {
  final startUtc = DateTime.utc(start.year, start.month, start.day);
  final endUtc = DateTime.utc(end.year, end.month, end.day);
  return endUtc.difference(startUtc).inDays;
}

bool _sameCalendarDay(DateTime first, DateTime second) =>
    first.year == second.year &&
    first.month == second.month &&
    first.day == second.day;