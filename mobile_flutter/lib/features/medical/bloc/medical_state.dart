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
    this.pharmacies = const [],
    this.userPharmacies = const [],
    this.medicationsDue = const [],
    this.refillOrders = const [],
    this.allergies = const [],
    this.emergencyContacts = const [],
    this.adverseMedications = const [],
    this.primaryCareProviders = const [],
    this.symptomEntries = const [],
    this.busySection,
    this.errorMessage,
    this.actionMessage,
    this.collectionErrors = const {},
    this.sessionInvalid = false,
  });

  final MedicalStatus status;
  final List<MedicalConditionModel> conditions;
  final List<MedicationModel> medications;
  final List<PharmacyModel> pharmacies;
  final List<UserPharmacyModel> userPharmacies;
  final List<MedicationModel> medicationsDue;
  final List<RefillOrderModel> refillOrders;
  final List<AllergyModel> allergies;
  final List<EmergencyContactModel> emergencyContacts;
  final List<AdverseMedicationModel> adverseMedications;
  final List<PrimaryCareProviderModel> primaryCareProviders;
  final List<SymptomEntryModel> symptomEntries;
  final String? busySection;
  final String? errorMessage;
  final String? actionMessage;
  final Map<String, String> collectionErrors;
  final bool sessionInvalid;

  bool get isLoading => status == MedicalStatus.loading;
  bool get hasData =>
      conditions.isNotEmpty ||
      medications.isNotEmpty ||
      pharmacies.isNotEmpty ||
      userPharmacies.isNotEmpty ||
      medicationsDue.isNotEmpty ||
      refillOrders.isNotEmpty ||
      allergies.isNotEmpty ||
      emergencyContacts.isNotEmpty ||
      adverseMedications.isNotEmpty ||
      primaryCareProviders.isNotEmpty ||
      symptomEntries.isNotEmpty;

  MedicalState copyWith({
    MedicalStatus? status,
    List<MedicalConditionModel>? conditions,
    List<MedicationModel>? medications,
    List<PharmacyModel>? pharmacies,
    List<UserPharmacyModel>? userPharmacies,
    List<MedicationModel>? medicationsDue,
    List<RefillOrderModel>? refillOrders,
    List<AllergyModel>? allergies,
    List<EmergencyContactModel>? emergencyContacts,
    List<AdverseMedicationModel>? adverseMedications,
    List<PrimaryCareProviderModel>? primaryCareProviders,
    List<SymptomEntryModel>? symptomEntries,
    Object? busySection = _notSet,
    Object? errorMessage = _notSet,
    Object? actionMessage = _notSet,
    Map<String, String>? collectionErrors,
    bool? sessionInvalid,
  }) {
    return MedicalState(
      status: status ?? this.status,
      conditions: conditions ?? this.conditions,
      medications: medications ?? this.medications,
      pharmacies: pharmacies ?? this.pharmacies,
      userPharmacies: userPharmacies ?? this.userPharmacies,
      medicationsDue: medicationsDue ?? this.medicationsDue,
      refillOrders: refillOrders ?? this.refillOrders,
      allergies: allergies ?? this.allergies,
      emergencyContacts: emergencyContacts ?? this.emergencyContacts,
      adverseMedications: adverseMedications ?? this.adverseMedications,
      primaryCareProviders: primaryCareProviders ?? this.primaryCareProviders,
      symptomEntries: symptomEntries ?? this.symptomEntries,
      busySection: identical(busySection, _notSet)
          ? this.busySection
          : busySection as String?,
      errorMessage: identical(errorMessage, _notSet)
          ? this.errorMessage
          : errorMessage as String?,
      actionMessage: identical(actionMessage, _notSet)
          ? this.actionMessage
          : actionMessage as String?,
      collectionErrors: collectionErrors ?? this.collectionErrors,
      sessionInvalid: sessionInvalid ?? this.sessionInvalid,
    );
  }

  @override
  List<Object?> get props => [
        status,
        conditions,
        medications,
        pharmacies,
        userPharmacies,
        medicationsDue,
        refillOrders,
        allergies,
        emergencyContacts,
        adverseMedications,
        primaryCareProviders,
        symptomEntries,
        busySection,
        errorMessage,
        actionMessage,
    collectionErrors,
        sessionInvalid,
      ];
}

const _notSet = Object();