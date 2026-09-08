import 'package:flutter_bloc/flutter_bloc.dart';

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

  Future<void> _loadTasks(
    DailyTasksEvent event,
    Emitter<DailyTasksState> emit,
  ) async {
    emit(
      state.copyWith(
        status: DailyTasksStatus.loading,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );

    try {
      final tasks = await repository.getTasks();
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
      await repository.createTask(event.input);
      await _reloadAfterMutation(
        emit,
        successMessage: 'New task added to your daily list.',
      );
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
      await repository.updateTask(event.taskId, event.input);
      await _reloadAfterMutation(
        emit,
        successMessage: 'Your task has been updated successfully.',
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
      );
    } catch (error) {
      _emitActionError(emit, error, 'Failed to delete task. Please try again.');
    }
  }

  Future<void> _toggleTask(
    ToggleDailyTask event,
    Emitter<DailyTasksState> emit,
  ) async {
    emit(
      state.copyWith(
        action: DailyTaskAction.completing,
        activeTaskId: event.taskId,
        errorMessage: null,
        actionMessage: null,
      ),
    );

    try {
      await repository.updateCompletion(event.taskId, event.isCompleted);
      await _reloadAfterMutation(
        emit,
        successMessage: event.isCompleted
            ? 'Great job staying on track!'
            : 'Task marked as incomplete.',
      );
    } catch (error) {
      _emitActionError(emit, error, 'Failed to update task. Please try again.');
    }
  }

  Future<void> _reloadAfterMutation(
    Emitter<DailyTasksState> emit, {
    required String successMessage,
  }) async {
    final tasks = await repository.getTasks();
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
}