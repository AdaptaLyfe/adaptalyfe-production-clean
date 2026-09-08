import 'package:equatable/equatable.dart';

import '../models/daily_task_model.dart';

enum DailyTasksStatus {
  initial,
  loading,
  loaded,
  failure,
}

enum DailyTaskAction {
  none,
  adding,
  editing,
  deleting,
  completing,
}

class DailyTasksState extends Equatable {
  const DailyTasksState({
    this.status = DailyTasksStatus.initial,
    this.tasks = const [],
    this.action = DailyTaskAction.none,
    this.activeTaskId,
    this.errorMessage,
    this.actionMessage,
    this.sessionInvalid = false,
  });

  final DailyTasksStatus status;
  final List<DailyTaskModel> tasks;
  final DailyTaskAction action;
  final int? activeTaskId;
  final String? errorMessage;
  final String? actionMessage;
  final bool sessionInvalid;

  bool get isLoading => status == DailyTasksStatus.loading;
  bool get hasTasks => tasks.isNotEmpty;

  DailyTasksState copyWith({
    DailyTasksStatus? status,
    List<DailyTaskModel>? tasks,
    DailyTaskAction? action,
    Object? activeTaskId = _notSet,
    Object? errorMessage = _notSet,
    Object? actionMessage = _notSet,
    bool? sessionInvalid,
  }) {
    return DailyTasksState(
      status: status ?? this.status,
      tasks: tasks ?? this.tasks,
      action: action ?? this.action,
      activeTaskId: identical(activeTaskId, _notSet)
          ? this.activeTaskId
          : activeTaskId as int?,
      errorMessage: identical(errorMessage, _notSet)
          ? this.errorMessage
          : errorMessage as String?,
      actionMessage: identical(actionMessage, _notSet)
          ? this.actionMessage
          : actionMessage as String?,
      sessionInvalid: sessionInvalid ?? this.sessionInvalid,
    );
  }

  @override
  List<Object?> get props => [
        status,
        tasks,
        action,
        activeTaskId,
        errorMessage,
        actionMessage,
        sessionInvalid,
      ];
}

const _notSet = Object();