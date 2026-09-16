import 'package:equatable/equatable.dart';

import '../models/academic_models.dart';

sealed class AcademicEvent extends Equatable {
  const AcademicEvent();

  @override
  List<Object?> get props => [];
}

final class AcademicStarted extends AcademicEvent {
  const AcademicStarted();
}

final class RefreshAcademic extends AcademicEvent {
  const RefreshAcademic();
}

final class AddAcademicClass extends AcademicEvent {
  const AddAcademicClass(this.input);

  final AcademicClassInput input;

  @override
  List<Object?> get props => [input];
}

final class AddAssignment extends AcademicEvent {
  const AddAssignment(this.input);

  final AssignmentInput input;

  @override
  List<Object?> get props => [input];
}

final class AddStudyGroup extends AcademicEvent {
  const AddStudyGroup(this.input);

  final StudyGroupInput input;

  @override
  List<Object?> get props => [input];
}

enum AcademicAssignmentFilter {
  all,
  upcoming,
  overdue,
  inProgress,
  completed,
}

final class SetAssignmentFilter extends AcademicEvent {
  const SetAssignmentFilter(this.filter);

  final AcademicAssignmentFilter filter;

  @override
  List<Object?> get props => [filter];
}