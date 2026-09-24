import 'package:flutter_test/flutter_test.dart';

import 'package:adaptalyfe_mobile/core/date/calendar_date.dart';
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
  });

  test('API response mapping keeps an all-day event all-day after reload', () {
    final event = CalendarEventModel.fromJson({
      'id': 7,
      'title': 'Holiday',
      'startDate': '2026-09-24T00:00:00.000Z',
      'endDate': '2026-09-26T00:00:00.000Z',
      'allDay': true,
      'category': 'personal',
      'color': '#3b82f6',
      'isCompleted': false,
    });

    expect(event.allDay, isTrue);
    expect(calendarDateKey(event.startDate), '2026-09-24');
    expect(calendarDateKey(event.endDate!), '2026-09-26');
  });
}