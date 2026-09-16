import '../../../core/network/api_client.dart';
import '../../../core/date/calendar_date.dart';
import '../models/daily_task_model.dart';

class DailyTasksApi {
  const DailyTasksApi(this.client);

  final ApiClient client;

  Future<List<DailyTaskModel>> getTasks({DateTime? date}) async {
    final response = await client.get<dynamic>(
      '/api/daily-tasks',
      queryParameters: date == null ? null : {'date': calendarDateKey(date)},
    );
    final data = response.data;

    if (data is! List) {
      throw const FormatException('Invalid daily tasks response');
    }

    return data
        .whereType<Map>()
        .map((task) => DailyTaskModel.fromJson(
              Map<String, dynamic>.from(task),
            ))
        .toList();
  }

  Future<DailyTaskModel> createTask(DailyTaskInput input) async {
    final response = await client.post<dynamic>(
      '/api/daily-tasks',
      data: input.toJson(),
    );
    return _taskFromResponse(response.data);
  }

  Future<DailyTaskModel> updateTask(
    int taskId,
    DailyTaskInput input,
  ) async {
    final response = await client.patch<dynamic>(
      '/api/daily-tasks/$taskId',
      data: input.toJson(),
    );
    return _taskFromResponse(response.data);
  }

  Future<DailyTaskModel> updateCompletion(
    int taskId,
    bool isCompleted,
    {DateTime? date}
  ) async {
    final response = await client.patch<dynamic>(
      '/api/daily-tasks/$taskId/complete',
      data: {
        'isCompleted': isCompleted,
        if (date != null) 'date': calendarDateKey(date),
      },
    );
    return _taskFromResponse(response.data);
  }

  Future<void> deleteTask(int taskId) async {
    await client.delete<dynamic>('/api/daily-tasks/$taskId');
  }

  DailyTaskModel _taskFromResponse(dynamic data) {
    if (data is! Map) {
      throw const FormatException('Invalid daily task response');
    }
    return DailyTaskModel.fromJson(Map<String, dynamic>.from(data));
  }
}