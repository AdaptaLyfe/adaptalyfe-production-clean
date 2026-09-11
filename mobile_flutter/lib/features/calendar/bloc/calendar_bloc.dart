import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../../daily_tasks/models/daily_task_model.dart';
import '../../financial/models/financial_models.dart';
import '../../mood/models/mood_entry_model.dart';
import '../data/calendar_repository.dart';
import '../models/calendar_models.dart';
import 'calendar_event.dart';
import 'calendar_state.dart';

class CalendarBloc extends Bloc<CalendarEvent, CalendarState> {
  CalendarBloc(this.repository)
      : super(CalendarState(currentDate: DateTime.now())) {
    on<CalendarStarted>(_onStarted);
    on<RefreshCalendar>(_onRefresh);
    on<CalendarViewChanged>(
      (event, emit) => emit(state.copyWith(view: event.view)),
    );
    on<CalendarDateChanged>(
      (event, emit) => emit(state.copyWith(currentDate: event.date)),
    );
    on<CalendarNavigate>(_onNavigate);
    on<AddAppointment>(_onAddAppointment);
    on<CompleteAppointment>(_onCompleteAppointment);
    on<AddCalendarEvent>(_onAddCalendarEvent);
    on<EditCalendarEvent>(_onEditCalendarEvent);
    on<DeleteCalendarEvent>(_onDeleteCalendarEvent);
  }

  final CalendarRepository repository;

  Future<void> _onStarted(
    CalendarStarted event,
    Emitter<CalendarState> emit,
  ) async {
    if (state.status == CalendarStatus.loaded) return;
    await _load(emit);
  }

  Future<void> _onRefresh(
    RefreshCalendar event,
    Emitter<CalendarState> emit,
  ) async {
    await _load(emit, keepData: state.hasData);
  }

  void _onNavigate(
    CalendarNavigate event,
    Emitter<CalendarState> emit,
  ) {
    final current = state.selectedDate;
    final amount = event.direction == CalendarNavigationDirection.next ? 1 : -1;
    final next = DateTime(
      current.year,
      current.month,
      current.day + switch (state.view) {
        CalendarView.month => 0,
        CalendarView.week => 7 * amount,
        CalendarView.day => amount,
      },
    );

    if (state.view == CalendarView.month) {
      emit(
        state.copyWith(
          currentDate: DateTime(current.year, current.month + amount, 1),
        ),
      );
      return;
    }
    emit(state.copyWith(currentDate: next));
  }

  Future<void> _onAddAppointment(
    AddAppointment event,
    Emitter<CalendarState> emit,
  ) async {
    await _runMutation(
      emit,
      action: 'add-appointment',
      successMessage: 'Appointment scheduled successfully.',
      operation: () async {
        await repository.createAppointment(event.input);
      },
    );
  }

  Future<void> _onCompleteAppointment(
    CompleteAppointment event,
    Emitter<CalendarState> emit,
  ) async {
    await _runMutation(
      emit,
      action: 'complete-appointment',
      successMessage: event.isCompleted
          ? 'Appointment marked complete.'
          : 'Appointment marked incomplete.',
      operation: () async {
        await repository.updateAppointmentCompletion(
          event.id,
          event.isCompleted,
        );
      },
    );
  }

  Future<void> _onAddCalendarEvent(
    AddCalendarEvent event,
    Emitter<CalendarState> emit,
  ) async {
    await _runMutation(
      emit,
      action: 'add-event',
      successMessage: 'Event created successfully.',
      operation: () async {
        await repository.createCalendarEvent(event.input);
      },
    );
  }

  Future<void> _onEditCalendarEvent(
    EditCalendarEvent event,
    Emitter<CalendarState> emit,
  ) async {
    await _runMutation(
      emit,
      action: 'edit-event',
      successMessage: 'Event updated successfully.',
      operation: () async {
        await repository.updateCalendarEvent(event.id, event.input);
      },
    );
  }

  Future<void> _onDeleteCalendarEvent(
    DeleteCalendarEvent event,
    Emitter<CalendarState> emit,
  ) async {
    await _runMutation(
      emit,
      action: 'delete-event',
      successMessage: 'Event deleted successfully.',
      operation: () async {
        await repository.deleteCalendarEvent(event.id);
      },
    );
  }

  Future<void> _load(
    Emitter<CalendarState> emit, {
    bool keepData = false,
  }) async {
    emit(
      state.copyWith(
        status: keepData ? CalendarStatus.loaded : CalendarStatus.loading,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );

    try {
      final results = await Future.wait<Object>([
        repository.getAppointments(),
        repository.getCalendarEvents(),
        repository.getDailyTasks(),
        repository.getBills(),
        repository.getMoodEntries(),
      ]);
      final appointments = results[0] as List<AppointmentModel>;
      emit(
        state.copyWith(
          status: CalendarStatus.loaded,
          appointments: appointments,
          upcomingAppointments: _upcomingAppointments(appointments),
          calendarEvents: results[1] as List<CalendarEventModel>,
          tasks: results[2] as List<DailyTaskModel>,
          bills: results[3] as List<BillModel>,
          moodEntries: results[4] as List<MoodEntryModel>,
          busyAction: null,
          errorMessage: null,
          actionMessage: null,
          sessionInvalid: false,
        ),
      );
    } catch (error) {
      _emitFailure(emit, error, keepData: keepData);
    }
  }

  Future<void> _runMutation(
    Emitter<CalendarState> emit, {
    required String action,
    required String successMessage,
    required Future<void> Function() operation,
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
      final results = await Future.wait<Object>([
        repository.getAppointments(),
        repository.getCalendarEvents(),
        repository.getDailyTasks(),
        repository.getBills(),
        repository.getMoodEntries(),
      ]);
      final appointments = results[0] as List<AppointmentModel>;
      emit(
        state.copyWith(
          status: CalendarStatus.loaded,
          appointments: appointments,
          upcomingAppointments: _upcomingAppointments(appointments),
          calendarEvents: results[1] as List<CalendarEventModel>,
          tasks: results[2] as List<DailyTaskModel>,
          bills: results[3] as List<BillModel>,
          moodEntries: results[4] as List<MoodEntryModel>,
          busyAction: null,
          actionMessage: successMessage,
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } catch (error) {
      _emitFailure(emit, error, keepData: true, busyAction: null);
    }
  }

  void _emitFailure(
    Emitter<CalendarState> emit,
    Object error, {
    required bool keepData,
    String? busyAction,
  }) {
    final unauthorized =
        error is ApiException && error.type == ApiErrorType.unauthorized;
    emit(
      state.copyWith(
        status: keepData ? CalendarStatus.loaded : CalendarStatus.failure,
        busyAction: busyAction,
        errorMessage: _messageFor(error),
        actionMessage: null,
        sessionInvalid: unauthorized,
      ),
    );
  }

  String _messageFor(Object error) {
    if (error is ApiException) return error.message;
    if (error is FormatException) return error.message;
    return 'Unable to load calendar data. Please try again.';
  }

  List<AppointmentModel> _upcomingAppointments(
    List<AppointmentModel> appointments,
  ) {
    final now = DateTime.now();
    return appointments
        .where(
          (appointment) =>
              !appointment.isCompleted &&
              !appointment.appointmentDate.isBefore(now),
        )
        .toList()
      ..sort((a, b) => a.appointmentDate.compareTo(b.appointmentDate));
  }
}