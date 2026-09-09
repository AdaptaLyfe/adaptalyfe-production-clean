import 'package:equatable/equatable.dart';

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
  final String? busyAction;
  final String? errorMessage;
  final String? actionMessage;
  final bool sessionInvalid;

  bool get isLoading => status == CalendarStatus.loading;
  bool get hasData => appointments.isNotEmpty || calendarEvents.isNotEmpty;

  DateTime get selectedDate => currentDate ?? DateTime.now();

  CalendarState copyWith({
    CalendarStatus? status,
    DateTime? currentDate,
    CalendarView? view,
    List<AppointmentModel>? appointments,
    List<AppointmentModel>? upcomingAppointments,
    List<CalendarEventModel>? calendarEvents,
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
        busyAction,
        errorMessage,
        actionMessage,
        sessionInvalid,
      ];
}

const _notSet = Object();