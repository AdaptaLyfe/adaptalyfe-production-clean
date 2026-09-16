import '../models/calendar_models.dart';
import '../../daily_tasks/models/daily_task_model.dart';
import '../../financial/models/financial_models.dart';
import '../../mood/models/mood_entry_model.dart';
import 'calendar_api.dart';

class CalendarRepository {
  const CalendarRepository(this.api);

  final CalendarApi api;

  Future<List<AppointmentModel>> getAppointments() => api.getAppointments();

  Future<List<DailyTaskModel>> getDailyTasks({DateTime? date}) =>
      api.getDailyTasks(date: date);

  Future<List<BillModel>> getBills() => api.getBills();

  Future<List<MoodEntryModel>> getMoodEntries() => api.getMoodEntries();

  Future<AppointmentModel> createAppointment(AppointmentInput input) =>
      api.createAppointment(input);

  Future<AppointmentModel> updateAppointmentCompletion(
    int id,
    bool isCompleted,
  ) =>
      api.updateAppointmentCompletion(id, isCompleted);

  Future<List<CalendarEventModel>> getCalendarEvents() =>
      api.getCalendarEvents();

  Future<CalendarEventModel> createCalendarEvent(CalendarEventInput input) =>
      api.createCalendarEvent(input);

  Future<CalendarEventModel> updateCalendarEvent(
    int id,
    CalendarEventInput input,
  ) =>
      api.updateCalendarEvent(id, input);

  Future<void> deleteCalendarEvent(int id) => api.deleteCalendarEvent(id);
}