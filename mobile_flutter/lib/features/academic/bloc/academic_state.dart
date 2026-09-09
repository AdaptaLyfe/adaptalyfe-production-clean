import 'package:equatable/equatable.dart';

import '../models/academic_models.dart';
import 'academic_event.dart';

enum AcademicStatus {
  initial,
  loading,
  loaded,
  failure,
}

enum AcademicAction {
  none,
  addingClass,
  addingAssignment,
}

class AcademicState extends Equatable {
  const AcademicState({
    this.status = AcademicStatus.initial,
    this.classes = const [],
    this.assignments = const [],
    this.action = AcademicAction.none,
    this.assignmentFilter = AcademicAssignmentFilter.all,
    this.errorMessage,
    this.actionMessage,
    this.sessionInvalid = false,
  });

  final AcademicStatus status;
  final List<AcademicClassModel> classes;
  final List<AssignmentModel> assignments;
  final AcademicAction action;
  final AcademicAssignmentFilter assignmentFilter;
  final String? errorMessage;
  final String? actionMessage;
  final bool sessionInvalid;

  bool get isLoading => status == AcademicStatus.loading;
  bool get hasData => classes.isNotEmpty || assignments.isNotEmpty;

  AcademicState copyWith({
    AcademicStatus? status,
    List<AcademicClassModel>? classes,
    List<AssignmentModel>? assignments,
    AcademicAction? action,
    AcademicAssignmentFilter? assignmentFilter,
    Object? errorMessage = _notSet,
    Object? actionMessage = _notSet,
    bool? sessionInvalid,
  }) {
    return AcademicState(
      status: status ?? this.status,
      classes: classes ?? this.classes,
      assignments: assignments ?? this.assignments,
      action: action ?? this.action,
      assignmentFilter: assignmentFilter ?? this.assignmentFilter,
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
        classes,
        assignments,
        action,
        assignmentFilter,
        errorMessage,
        actionMessage,
        sessionInvalid,
      ];
}

const _notSet = Object();