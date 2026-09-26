import '../models/calendar_models.dart';

sealed class CalendarEvent {
  const CalendarEvent();
}

class CalendarStarted extends CalendarEvent {
  const CalendarStarted();
}

class RefreshCalendar extends CalendarEvent {
  const RefreshCalendar();
}

class CalendarViewChanged extends CalendarEvent {
  const CalendarViewChanged(this.view);

  final CalendarView view;
}

class CalendarDateChanged extends CalendarEvent {
  const CalendarDateChanged(this.date);

  final DateTime date;
}

class CalendarNavigate extends CalendarEvent {
  const CalendarNavigate(this.direction);

  final CalendarNavigationDirection direction;
}

class AddAppointment extends CalendarEvent {
  const AddAppointment(this.input);

  final AppointmentInput input;
}

class CompleteAppointment extends CalendarEvent {
  const CompleteAppointment({
    required this.id,
    required this.isCompleted,
  });

  final int id;
  final bool isCompleted;
}

class AddCalendarEvent extends CalendarEvent {
  const AddCalendarEvent(this.input);

  final CalendarEventInput input;
}

class EditCalendarEvent extends CalendarEvent {
  const EditCalendarEvent({
    required this.id,
    required this.input,
  });

  final int id;
  final CalendarEventInput input;
}

class DeleteCalendarEvent extends CalendarEvent {
  const DeleteCalendarEvent(this.id);

  final int id;
}

enum CalendarView {
  month,
  week,
  day,
}

enum CalendarNavigationDirection {
  previous,
  next,
}