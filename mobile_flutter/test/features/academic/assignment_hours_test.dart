import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';

import 'package:adaptalyfe_mobile/features/academic/models/academic_models.dart';

void main() {
  group('AssignmentHours', () {
    test('accepts whole and fractional hour values', () {
      const validValues = <String, double>{
        '0.5': 0.5,
        '1': 1.0,
        '1.5': 1.5,
        '2': 2.0,
        '2.5': 2.5,
        '3.75': 3.75,
        '10.5': 10.5,
        '10.75': 10.75,
        '100': 100.0,
      };

      for (final entry in validValues.entries) {
        expect(
          AssignmentHours.validationMessage(entry.key),
          isNull,
          reason: entry.key,
        );
        expect(AssignmentHours.parse(entry.key), entry.value);
      }
    });

    test('rejects empty, negative, non-numeric, and invalid values', () {
      for (final value in [
        '',
        ' ',
        '-0.5',
        'not a number',
        '2.5.1',
        '101',
      ]) {
        expect(
          AssignmentHours.validationMessage(value),
          isNotNull,
          reason: value,
        );
        expect(AssignmentHours.parse(value), isNull, reason: value);
      }
    });
  });

  test('AssignmentInput JSON preserves decimal hours as a number', () {
    final input = AssignmentInput(
      classId: null,
      title: 'Read chapter 4',
      description: '',
      type: 'homework',
      dueDate: DateTime.utc(2026, 9, 24),
      priority: 'medium',
      estimatedHours: 2.5,
    );

    final encodedHours = input.toJson()['estimatedHours'];
    final decodedPayload =
        jsonDecode(jsonEncode(input.toJson())) as Map<String, dynamic>;

    expect(encodedHours, isA<double>());
    expect(decodedPayload['estimatedHours'], 2.5);
  });

  test('AssignmentModel reads backend integer and decimal values', () {
    for (final value in <num>[2, 2.5]) {
      final assignment = AssignmentModel.fromJson({
        'id': 1,
        'userId': 42,
        'title': 'Read chapter 4',
        'type': 'homework',
        'dueDate': '2026-09-24T00:00:00.000Z',
        'estimatedHours': value,
      });

      expect(assignment.estimatedHours, value.toDouble());
      expect(assignment.estimatedHours, isA<double>());
    }
  });
}