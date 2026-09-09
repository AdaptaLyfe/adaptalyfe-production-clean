import '../../../core/network/api_client.dart';
import '../models/calendar_models.dart';

class CalendarApi {
  const CalendarApi(this.client);

  final ApiClient client;

  Future<List<AppointmentModel>> getAppointments() =>
      _getList('/api/appointments', AppointmentModel.fromJson);

  Future<List<AppointmentModel>> getUpcomingAppointments() =>
      _getList('/api/appointments/upcoming', AppointmentModel.fromJson);

  Future<AppointmentModel> createAppointment(AppointmentInput input) =>
      _post('/api/appointments', input.toJson(), AppointmentModel.fromJson);

  Future<AppointmentModel> updateAppointmentCompletion(
    int id,
    bool isCompleted,
  ) =>
      _patch(
        '/api/appointments/$id/complete',
        {'isCompleted': isCompleted},
        AppointmentModel.fromJson,
      );

  Future<List<CalendarEventModel>> getCalendarEvents() =>
      _getList('/api/calendar-events', CalendarEventModel.fromJson);

  Future<CalendarEventModel> createCalendarEvent(CalendarEventInput input) =>
      _post(
        '/api/calendar-events',
        input.toJson(),
        CalendarEventModel.fromJson,
      );

  Future<CalendarEventModel> updateCalendarEvent(
    int id,
    CalendarEventInput input,
  ) =>
      _put(
        '/api/calendar-events/$id',
        input.toJson(),
        CalendarEventModel.fromJson,
      );

  Future<void> deleteCalendarEvent(int id) async {
    await client.delete<dynamic>('/api/calendar-events/$id');
  }

  Future<List<T>> _getList<T>(
    String path,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.get<dynamic>(path);
    if (response.data is! List) {
      throw const FormatException('Invalid calendar collection response');
    }
    return (response.data as List)
        .whereType<Map>()
        .map((item) => fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<T> _post<T>(
    String path,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.post<dynamic>(path, data: data);
    return _parseItem(response.data, fromJson);
  }

  Future<T> _patch<T>(
    String path,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.patch<dynamic>(path, data: data);
    return _parseItem(response.data, fromJson);
  }

  Future<T> _put<T>(
    String path,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.put<dynamic>(path, data: data);
    return _parseItem(response.data, fromJson);
  }

  T _parseItem<T>(
    Object? data,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    if (data is! Map) {
      throw const FormatException('Invalid calendar item response');
    }
    return fromJson(Map<String, dynamic>.from(data));
  }
}