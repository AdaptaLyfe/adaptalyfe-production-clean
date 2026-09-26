import 'package:equatable/equatable.dart';

import '../models/daily_task_model.dart';

sealed class DailyTasksEvent extends Equatable {
  const DailyTasksEvent();

  @override
  List<Object?> get props => [];
}

final class DailyTasksStarted extends DailyTasksEvent {
  const DailyTasksStarted({this.date});

  final DateTime? date;

  @override
  List<Object?> get props => [date];
}

final class RefreshDailyTasks extends DailyTasksEvent {
  const RefreshDailyTasks({this.date});

  final DateTime? date;

  @override
  List<Object?> get props => [date];
}

final class AddDailyTask extends DailyTasksEvent {
  const AddDailyTask(this.input);

  final DailyTaskInput input;

  @override
  List<Object?> get props => [input];
}

final class EditDailyTask extends DailyTasksEvent {
  const EditDailyTask({
    required this.taskId,
    required this.input,
  });

  final int taskId;
  final DailyTaskInput input;

  @override
  List<Object?> get props => [taskId, input];
}

final class DeleteDailyTask extends DailyTasksEvent {
  const DeleteDailyTask(this.taskId);

  final int taskId;

  @override
  List<Object?> get props => [taskId];
}

final class ToggleDailyTask extends DailyTasksEvent {
  const ToggleDailyTask({
    required this.taskId,
    required this.isCompleted,
    this.date,
    this.pointValue = 0,
  });

  final int taskId;
  final bool isCompleted;
  final DateTime? date;
  final int pointValue;

  @override
  List<Object?> get props => [taskId, isCompleted, date, pointValue];
}