import '../models/daily_task_model.dart';
import 'daily_tasks_api.dart';

class DailyTasksRepository {
  const DailyTasksRepository(this.api);

  final DailyTasksApi api;

  Future<List<DailyTaskModel>> getTasks() => api.getTasks();

  Future<DailyTaskModel> createTask(DailyTaskInput input) =>
      api.createTask(input);

  Future<DailyTaskModel> updateTask(int taskId, DailyTaskInput input) =>
      api.updateTask(taskId, input);

  Future<DailyTaskModel> updateCompletion(int taskId, bool isCompleted) =>
      api.updateCompletion(taskId, isCompleted);

  Future<void> deleteTask(int taskId) => api.deleteTask(taskId);
}