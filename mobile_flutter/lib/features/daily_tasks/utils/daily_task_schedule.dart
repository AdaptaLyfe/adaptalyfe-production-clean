import '../../../core/date/calendar_date.dart';
import '../models/daily_task_model.dart';

bool isDailyTaskScheduledForDate(DailyTaskModel task, DateTime date) {
  final frequency = task.frequency.trim().toLowerCase();
  final dateKey = calendarDateKey(date);

  if (frequency.isEmpty || frequency == 'daily') {
    final createdAt = task.createdAt;
    return createdAt == null || dateKey.compareTo(calendarDateKey(createdAt)) >= 0;
  }

  final dueDate = task.dueDate;
  return dueDate != null && calendarDateKey(dueDate) == dateKey;
}