import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../data/sleep_repository.dart';
import '../models/sleep_models.dart';
import '../sleep_validation.dart';
import 'sleep_event.dart';
import 'sleep_state.dart';

class SleepBloc extends Bloc<SleepEvent, SleepState> {
  SleepBloc(this.repository)
      : super(SleepState(selectedDate: _dateOnlyValue(DateTime.now()))) {
    on<SleepStarted>(_onStarted);
    on<RefreshSleep>(_onRefresh);
    on<SleepLogOpened>(_onLogOpened);
    on<SleepDateSelected>(_onDateSelected);
    on<AddSleepSession>(_onAdd);
    on<UpdateSleepSession>(_onUpdate);
    on<DeleteSleepSession>(_onDelete);
  }

  final SleepRepository repository;
  bool _hasExplicitDateSelection = false;

  Future<void> _onStarted(
    SleepStarted event,
    Emitter<SleepState> emit,
  ) async {
    if (state.status == SleepStatus.loaded) return;
    await _load(emit);
  }

  Future<void> _onRefresh(
    RefreshSleep event,
    Emitter<SleepState> emit,
  ) async {
    await _load(emit, keepData: state.hasData);
  }

  void _onLogOpened(
    SleepLogOpened event,
    Emitter<SleepState> emit,
  ) {
    _hasExplicitDateSelection = false;
    emit(
      state.copyWith(
        selectedDate: _dateOnlyValue(DateTime.now()),
        dailySession: null,
        busyAction: null,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );
  }

  Future<void> _onDateSelected(
    SleepDateSelected event,
    Emitter<SleepState> emit,
  ) async {
    final date = _dateOnlyValue(event.date);
    _hasExplicitDateSelection = true;
    emit(
      state.copyWith(
        selectedDate: date,
        dailySession: null,
        busyAction: 'load-date',
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );
    try {
      final session = await _getSessionOrNull(date);
      emit(
        state.copyWith(
          dailySession: session,
          busyAction: null,
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } catch (error) {
      _emitFailure(emit, error, keepData: state.hasData, busyAction: null);
    }
  }

  Future<void> _onAdd(
    AddSleepSession event,
    Emitter<SleepState> emit,
  ) async {
    final validationError = _validateInput(event.input);
    if (validationError != null) {
      _emitValidationError(emit, validationError);
      return;
    }
    try {
      final existing =
          await _getSessionOrNull(_parseDateOnly(event.input.sleepDate));
      if (existing != null) {
        _hasExplicitDateSelection = true;
        emit(
          state.copyWith(
            selectedDate: _parseDateOnly(event.input.sleepDate),
            dailySession: existing,
            busyAction: null,
            errorMessage:
                'A sleep log already exists for this date. It is ready to edit.',
            actionMessage: null,
            sessionInvalid: false,
          ),
        );
        return;
      }
    } catch (error) {
      _emitFailure(emit, error, keepData: state.hasData, busyAction: null);
      return;
    }
    _hasExplicitDateSelection = true;
    await _runMutation(
      emit,
      action: 'add',
      successMessage: 'Sleep session saved successfully!',
      operation: () => repository.createSession(event.input),
    );
  }

  Future<void> _onUpdate(
    UpdateSleepSession event,
    Emitter<SleepState> emit,
  ) async {
    final validationError = _validateInput(event.input);
    if (validationError != null) {
      _emitValidationError(emit, validationError);
      return;
    }
    await _runMutation(
      emit,
      action: 'update',
      successMessage: 'Sleep session saved successfully!',
      operation: () => repository.updateSession(event.id, event.input),
    );
  }

  Future<void> _onDelete(
    DeleteSleepSession event,
    Emitter<SleepState> emit,
  ) async {
    await _runMutation(
      emit,
      action: 'delete',
      successMessage:
          'Sleep log deleted. The sleep log was permanently deleted.',
      operation: () => repository.deleteSession(event.id),
    );
  }

  Future<void> _load(
    Emitter<SleepState> emit, {
    bool keepData = false,
  }) async {
    emit(
      state.copyWith(
        status: keepData ? SleepStatus.loaded : SleepStatus.loading,
        busyAction: null,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );
    try {
      final sessions = await repository.getSessions();
      final dailySession = _hasExplicitDateSelection
          ? await _getSessionOrNull(state.activeDate)
          : null;
      emit(
        state.copyWith(
          status: SleepStatus.loaded,
          sessions: sessions,
          dailySession: dailySession,
          busyAction: null,
          errorMessage: null,
          actionMessage: null,
          sessionInvalid: false,
        ),
      );
    } catch (error) {
      _emitFailure(emit, error, keepData: keepData, busyAction: null);
    }
  }

  Future<SleepSessionModel?> _getSessionOrNull(DateTime date) async {
    try {
      return await repository.getSessionByDate(_dateOnly(date));
    } on ApiException catch (error) {
      if (error.type == ApiErrorType.notFound) return null;
      rethrow;
    }
  }

  Future<void> _runMutation(
    Emitter<SleepState> emit, {
    required String action,
    required String successMessage,
    required Future<Object?> Function() operation,
  }) async {
    emit(
      state.copyWith(
        busyAction: action,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );
    try {
      await operation();
      final sessions = await repository.getSessions();
      final dailySession = await _getSessionOrNull(state.activeDate);
      emit(
        state.copyWith(
          status: SleepStatus.loaded,
          sessions: sessions,
          dailySession: dailySession,
          busyAction: null,
          actionMessage: successMessage,
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } catch (error) {
      _emitFailure(
        emit,
        error,
        keepData: true,
        busyAction: null,
        fallbackMessage: action == 'delete'
            ? 'Failed to delete sleep log. Please try again.'
            : 'Failed to save sleep session',
      );
    }
  }

  void _emitFailure(
    Emitter<SleepState> emit,
    Object error, {
    required bool keepData,
    String? busyAction,
    String? fallbackMessage,
  }) {
    final unauthorized =
        error is ApiException && error.type == ApiErrorType.unauthorized;
    emit(
      state.copyWith(
        status: keepData ? SleepStatus.loaded : SleepStatus.failure,
        busyAction: busyAction,
        errorMessage: fallbackMessage ?? _messageFor(error),
        actionMessage: null,
        sessionInvalid: unauthorized,
      ),
    );
  }

  String _messageFor(Object error) {
    if (error is ApiException) return error.message;
    if (error is FormatException) return error.message;
    return 'Unable to load sleep data. Please try again.';
  }

  String? _validateInput(SleepSessionInput input) {
    return sleepDateValidationError(input.sleepDate) ??
        sleepRoutineValidationError(
          input.bedtime,
          input.sleepTime,
          input.wakeTime,
        );
  }

  void _emitValidationError(
    Emitter<SleepState> emit,
    String message,
  ) {
    emit(
      state.copyWith(
        status: state.hasData ? SleepStatus.loaded : SleepStatus.failure,
        busyAction: null,
        errorMessage: message,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );
  }

  String _dateOnly(DateTime date) =>
      '${date.year.toString().padLeft(4, '0')}-'
      '${date.month.toString().padLeft(2, '0')}-'
      '${date.day.toString().padLeft(2, '0')}';

  DateTime _parseDateOnly(String value) {
    final parts = value.split('-').map(int.parse).toList();
    return DateTime(parts[0], parts[1], parts[2]);
  }

  static DateTime _dateOnlyValue(DateTime date) =>
      DateTime(date.year, date.month, date.day);
}