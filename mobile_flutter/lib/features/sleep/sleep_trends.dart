import 'models/sleep_models.dart';

List<SleepSessionModel> sortSleepSessionsChronologically(
  List<SleepSessionModel> sessions,
) {
  final sorted = [...sessions];
  sorted.sort((a, b) {
    final dateOrder = a.sleepDate.compareTo(b.sleepDate);
    return dateOrder == 0 ? a.id.compareTo(b.id) : dateOrder;
  });
  return sorted;
}

List<SleepSessionModel> getRecentSleepSessions(
  List<SleepSessionModel> sessions, {
  int limit = 7,
}) {
  if (limit <= 0) return [];
  final sorted = sortSleepSessionsChronologically(sessions);
  return sorted.reversed.take(limit).toList();
}