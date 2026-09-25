import 'package:flutter_test/flutter_test.dart';

import 'package:adaptalyfe_mobile/core/date/calendar_date.dart';
import 'package:adaptalyfe_mobile/features/calendar/models/calendar_event_occurrence.dart';
import 'package:adaptalyfe_mobile/features/calendar/models/calendar_models.dart';

void main() {
  test('all-day event input serializes date-only values and explicit true', () {
    final input = CalendarEventInput(
      title: 'Holiday',
      startDate: DateTime(2026, 9, 24, 14),
      endDate: DateTime(2026, 9, 26, 18),
      allDay: true,
      category: 'personal',
    );

    final payload = input.toJson();
    expect(payload['allDay'], isTrue);
    expect(payload['startDate'], '2026-09-24');
    expect(payload['endDate'], '2026-09-26');
    expect(payload['isRecurring'], isFalse);
    expect(payload['recurrenceRule'], isNull);
  });

  test('all-day recurrence serializes the rule with the selected start date', () {
    final input = CalendarEventInput(
      title: 'Daily medication reminder',
      startDate: DateTime(2026, 9, 25, 17),
      allDay: true,
      category: 'health',
      isRecurring: true,
      recurrenceRule: 'daily',
    );

    final payload = input.toJson();
    expect(payload['allDay'], isTrue);
    expect(payload['startDate'], '2026-09-25');
    expect(payload['isRecurring'], isTrue);
    expect(payload['recurrenceRule'], 'daily');
  });

  test('timed event input serializes an explicit false and instants', () {
    final startDate = DateTime(2026, 9, 24, 9, 30);
    final input = CalendarEventInput(
      title: 'Appointment',
      startDate: startDate,
      allDay: false,
      category: 'personal',
    );

    final payload = input.toJson();
    expect(payload['allDay'], isFalse);
    expect(payload['startDate'], calendarDateTimeIso(startDate));
    expect(payload['isRecurring'], isFalse);
    expect(payload['recurrenceRule'], isNull);
  });

  test('API response mapping keeps an all-day event all-day after reload', () {
    final event = CalendarEventModel.fromJson({
      'id': 7,
      'title': 'Holiday',
      'startDate': '2026-09-24T00:00:00.000Z',
      'endDate': '2026-09-26T00:00:00.000Z',
      'allDay': true,
      'isRecurring': true,
      'recurrenceRule': 'weekly',
      'category': 'personal',
      'color': '#3b82f6',
      'isCompleted': false,
    });

    expect(event.allDay, isTrue);
    expect(event.isRecurring, isTrue);
    expect(event.recurrenceRule, 'weekly');
    expect(calendarDateKey(event.startDate), '2026-09-24');
    expect(calendarDateKey(event.endDate!), '2026-09-26');
  });

  test('a normal midnight event with all-day off stays on one selected date', () {
    final event = _event(
      startDate: DateTime(2026, 9, 25),
      allDay: false,
    );

    expect(calendarEventOccursOnDate(event, DateTime(2026, 9, 25)), isTrue);
    expect(calendarEventOccursOnDate(event, DateTime(2026, 9, 26)), isFalse);
  });

  test('non-recurring all-day events stay only on their selected date range', () {
    final event = _event(
      startDate: DateTime(2026, 9, 25),
      endDate: DateTime(2026, 9, 26),
      allDay: true,
    );

    expect(calendarEventOccursOnDate(event, DateTime(2026, 9, 24)), isFalse);
    expect(calendarEventOccursOnDate(event, DateTime(2026, 9, 25)), isTrue);
    expect(calendarEventOccursOnDate(event, DateTime(2026, 9, 26)), isTrue);
    expect(calendarEventOccursOnDate(event, DateTime(2026, 9, 27)), isFalse);
  });

  test('all-day recurrence begins on its saved start date', () {
    final event = _event(
      startDate: DateTime(2026, 9, 25),
      allDay: true,
      isRecurring: true,
      recurrenceRule: 'daily',
    );

    expect(calendarEventOccursOnDate(event, DateTime(2026, 9, 24)), isFalse);
    expect(calendarEventOccursOnDate(event, DateTime(2026, 9, 25)), isTrue);
    expect(calendarEventOccursOnDate(event, DateTime(2026, 9, 26)), isTrue);
  });

  test('weekly all-day recurrence respects selected weekday and duration', () {
    final event = _event(
      startDate: DateTime(2026, 9, 25),
      endDate: DateTime(2026, 9, 26),
      allDay: true,
      isRecurring: true,
      recurrenceRule: 'weekly',
    );

    expect(calendarEventOccursOnDate(event, DateTime(2026, 9, 25)), isTrue);
    expect(calendarEventOccursOnDate(event, DateTime(2026, 10, 2)), isTrue);
    expect(calendarEventOccursOnDate(event, DateTime(2026, 10, 3)), isTrue);
    expect(calendarEventOccursOnDate(event, DateTime(2026, 10, 4)), isFalse);
  });

  test('monthly and yearly recurrence use the selected calendar date', () {
    final monthly = _event(
      startDate: DateTime(2026, 9, 25),
      allDay: true,
      isRecurring: true,
      recurrenceRule: 'monthly',
    );
    final yearly = _event(
      startDate: DateTime(2026, 9, 25),
      allDay: true,
      isRecurring: true,
      recurrenceRule: 'yearly',
    );

    expect(calendarEventOccursOnDate(monthly, DateTime(2026, 10, 25)), isTrue);
    expect(calendarEventOccursOnDate(monthly, DateTime(2026, 10, 24)), isFalse);
    expect(calendarEventOccursOnDate(yearly, DateTime(2027, 9, 25)), isTrue);
    expect(calendarEventOccursOnDate(yearly, DateTime(2027, 9, 26)), isFalse);
  });

  test('turning all-day off clears the all-day flag in the update payload', () {
    final input = CalendarEventInput(
      title: 'Holiday',
      startDate: DateTime(2026, 9, 25),
      allDay: false,
      category: 'personal',
    );

    expect(input.toJson()['allDay'], isFalse);
  });
}

CalendarEventModel _event({
  required DateTime startDate,
  DateTime? endDate,
  bool allDay = false,
  bool isRecurring = false,
  String? recurrenceRule,
}) =>
    CalendarEventModel(
      id: 1,
      title: 'Calendar event',
      description: null,
      startDate: startDate,
      endDate: endDate,
      allDay: allDay,
      category: 'personal',
      color: '#3b82f6',
      location: null,
      isCompleted: false,
      reminderMinutes: null,
      isRecurring: isRecurring,
      recurrenceRule: recurrenceRule,
    );