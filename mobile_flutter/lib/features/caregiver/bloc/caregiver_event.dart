import 'package:equatable/equatable.dart';

import '../models/caregiver_models.dart';

sealed class CaregiverEvent extends Equatable {
  const CaregiverEvent();

  @override
  List<Object?> get props => [];
}

final class CaregiverStarted extends CaregiverEvent {
  const CaregiverStarted(this.userId);

  final int userId;

  @override
  List<Object?> get props => [userId];
}

final class RefreshCaregiver extends CaregiverEvent {
  const RefreshCaregiver(this.userId);

  final int userId;

  @override
  List<Object?> get props => [userId];
}

final class CreateCaregiverInvitation extends CaregiverEvent {
  const CreateCaregiverInvitation(this.input);

  final CaregiverInvitationInput input;

  @override
  List<Object?> get props => [input];
}

final class DeleteCaregiverInvitation extends CaregiverEvent {
  const DeleteCaregiverInvitation(this.id);

  final int id;

  @override
  List<Object?> get props => [id];
}

final class ValidateCaregiverInvitation extends CaregiverEvent {
  const ValidateCaregiverInvitation(this.code);

  final String code;

  @override
  List<Object?> get props => [code];
}

final class ClearCaregiverInvitationValidation extends CaregiverEvent {
  const ClearCaregiverInvitationValidation();
}

final class AcceptCaregiverInvitation extends CaregiverEvent {
  const AcceptCaregiverInvitation({
    required this.code,
    required this.userId,
  });

  final String code;
  final int userId;

  @override
  List<Object?> get props => [code, userId];
}

final class RemoveCareRelationship extends CaregiverEvent {
  const RemoveCareRelationship(this.id);

  final int id;

  @override
  List<Object?> get props => [id];
}

final class LoadCareRecipients extends CaregiverEvent {
  const LoadCareRecipients();
}