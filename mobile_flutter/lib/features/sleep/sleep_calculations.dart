import 'models/sleep_models.dart';

const defaultSleepGoalMinutes = 480;

class SleepMetrics {
  const SleepMetrics({
    this.totalSleepDuration,
    this.timeInBedDuration,
    this.sleepEfficiency,
    this.sleepScore,
  });

  final int? totalSleepDuration;
  final int? timeInBedDuration;
  final double? sleepEfficiency;
  final int? sleepScore;
}

class SleepStats {
  const SleepStats({
    required this.avgSleepDuration,
    required this.avgSleepScore,
    required this.avgEfficiency,
    required this.totalSessions,
    required this.goalProgress,
    this.dailyDuration,
    this.dailyScore,
    this.weeklyTotalSleepDuration,
    this.weeklyAvgSleepDuration,
    this.weeklyGoalTargetMinutes,
    this.weeklyLoggedSessions,
  });

  final int? dailyDuration;
  final int? dailyScore;
  final int? avgSleepDuration;
  final int? avgSleepScore;
  final int? avgEfficiency;
  final int totalSessions;
  final int? goalProgress;
  final int? weeklyTotalSleepDuration;
  final int? weeklyAvgSleepDuration;
  final int? weeklyGoalTargetMinutes;
  final int? weeklyLoggedSessions;
}

SleepMetrics calculateSleepMetrics(
  SleepSessionModel session, {
  int targetSleepDuration = defaultSleepGoalMinutes,
}) {
  final calculatedDuration = _minutesBetween(session.sleepTime, session.wakeTime);
  final totalSleepDuration = calculatedDuration ??
      ((session.totalSleepDuration ?? 0) > 0
          ? session.totalSleepDuration!.round()
          : null);

  final timeInBedDuration = _minutesBetween(session.bedtime, session.wakeTime);
  final storedEfficiency = session.sleepEfficiency;
  final sleepEfficiency = timeInBedDuration != null &&
          timeInBedDuration > 0 &&
          totalSleepDuration != null
      ? (_clamp(totalSleepDuration / timeInBedDuration * 100, 0, 100) * 100)
              .round() /
          100
      : storedEfficiency == null
          ? null
          : (_clamp(storedEfficiency, 0, 100) * 100).round() / 100;

  final storedScore = session.sleepScore;
  final sleepScore = storedScore != null
      ? _round(_clamp(storedScore.toDouble(), 0, 100))
      : totalSleepDuration != null && targetSleepDuration > 0
          ? _round(
              _clamp(totalSleepDuration / targetSleepDuration * 100, 0, 100),
            )
          : null;

  return SleepMetrics(
    totalSleepDuration: totalSleepDuration,
    timeInBedDuration: timeInBedDuration,
    sleepEfficiency: sleepEfficiency,
    sleepScore: sleepScore,
  );
}

SleepStats? calculateSleepStats(
  List<SleepSessionModel> sessions, {
  int targetSleepDuration = defaultSleepGoalMinutes,
  String? referenceDate,
}) {
  if (sessions.isEmpty) return null;
  final datedSessions = sessions
      .map((session) => session.sleepDate)
      .where(_isValidDateOnly)
      .toList()
    ..sort();
  final anchor = referenceDate ?? (datedSessions.isEmpty ? null : datedSessions.last);
  final anchorDay = anchor == null ? null : _dayNumber(anchor);
  if (anchorDay == null) return null;

  final metricSessions = sessions
      .map(
        (session) => (
          session: session,
          metrics: calculateSleepMetrics(
            session,
            targetSleepDuration: targetSleepDuration,
          ),
        ),
      )
      .toList();
  final recent = metricSessions.where((item) {
    final day = _dayNumber(item.session.sleepDate);
    return day != null && day >= anchorDay - 6 && day <= anchorDay;
  }).toList();
  final weekStart = anchorDay - _weekdaySundayZero(anchorDay);
  final weekly = metricSessions.where((item) {
    final day = _dayNumber(item.session.sleepDate);
    return day != null && day >= weekStart && day <= anchorDay;
  }).toList();

  SleepMetrics? selected;
  for (final item in metricSessions) {
    if (item.session.sleepDate == anchor) {
      selected = item.metrics;
      break;
    }
  }
  final durations = recent
      .map((item) => item.metrics.totalSleepDuration)
      .whereType<int>()
      .toList();
  final scores = metricSessions
      .map((item) => item.metrics.sleepScore)
      .whereType<int>()
      .toList();
  final efficiencies = metricSessions
      .map((item) => item.metrics.sleepEfficiency)
      .whereType<double>()
      .toList();
  final weeklyDurations = weekly
      .map((item) => item.metrics.totalSleepDuration)
      .whereType<int>()
      .toList();
  final weeklyGoalTarget = targetSleepDuration > 0
      ? targetSleepDuration * (anchorDay - weekStart + 1)
      : null;

  return SleepStats(
    dailyDuration: selected?.totalSleepDuration,
    dailyScore: selected?.sleepScore,
    avgSleepDuration: _average(durations),
    avgSleepScore: _average(scores),
    avgEfficiency: _average(efficiencies),
    goalProgress: weeklyGoalTarget == null || weeklyGoalTarget == 0
        ? null
        : _round(
            _clamp(
              weeklyDurations.fold<int>(0, (sum, value) => sum + value) /
                  weeklyGoalTarget *
                  100,
              0,
              100,
            ),
          ),
    weeklyTotalSleepDuration:
        weeklyDurations.fold<int>(0, (sum, value) => sum + value),
    weeklyAvgSleepDuration: _average(weeklyDurations),
    weeklyGoalTargetMinutes: weeklyGoalTarget,
    weeklyLoggedSessions: weeklyDurations.length,
    totalSessions: durations.length,
  );
}

int? _average(List<num> values) {
  if (values.isEmpty) return null;
  final total = values.fold<num>(0, (sum, value) => sum + value);
  return _round(total / values.length);
}

int _weekdaySundayZero(int dayNumber) {
  final date = DateTime.utc(1970, 1, 1).add(Duration(days: dayNumber));
  return date.weekday % 7;
}

int? _dayNumber(String value) {
  if (!_isValidDateOnly(value)) return null;
  final parts = value.split('-').map(int.parse).toList();
  return DateTime.utc(parts[0], parts[1], parts[2])
          .difference(DateTime.utc(1970, 1, 1))
          .inDays;
}

bool _isValidDateOnly(String value) {
  final parts = value.split('-');
  if (parts.length != 3 || parts.any((part) => part.isEmpty)) return false;
  final numbers = parts.map(int.tryParse).toList();
  if (numbers.any((number) => number == null)) return false;
  final date = DateTime.utc(numbers[0]!, numbers[1]!, numbers[2]!);
  return date.year == numbers[0] &&
      date.month == numbers[1] &&
      date.day == numbers[2];
}

int? _minutesBetween(DateTime? start, DateTime? end) {
  if (start == null || end == null) return null;
  var difference = end.difference(start).inMinutes;
  if (difference <= 0) difference += 24 * 60;
  return difference;
}

double _clamp(double value, double minimum, double maximum) =>
    value.clamp(minimum, maximum).toDouble();

int _round(num value) => value.round();