import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../data/medical_repository.dart';
import '../models/medical_models.dart';
import 'medical_event.dart';
import 'medical_state.dart';

class MedicalBloc extends Bloc<MedicalEvent, MedicalState> {
  MedicalBloc(this.repository) : super(const MedicalState()) {
    on<MedicalStarted>(_loadMedical);
    on<RefreshMedical>(_loadMedical);
    on<AddCondition>((event, emit) => _runMutation(
          emit,
          action: 'condition',
          successMessage: 'Condition added successfully.',
          operation: () => repository.createCondition(event.input),
        ));
    on<EditCondition>((event, emit) => _runMutation(
          emit,
          action: 'condition',
          successMessage: 'Condition updated successfully.',
          operation: () => repository.updateCondition(event.id, event.input),
        ));
    on<DeleteCondition>((event, emit) => _runMutation(
          emit,
          action: 'condition',
          successMessage: 'Condition deleted successfully.',
          operation: () async {
            await repository.deleteCondition(event.id);
            return null;
          },
        ));
    on<AddMedication>((event, emit) => _runMutation(
          emit,
          action: 'medication',
          successMessage: 'Medication added successfully.',
          operation: () => repository.createMedication(event.input),
        ));
    on<AddAllergy>((event, emit) => _runMutation(
          emit,
          action: 'allergy',
          successMessage: 'Sensitivity added successfully.',
          operation: () => repository.createAllergy(event.input),
        ));
    on<EditAllergy>((event, emit) => _runMutation(
          emit,
          action: 'allergy',
          successMessage: 'Sensitivity updated successfully.',
          operation: () => repository.updateAllergy(event.id, event.input),
        ));
    on<DeleteAllergy>((event, emit) => _runMutation(
          emit,
          action: 'allergy',
          successMessage: 'Sensitivity deleted successfully.',
          operation: () async {
            await repository.deleteAllergy(event.id);
            return null;
          },
        ));
    on<AddEmergencyContact>((event, emit) => _runMutation(
          emit,
          action: 'contact',
          successMessage: 'Trusted contact added successfully.',
          operation: () => repository.createEmergencyContact(event.input),
        ));
    on<EditEmergencyContact>((event, emit) => _runMutation(
          emit,
          action: 'contact',
          successMessage: 'Trusted contact updated successfully.',
          operation: () =>
              repository.updateEmergencyContact(event.id, event.input),
        ));
    on<DeleteEmergencyContact>((event, emit) => _runMutation(
          emit,
          action: 'contact',
          successMessage: 'Trusted contact deleted successfully.',
          operation: () async {
            await repository.deleteEmergencyContact(event.id);
            return null;
          },
        ));
    on<AddAdverseMedication>((event, emit) => _runMutation(
          emit,
          action: 'reaction',
          successMessage: 'Reaction added successfully.',
          operation: () => repository.createAdverseMedication(event.input),
        ));
    on<EditAdverseMedication>((event, emit) => _runMutation(
          emit,
          action: 'reaction',
          successMessage: 'Reaction updated successfully.',
          operation: () =>
              repository.updateAdverseMedication(event.id, event.input),
        ));
    on<DeleteAdverseMedication>((event, emit) => _runMutation(
          emit,
          action: 'reaction',
          successMessage: 'Reaction deleted successfully.',
          operation: () async {
            await repository.deleteAdverseMedication(event.id);
            return null;
          },
        ));
    on<AddPrimaryCareProvider>((event, emit) => _runMutation(
          emit,
          action: 'provider',
          successMessage: 'Healthcare contact added successfully.',
          operation: () => repository.createPrimaryCareProvider(event.input),
        ));
    on<EditPrimaryCareProvider>((event, emit) => _runMutation(
          emit,
          action: 'provider',
          successMessage: 'Healthcare contact updated successfully.',
          operation: () =>
              repository.updatePrimaryCareProvider(event.id, event.input),
        ));
    on<DeletePrimaryCareProvider>((event, emit) => _runMutation(
          emit,
          action: 'provider',
          successMessage: 'Healthcare contact deleted successfully.',
          operation: () async {
            await repository.deletePrimaryCareProvider(event.id);
            return null;
          },
        ));
    on<AddSymptomEntry>((event, emit) => _runMutation(
          emit,
          action: 'symptom',
          successMessage: 'Personal note added successfully.',
          operation: () => repository.createSymptomEntry(event.input),
        ));
    on<EditSymptomEntry>((event, emit) => _runMutation(
          emit,
          action: 'symptom',
          successMessage: 'Personal note updated successfully.',
          operation: () => repository.updateSymptomEntry(event.id, event.input),
        ));
    on<DeleteSymptomEntry>((event, emit) => _runMutation(
          emit,
          action: 'symptom',
          successMessage: 'Personal note deleted successfully.',
          operation: () async {
            await repository.deleteSymptomEntry(event.id);
            return null;
          },
        ));
  }

