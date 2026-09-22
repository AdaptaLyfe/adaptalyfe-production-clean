String calendarDateKey(DateTime date) {
  final local = date.toLocal();
  return '${local.year.toString().padLeft(4, '0')}-'
      '${local.month.toString().padLeft(2, '0')}-'
      '${local.day.toString().padLeft(2, '0')}';
}

DateTime calendarDateOnly(DateTime date) {
  final local = date.toLocal();
  return DateTime(local.year, local.month, local.day);
}

String calendarDateTimeIso(DateTime date) {
  final local = date.toLocal();
  return DateTime(
    local.year,
    local.month,
    local.day,
    local.hour,
    local.minute,
    local.second,
    local.millisecond,
    local.microsecond,
  ).toUtc().toIso8601String();
}

DateTime? parseCalendarDate(Object? value, {bool dateOnly = false}) {
  if (value is! String || value.trim().isEmpty) return null;
  final text = value.trim();
  final match = RegExp(r'^(\d{4})-(\d{2})-(\d{2})$').firstMatch(text);
  if (match != null) {
    return DateTime(
      int.parse(match.group(1)!),
      int.parse(match.group(2)!),
      int.parse(match.group(3)!),
    );
  }

  if (dateOnly) {
    final datePrefix =
        RegExp(r'^(\d{4})-(\d{2})-(\d{2})').firstMatch(text);
    if (datePrefix != null) {
      return DateTime(
        int.parse(datePrefix.group(1)!),
        int.parse(datePrefix.group(2)!),
        int.parse(datePrefix.group(3)!),
      );
    }
  }

  final parsed = DateTime.tryParse(text);
  if (parsed == null) return null;
  return dateOnly ? calendarDateOnly(parsed) : parsed.toLocal();
}