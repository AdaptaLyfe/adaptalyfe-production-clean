import 'package:equatable/equatable.dart';

import '../models/medical_models.dart';

enum MedicalStatus {
  initial,
  loading,
  loaded,
  failure,
}

class MedicalState extends Equatable {
  const MedicalState({
    this.status = MedicalStatus.initial,
    this.conditions = const [],
    this.medications = const [],
    this.allergies = const [],
    this.emergencyContacts = const [],
    this.busySection,
    this.errorMessage,
    this.actionMessage,
    this.sessionInvalid = false,
  });

  final MedicalStatus status;
  final List<MedicalConditionModel> conditions;
  final List<MedicationModel> medications;
  final List<AllergyModel> allergies;
  final List<EmergencyContactModel> emergencyContacts;
  final String? busySection;
  final String? errorMessage;
  final String? actionMessage;
  final bool sessionInvalid;

  bool get isLoading => status == MedicalStatus.loading;
  bool get hasData =>
      conditions.isNotEmpty ||
      medications.isNotEmpty ||
      allergies.isNotEmpty ||
      emergencyContacts.isNotEmpty;

  MedicalState copyWith({
    MedicalStatus? status,
    List<MedicalConditionModel>? conditions,
    List<MedicationModel>? medications,
    List<AllergyModel>? allergies,
    List<EmergencyContactModel>? emergencyContacts,
    Object? busySection = _notSet,
    Object? errorMessage = _notSet,
    Object? actionMessage = _notSet,
    bool? sessionInvalid,
  }) {
    return MedicalState(
      status: status ?? this.status,
      conditions: conditions ?? this.conditions,
      medications: medications ?? this.medications,
      allergies: allergies ?? this.allergies,
      emergencyContacts: emergencyContacts ?? this.emergencyContacts,
      busySection: identical(busySection, _notSet)
          ? this.busySection
          : busySection as String?,
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
        conditions,
        medications,
        allergies,
        emergencyContacts,
        busySection,
        errorMessage,
        actionMessage,
        sessionInvalid,
      ];
}

const _notSet = Object();