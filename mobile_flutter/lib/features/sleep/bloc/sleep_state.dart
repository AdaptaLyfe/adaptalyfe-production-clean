import 'package:equatable/equatable.dart';

import '../models/sleep_models.dart';

enum SleepStatus {
  initial,
  loading,
  loaded,
  failure,
}

class SleepState extends Equatable {
  const SleepState({
    this.status = SleepStatus.initial,
    this.sessions = const [],
    this.selectedDate,
    this.dailySession,
    this.busyAction,
    this.errorMessage,
    this.actionMessage,
    this.sessionInvalid = false,
  });

  final SleepStatus status;
  final List<SleepSessionModel> sessions;
  final DateTime? selectedDate;
  final SleepSessionModel? dailySession;
  final String? busyAction;
  final String? errorMessage;
  final String? actionMessage;
  final bool sessionInvalid;

  bool get isLoading => status == SleepStatus.loading;
  bool get hasData => sessions.isNotEmpty;
  DateTime get activeDate => selectedDate ?? DateTime.now();

  SleepState copyWith({
    SleepStatus? status,
    List<SleepSessionModel>? sessions,
    DateTime? selectedDate,
    Object? dailySession = _notSet,
    Object? busyAction = _notSet,
    Object? errorMessage = _notSet,
    Object? actionMessage = _notSet,
    bool? sessionInvalid,
  }) {
    return SleepState(
      status: status ?? this.status,
      sessions: sessions ?? this.sessions,
      selectedDate: selectedDate ?? this.selectedDate,
      dailySession: identical(dailySession, _notSet)
          ? this.dailySession
          : dailySession as SleepSessionModel?,
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
        sessions,
        selectedDate,
        dailySession,
        busyAction,
        errorMessage,
        actionMessage,
        sessionInvalid,
      ];
}

const _notSet = Object();