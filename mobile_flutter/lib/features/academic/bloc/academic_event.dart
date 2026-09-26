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

final class UpdateAssignment extends AcademicEvent {
  const UpdateAssignment(this.assignmentId, this.input);

  final int assignmentId;
  final AssignmentInput input;

  @override
  List<Object?> get props => [assignmentId, input];
}

final class DeleteAssignment extends AcademicEvent {
  const DeleteAssignment(this.assignmentId);

  final int assignmentId;

  @override
  List<Object?> get props => [assignmentId];
}

final class AddStudySession extends AcademicEvent {
  const AddStudySession(this.input);

  final StudySessionInput input;

  @override
  List<Object?> get props => [input];
}

final class CompleteStudySession extends AcademicEvent {
  const CompleteStudySession({
    required this.sessionId,
    this.effectiveness = 4,
  });

  final int sessionId;
  final int effectiveness;

  @override
  List<Object?> get props => [sessionId, effectiveness];
}

final class DeleteStudySession extends AcademicEvent {
  const DeleteStudySession(this.sessionId);

  final int sessionId;

  @override
  List<Object?> get props => [sessionId];
}

final class AddCampusLocation extends AcademicEvent {
  const AddCampusLocation(this.input);

  final CampusLocationInput input;

  @override
  List<Object?> get props => [input];
}

final class AddCampusTransport extends AcademicEvent {
  const AddCampusTransport(this.input);

  final CampusTransportInput input;

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