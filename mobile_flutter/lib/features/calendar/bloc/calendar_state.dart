import 'package:equatable/equatable.dart';

import '../../daily_tasks/models/daily_task_model.dart';
import '../../financial/models/financial_models.dart';
import '../../mood/models/mood_entry_model.dart';
import '../models/calendar_models.dart';
import 'calendar_event.dart';

enum CalendarStatus {
  initial,
  loading,
  loaded,
  failure,
}

class CalendarState extends Equatable {
  const CalendarState({
    this.status = CalendarStatus.initial,
    this.currentDate,
    this.view = CalendarView.month,
    this.appointments = const [],
    this.upcomingAppointments = const [],
    this.calendarEvents = const [],
    this.tasks = const [],
    this.bills = const [],
    this.moodEntries = const [],
    this.busyAction,
    this.errorMessage,
    this.actionMessage,
    this.sessionInvalid = false,
  });

  final CalendarStatus status;
  final DateTime? currentDate;
  final CalendarView view;
  final List<AppointmentModel> appointments;
  final List<AppointmentModel> upcomingAppointments;
  final List<CalendarEventModel> calendarEvents;
  final List<DailyTaskModel> tasks;
  final List<BillModel> bills;
  final List<MoodEntryModel> moodEntries;
  final String? busyAction;
  final String? errorMessage;
  final String? actionMessage;
  final bool sessionInvalid;

  bool get isLoading => status == CalendarStatus.loading;
  bool get hasData =>
      appointments.isNotEmpty ||
      calendarEvents.isNotEmpty ||
      tasks.isNotEmpty ||
      bills.isNotEmpty ||
      moodEntries.isNotEmpty;

  DateTime get selectedDate => currentDate ?? DateTime.now();

  CalendarState copyWith({
    CalendarStatus? status,
    DateTime? currentDate,
    CalendarView? view,
    List<AppointmentModel>? appointments,
    List<AppointmentModel>? upcomingAppointments,
    List<CalendarEventModel>? calendarEvents,
    List<DailyTaskModel>? tasks,
    List<BillModel>? bills,
    List<MoodEntryModel>? moodEntries,
    Object? busyAction = _notSet,
    Object? errorMessage = _notSet,
    Object? actionMessage = _notSet,
    bool? sessionInvalid,
  }) {
    return CalendarState(
      status: status ?? this.status,
      currentDate: currentDate ?? this.currentDate,
      view: view ?? this.view,
      appointments: appointments ?? this.appointments,
      upcomingAppointments:
          upcomingAppointments ?? this.upcomingAppointments,
      calendarEvents: calendarEvents ?? this.calendarEvents,
      tasks: tasks ?? this.tasks,
      bills: bills ?? this.bills,
      moodEntries: moodEntries ?? this.moodEntries,
      busyAction: identical(busyAction, _notSet)
          ? this.busyAction
          : busyAction as String?,
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
        currentDate,
        view,
        appointments,
        upcomingAppointments,
        calendarEvents,
        tasks,
        bills,
        moodEntries,
        busyAction,
        errorMessage,
        actionMessage,
        sessionInvalid,
      ];
}

const _notSet = Object();