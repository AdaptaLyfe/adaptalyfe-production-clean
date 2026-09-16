const _sleepDatePattern = r'^\d{4}-\d{2}-\d{2}$';

String localSleepDateString([DateTime? value]) {
  final date = (value ?? DateTime.now()).toLocal();
  return '${date.year.toString().padLeft(4, '0')}-'
      '${date.month.toString().padLeft(2, '0')}-'
      '${date.day.toString().padLeft(2, '0')}';
}

bool isValidSleepDate(String? value) {
  if (value == null || !RegExp(_sleepDatePattern).hasMatch(value)) {
    return false;
  }
  final parts = value.split('-').map(int.parse).toList();
  final date = DateTime.utc(parts[0], parts[1], parts[2]);
  return date.year == parts[0] &&
      date.month == parts[1] &&
      date.day == parts[2];
}

String? sleepDateValidationError(
  String? value, {
  DateTime? now,
}) {
  if (!isValidSleepDate(value)) return 'Sleep date must be a valid date';
  final selectedParts = value!.split('-').map(int.parse).toList();
  final selectedDate = DateTime(
    selectedParts[0],
    selectedParts[1],
    selectedParts[2],
  );
  final current = (now ?? DateTime.now()).toLocal();
  final today = DateTime(current.year, current.month, current.day);
  return selectedDate.isAfter(today)
      ? 'Sleep date cannot be in the future'
      : null;
}

String? sleepTimeValidationError(
  DateTime? bedtime,
  DateTime? sleepTime,
) {
  if (bedtime == null || sleepTime == null) return null;
  if (sleepTime.isBefore(bedtime)) {
    return 'Time fell asleep must be the same as or later than bedtime';
  }
  return null;
}

String? wakeTimeValidationError(
  DateTime? sleepTime,
  DateTime? wakeTime,
) {
  if (sleepTime == null || wakeTime == null) return null;
  if (wakeTime.isBefore(sleepTime)) {
    return 'Wake time must be the same as or later than time fell asleep';
  }
  return null;
}

String? sleepRoutineValidationError(
  DateTime? bedtime,
  DateTime? sleepTime,
  DateTime? wakeTime,
) {
  return sleepTimeValidationError(bedtime, sleepTime) ??
      wakeTimeValidationError(sleepTime, wakeTime);
}