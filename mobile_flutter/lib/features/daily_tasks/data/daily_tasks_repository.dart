import '../models/daily_task_model.dart';
import 'daily_tasks_api.dart';

class DailyTasksRepository {
  const DailyTasksRepository(this.api);

  final DailyTasksApi api;

  Future<List<DailyTaskModel>> getTasks({DateTime? date}) =>
      api.getTasks(date: date);

  Future<DailyTaskModel> createTask(DailyTaskInput input) =>
      api.createTask(input);

  Future<DailyTaskModel> updateTask(int taskId, DailyTaskInput input) =>
      api.updateTask(taskId, input);

  Future<DailyTaskModel> updateCompletion(
    int taskId,
    bool isCompleted, {
    DateTime? date,
  }) =>
      api.updateCompletion(taskId, isCompleted, date: date);

  Future<void> deleteTask(int taskId) => api.deleteTask(taskId);
}