  final MedicalRepository repository;

  Future<void> _loadMedical(
    MedicalEvent event,
    Emitter<MedicalState> emit,
  ) async {
    emit(
      state.copyWith(
        status: MedicalStatus.loading,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );
    try {
      final snapshot = await _fetchAll();
      _emitSnapshot(emit, snapshot);
    } catch (error) {
      _emitFailure(emit, error);
    }
  }

  Future<void> _runMutation(
    Emitter<MedicalState> emit, {
    required String action,
    required String successMessage,
    required Future<Object?> Function() operation,
  }) async {
    emit(
      state.copyWith(
        busySection: action,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );
    try {
      await operation();
      final snapshot = await _fetchAll();
      _emitSnapshot(
        emit,
        snapshot,
        actionMessage: successMessage,
      );
    } catch (error) {
      _emitFailure(emit, error, keepLoadedState: true);
    }
  }

  Future<
      (
        List<MedicalConditionModel>,
        List<MedicationModel>,
        List<AllergyModel>,
        List<EmergencyContactModel>,
        List<AdverseMedicationModel>,
        List<PrimaryCareProviderModel>,
        List<SymptomEntryModel>
      )> _fetchAll() async {
    final results = await Future.wait([
      repository.getConditions(),
      repository.getMedications(),
      repository.getAllergies(),
      repository.getEmergencyContacts(),
      repository.getAdverseMedications(),
      repository.getPrimaryCareProviders(),
      repository.getSymptomEntries(),
    ]);
    return (
      results[0] as List<MedicalConditionModel>,
      results[1] as List<MedicationModel>,
      results[2] as List<AllergyModel>,
      results[3] as List<EmergencyContactModel>,
      results[4] as List<AdverseMedicationModel>,
      results[5] as List<PrimaryCareProviderModel>,
      results[6] as List<SymptomEntryModel>,
    );
  }

  void _emitSnapshot(
    Emitter<MedicalState> emit,
    (
      List<MedicalConditionModel>,
      List<MedicationModel>,
      List<AllergyModel>,
        List<EmergencyContactModel>,
        List<AdverseMedicationModel>,
        List<PrimaryCareProviderModel>,
        List<SymptomEntryModel>
    ) snapshot, {
    String? actionMessage,
  }) {
    emit(
      state.copyWith(
        status: MedicalStatus.loaded,
        conditions: snapshot.$1,
        medications: snapshot.$2,
        allergies: snapshot.$3,
        emergencyContacts: snapshot.$4,
        adverseMedications: snapshot.$5,
        primaryCareProviders: snapshot.$6,
        symptomEntries: snapshot.$7,
        busySection: null,
        errorMessage: null,
        actionMessage: actionMessage,
        sessionInvalid: false,
      ),
    );
  }

  void _emitFailure(
    Emitter<MedicalState> emit,
    Object error, {
    bool keepLoadedState = false,
  }) {
    final message = error is ApiException
        ? error.message
        : error is FormatException
            ? error.message
            : 'Unable to load medical records. Please try again.';
    emit(
      state.copyWith(
        status: keepLoadedState || state.hasData
            ? MedicalStatus.loaded
            : MedicalStatus.failure,
        busySection: null,
        errorMessage: message,
        sessionInvalid:
            error is ApiException && error.type == ApiErrorType.unauthorized,
      ),
    );
  }
}