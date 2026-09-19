import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/date/calendar_date.dart';
import '../../../core/network/api_client.dart';
import '../data/daily_tasks_repository.dart';
import 'daily_tasks_event.dart';
import 'daily_tasks_state.dart';

class DailyTasksBloc extends Bloc<DailyTasksEvent, DailyTasksState> {
  DailyTasksBloc(this.repository) : super(const DailyTasksState()) {
    on<DailyTasksStarted>(_loadTasks);
    on<RefreshDailyTasks>(_loadTasks);
    on<AddDailyTask>(_addTask);
    on<EditDailyTask>(_editTask);
    on<DeleteDailyTask>(_deleteTask);
    on<ToggleDailyTask>(_toggleTask);
  }

  final DailyTasksRepository repository;
  DateTime? _selectedDate;
  bool _usesImplicitToday = true;

  Future<void> _loadTasks(
    DailyTasksEvent event,
    Emitter<DailyTasksState> emit,
  ) async {
    if (event is DailyTasksStarted) {
      _selectedDate = event.date == null
          ? null
          : calendarDateOnly(event.date!);
      _usesImplicitToday = event.date == null;
    } else if (event is RefreshDailyTasks && event.date != null) {
      _selectedDate = calendarDateOnly(event.date!);
      _usesImplicitToday = false;
    }

    final requestDate = _requestDate;
    emit(
      state.copyWith(
        status: DailyTasksStatus.loading,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );

    try {
      final tasks = await repository.getTasks(date: requestDate);
      emit(
        state.copyWith(
          status: DailyTasksStatus.loaded,
          tasks: tasks,
          action: DailyTaskAction.none,
          activeTaskId: null,
          errorMessage: null,
          actionMessage: null,
        ),
      );
    } on ApiException catch (error) {
      emit(
        state.copyWith(
          status: DailyTasksStatus.failure,
          action: DailyTaskAction.none,
          activeTaskId: null,
          errorMessage: error.message,
          sessionInvalid: error.type == ApiErrorType.unauthorized,
        ),
      );
    } catch (error) {
      emit(
        state.copyWith(
          status: DailyTasksStatus.failure,
          action: DailyTaskAction.none,
          activeTaskId: null,
          errorMessage: _messageFor(error),
        ),
      );
    }
  }

  Future<void> _addTask(
    AddDailyTask event,
    Emitter<DailyTasksState> emit,
  ) async {
    emit(
      state.copyWith(
        action: DailyTaskAction.adding,
        errorMessage: null,
        actionMessage: null,
      ),
    );

    try {
      final createdTask = await repository.createTask(event.input);
      final fallbackTasks = [
        createdTask,
        ...state.tasks.where((task) => task.id != createdTask.id),
      ];
      emit(
        state.copyWith(
          status: DailyTasksStatus.loaded,
          tasks: fallbackTasks,
          action: DailyTaskAction.none,
          activeTaskId: null,
          errorMessage: null,
          actionMessage: 'New task added to your daily list.',
          sessionInvalid: false,
        ),
      );

      try {
        final refreshedTasks = await repository.getTasks(date: _requestDate);
        emit(
          state.copyWith(
            status: DailyTasksStatus.loaded,
            tasks: refreshedTasks,
            action: DailyTaskAction.none,
            activeTaskId: null,
            errorMessage: null,
            actionMessage: null,
            sessionInvalid: false,
          ),
        );
      } catch (error) {
        emit(
          state.copyWith(
            status: DailyTasksStatus.loaded,
            tasks: fallbackTasks,
            action: DailyTaskAction.none,
            activeTaskId: null,
            errorMessage:
                'The task was saved, but the list could not be refreshed. '
                'Pull to refresh and try again.',
            actionMessage: null,
            sessionInvalid:
                error is ApiException && error.type == ApiErrorType.unauthorized,
          ),
        );
      }
    } catch (error) {
      _emitActionError(emit, error, 'Failed to create task. Please try again.');
    }
  }

  Future<void> _editTask(
    EditDailyTask event,
    Emitter<DailyTasksState> emit,
  ) async {
    emit(
      state.copyWith(
        action: DailyTaskAction.editing,
        activeTaskId: event.taskId,
        errorMessage: null,
        actionMessage: null,
      ),
    );

    try {
      final updatedTask = await repository.updateTask(event.taskId, event.input);
      await _reloadAfterMutation(
        emit,
        successMessage: 'Your task has been updated successfully.',
        fallbackTasks: state.tasks
            .map((task) => task.id == updatedTask.id ? updatedTask : task)
            .toList(growable: false),
      );
    } catch (error) {
      _emitActionError(emit, error, 'Failed to update task. Please try again.');
    }
  }

  Future<void> _deleteTask(
    DeleteDailyTask event,
    Emitter<DailyTasksState> emit,
  ) async {
    emit(
      state.copyWith(
        action: DailyTaskAction.deleting,
        activeTaskId: event.taskId,
        errorMessage: null,
        actionMessage: null,
      ),
    );

    try {
      await repository.deleteTask(event.taskId);
      await _reloadAfterMutation(
        emit,
        successMessage: 'The task was permanently deleted.',
        fallbackTasks: state.tasks
            .where((task) => task.id != event.taskId)
            .toList(growable: false),
      );
    } catch (error) {
      _emitActionError(emit, error, 'Failed to delete task. Please try again.');
    }
  }

  Future<void> _toggleTask(
    ToggleDailyTask event,
    Emitter<DailyTasksState> emit,
  ) async {
    final previousTasks = state.tasks;
    final taskIndex = previousTasks.indexWhere((task) => task.id == event.taskId);
    final selectedDate = event.date ?? _requestDate;
    final selectedDateKey =
        selectedDate == null ? null : calendarDateKey(selectedDate);

    if (taskIndex >= 0) {
      final currentTask = previousTasks[taskIndex];
      final updatedCompletionDates = [...currentTask.completionDates];
      if (selectedDateKey != null) {
        if (event.isCompleted && !updatedCompletionDates.contains(selectedDateKey)) {
          updatedCompletionDates.add(selectedDateKey);
        } else if (!event.isCompleted) {
          updatedCompletionDates.remove(selectedDateKey);
        }
      }

      final updatedTasks = [...previousTasks];
      updatedTasks[taskIndex] = currentTask.copyWith(
        isCompleted: event.isCompleted,
        completedAt: event.isCompleted ? DateTime.now() : null,
        completionDates: updatedCompletionDates,
      );
      emit(
        state.copyWith(
          status: DailyTasksStatus.loaded,
          tasks: updatedTasks,
          action: DailyTaskAction.completing,
          activeTaskId: event.taskId,
          errorMessage: null,
          actionMessage: null,
        ),
      );
    } else {
      emit(
        state.copyWith(
          action: DailyTaskAction.completing,
          activeTaskId: event.taskId,
          errorMessage: null,
          actionMessage: null,
        ),
      );
    }

    try {
      await repository.updateCompletion(
        event.taskId,
        event.isCompleted,
        date: selectedDate,
      );
      await _reloadAfterMutation(
        emit,
        successMessage: event.isCompleted && event.pointValue > 0
            ? 'Excellent! You earned ${event.pointValue} points for completing this task!'
            : event.isCompleted
                ? 'Great job staying on track!'
                : 'Task updated!',
      );
    } catch (error) {
      emit(
        state.copyWith(
          status: previousTasks.isEmpty
              ? DailyTasksStatus.failure
              : DailyTasksStatus.loaded,
          tasks: previousTasks,
          action: DailyTaskAction.none,
          activeTaskId: null,
        ),
      );
      _emitActionError(emit, error, 'Failed to update task. Please try again.');
    }
  }

  Future<void> _reloadAfterMutation(
    Emitter<DailyTasksState> emit, {
    required String successMessage,
    List<DailyTaskModel>? fallbackTasks,
  }) async {
    try {
      final tasks = await repository.getTasks(date: _requestDate);
      emit(
        state.copyWith(
          status: DailyTasksStatus.loaded,
          tasks: tasks,
          action: DailyTaskAction.none,
          activeTaskId: null,
          errorMessage: null,
          actionMessage: successMessage,
          sessionInvalid: false,
        ),
      );
    } catch (error) {
      emit(
        state.copyWith(
          status: DailyTasksStatus.loaded,
          tasks: fallbackTasks ?? state.tasks,
          action: DailyTaskAction.none,
          activeTaskId: null,
          errorMessage:
              'The task was saved, but the list could not be refreshed. '
              'Pull to refresh and try again.',
          actionMessage: null,
          sessionInvalid:
              error is ApiException && error.type == ApiErrorType.unauthorized,
        ),
      );
    }
  }

  void _emitActionError(
    Emitter<DailyTasksState> emit,
    Object error,
    String fallback,
  ) {
    final isUnauthorized =
        error is ApiException && error.type == ApiErrorType.unauthorized;
    emit(
      state.copyWith(
        status: state.tasks.isEmpty
            ? DailyTasksStatus.failure
            : DailyTasksStatus.loaded,
        action: DailyTaskAction.none,
        activeTaskId: null,
        errorMessage: error is ApiException ? error.message : fallback,
        sessionInvalid: isUnauthorized,
      ),
    );
  }

  String _messageFor(Object error) {
    if (error is ApiException) return error.message;
    if (error is FormatException) return error.message;
    return 'Unable to load your daily tasks. Please try again.';
  }

  DateTime? get _requestDate =>
      _usesImplicitToday ? calendarDateOnly(DateTime.now()) : _selectedDate;
}
