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
          successMessage: 'Note added successfully.',
          operation: () => repository.createCondition(event.input),
        ));
    on<EditCondition>((event, emit) => _runMutation(
          emit,
          action: 'condition',
          successMessage: 'Note updated successfully.',
          operation: () => repository.updateCondition(event.id, event.input),
        ));
    on<DeleteCondition>((event, emit) => _runMutation(
          emit,
          action: 'condition',
          successMessage: 'Note deleted successfully.',
          deletedId: event.id,
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
          deletedId: event.id,
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
          deletedId: event.id,
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
          deletedId: event.id,
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
          deletedId: event.id,
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
          deletedId: event.id,
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
    int? deletedId,
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
      final result = await operation();
      _emitMutationSuccess(
        emit,
        action: action,
        result: result,
        deletedId: deletedId,
        successMessage: successMessage,
      );
    } catch (error) {
      _emitFailure(emit, error, keepLoadedState: true);
    }
  }

  Future<
      (
        List<MedicalConditionModel>,
        List<AllergyModel>,
        List<EmergencyContactModel>,
        List<AdverseMedicationModel>,
        List<PrimaryCareProviderModel>,
        List<SymptomEntryModel>
      )> _fetchAll() async {
    final results = await Future.wait([
      repository.getConditions(),
      repository.getAllergies(),
      repository.getEmergencyContacts(),
      repository.getAdverseMedications(),
      repository.getPrimaryCareProviders(),
      repository.getSymptomEntries(),
    ]);
    return (
      results[0] as List<MedicalConditionModel>,
      results[1] as List<AllergyModel>,
      results[2] as List<EmergencyContactModel>,
      results[3] as List<AdverseMedicationModel>,
      results[4] as List<PrimaryCareProviderModel>,
      results[5] as List<SymptomEntryModel>,
    );
  }

  void _emitSnapshot(
    Emitter<MedicalState> emit,
    (
      List<MedicalConditionModel>,
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
        allergies: snapshot.$2,
        emergencyContacts: snapshot.$3,
        adverseMedications: snapshot.$4,
        primaryCareProviders: snapshot.$5,
        symptomEntries: snapshot.$6,
        busySection: null,
        errorMessage: null,
        actionMessage: actionMessage,
        sessionInvalid: false,
      ),
    );
  }

  void _emitMutationSuccess(
    Emitter<MedicalState> emit, {
    required String action,
    required Object? result,
    required int? deletedId,
    required String successMessage,
  }) {
    final baseState = state.copyWith(
      status: MedicalStatus.loaded,
      busySection: null,
      errorMessage: null,
      actionMessage: successMessage,
      sessionInvalid: false,
    );

    switch (action) {
      case 'condition':
        emit(
          baseState.copyWith(
            conditions: _replaceOrRemove(
              state.conditions,
              result,
              deletedId,
              (item) => item.id,
            ),
          ),
        );
      case 'medication':
        emit(
          baseState.copyWith(
            medications: _replaceOrRemove(
              state.medications,
              result,
              deletedId,
              (item) => item.id,
            ),
          ),
        );
      case 'allergy':
        emit(
          baseState.copyWith(
            allergies: _replaceOrRemove(
              state.allergies,
              result,
              deletedId,
              (item) => item.id,
            ),
          ),
        );
      case 'contact':
        emit(
          baseState.copyWith(
            emergencyContacts: _replaceOrRemove(
              state.emergencyContacts,
              result,
              deletedId,
              (item) => item.id,
            ),
          ),
        );
      case 'reaction':
        emit(
          baseState.copyWith(
            adverseMedications: _replaceOrRemove(
              state.adverseMedications,
              result,
              deletedId,
              (item) => item.id,
            ),
          ),
        );
      case 'provider':
        emit(
          baseState.copyWith(
            primaryCareProviders: _replaceOrRemove(
              state.primaryCareProviders,
              result,
              deletedId,
              (item) => item.id,
            ),
          ),
        );
      case 'symptom':
        emit(
          baseState.copyWith(
            symptomEntries: _replaceOrRemove(
              state.symptomEntries,
              result,
              deletedId,
              (item) => item.id,
            ),
          ),
        );
    }
  }

  List<T> _replaceOrRemove<T>(
    List<T> current,
    Object? result,
    int? deletedId,
    int Function(T item) idOf,
  ) {
    if (result is T) {
      final updated = [...current];
      final index = updated.indexWhere((item) => idOf(item) == idOf(result));
      if (index == -1) {
        updated.insert(0, result);
      } else {
        updated[index] = result;
      }
      return updated;
    }
    if (deletedId == null) return current;
    return current.where((item) => idOf(item) != deletedId).toList();
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