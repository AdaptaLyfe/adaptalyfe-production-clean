import 'package:equatable/equatable.dart';

import '../models/caregiver_models.dart';

enum CaregiverStatus {
  initial,
  loading,
  loaded,
  failure,
}

class CaregiverState extends Equatable {
  const CaregiverState({
    this.status = CaregiverStatus.initial,
    this.invitations = const [],
    this.relationships = const [],
    this.recipients = const [],
    this.validatedInvitation,
    this.busyKey,
    this.errorMessage,
    this.validationError,
    this.actionMessage,
    this.sessionInvalid = false,
  });

  final CaregiverStatus status;
  final List<CaregiverInvitationModel> invitations;
  final List<CareRelationshipModel> relationships;
  final List<CareRecipientSummaryModel> recipients;
  final CaregiverInvitationModel? validatedInvitation;
  final String? busyKey;
  final String? errorMessage;
  final String? validationError;
  final String? actionMessage;
  final bool sessionInvalid;

  bool get isLoading => status == CaregiverStatus.loading;

  CaregiverState copyWith({
    CaregiverStatus? status,
    List<CaregiverInvitationModel>? invitations,
    List<CareRelationshipModel>? relationships,
    List<CareRecipientSummaryModel>? recipients,
    Object? validatedInvitation = _notSet,
    Object? busyKey = _notSet,
    Object? errorMessage = _notSet,
    Object? validationError = _notSet,
    Object? actionMessage = _notSet,
    bool? sessionInvalid,
  }) {
    return CaregiverState(
      status: status ?? this.status,
      invitations: invitations ?? this.invitations,
      relationships: relationships ?? this.relationships,
      recipients: recipients ?? this.recipients,
      validatedInvitation: identical(validatedInvitation, _notSet)
          ? this.validatedInvitation
          : validatedInvitation as CaregiverInvitationModel?,
      busyKey: identical(busyKey, _notSet) ? this.busyKey : busyKey as String?,
      errorMessage: identical(errorMessage, _notSet)
          ? this.errorMessage
          : errorMessage as String?,
      validationError: identical(validationError, _notSet)
          ? this.validationError
          : validationError as String?,
      actionMessage: identical(actionMessage, _notSet)
          ? this.actionMessage
          : actionMessage as String?,
      sessionInvalid: sessionInvalid ?? this.sessionInvalid,
    );
  }

  @override
  List<Object?> get props => [
        status,
        invitations,
        relationships,
        recipients,
        validatedInvitation,
        busyKey,
        errorMessage,
        validationError,
        actionMessage,
        sessionInvalid,
      ];
}

const _notSet = Object();