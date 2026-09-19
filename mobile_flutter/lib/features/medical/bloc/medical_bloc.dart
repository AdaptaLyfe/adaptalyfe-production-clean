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
    on<EditMedication>((event, emit) => _runMutation(
          emit,
          action: 'medication',
          successMessage: 'Medication updated successfully.',
          operation: () => repository.updateMedication(event.id, event.input),
        ));
    on<DeleteMedication>((event, emit) => _runMutation(
          emit,
          action: 'medication',
          successMessage: 'Medication deleted successfully.',
          deletedId: event.id,
          operation: () async {
            await repository.deleteMedication(event.id);
            return null;
          },
        ));
    on<AddCustomPharmacy>((event, emit) => _runMutation(
          emit,
          action: 'pharmacy',
          successMessage: 'Custom pharmacy created successfully.',
          operation: () => repository.createPharmacy(event.input),
        ));
    on<LinkPharmacy>((event, emit) => _runMutation(
          emit,
          action: 'userPharmacy',
          successMessage: 'Pharmacy added to your account.',
          operation: () => repository.linkPharmacy(event.input),
        ));
    on<CreateRefillReminder>((event, emit) => _runMutation(
          emit,
          action: 'refillOrder',
          successMessage: 'Refill reminder set successfully.',
          operation: () => repository.createRefillReminder(event.input),
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
        collectionErrors: const {},
        sessionInvalid: false,
      ),
    );
    try {
      final snapshot = await _fetchAll();
      if (emit.isDone) return;
      final failures = <String, String>{};
      final successfulLoads =
          snapshot.where((result) => result.isSuccess).length;

      String? firstFailure;
      void recordFailure(String key, _MedicalCollectionResult result) {
        if (result.error == null) return;
        final message = _messageFor(result.error!);
        failures[key] = message;
        firstFailure ??= message;
      }

      recordFailure('conditions', snapshot[0]);
      recordFailure('medications', snapshot[1]);
      recordFailure('pharmacies', snapshot[2]);
      recordFailure('userPharmacies', snapshot[3]);
      recordFailure('medicationsDue', snapshot[4]);
      recordFailure('refillOrders', snapshot[5]);
      recordFailure('allergies', snapshot[6]);
      recordFailure('contacts', snapshot[7]);
      recordFailure('reactions', snapshot[8]);
      recordFailure('providers', snapshot[9]);
      recordFailure('symptoms', snapshot[10]);

      if (successfulLoads == 0) {
        if (emit.isDone) return;
        _emitFailure(
          emit,
          snapshot.first.error ?? 'Unable to load medical records.',
        );
        return;
      }

      if (emit.isDone) return;
      _emitSnapshot(
        emit,
        (
          snapshot[0].value is List<MedicalConditionModel>
              ? snapshot[0].value as List<MedicalConditionModel>
              : state.conditions,
          snapshot[1].value is List<MedicationModel>
              ? snapshot[1].value as List<MedicationModel>
              : state.medications,
           snapshot[2].value is List<PharmacyModel>
               ? snapshot[2].value as List<PharmacyModel>
               : state.pharmacies,
           snapshot[3].value is List<UserPharmacyModel>
               ? snapshot[3].value as List<UserPharmacyModel>
               : state.userPharmacies,
           snapshot[4].value is List<MedicationModel>
               ? snapshot[4].value as List<MedicationModel>
               : state.medicationsDue,
           snapshot[5].value is List<RefillOrderModel>
               ? snapshot[5].value as List<RefillOrderModel>
               : state.refillOrders,
           snapshot[6].value is List<AllergyModel>
               ? snapshot[6].value as List<AllergyModel>
               : state.allergies,
           snapshot[7].value is List<EmergencyContactModel>
               ? snapshot[7].value as List<EmergencyContactModel>
               : state.emergencyContacts,
           snapshot[8].value is List<AdverseMedicationModel>
               ? snapshot[8].value as List<AdverseMedicationModel>
               : state.adverseMedications,
           snapshot[9].value is List<PrimaryCareProviderModel>
               ? snapshot[9].value as List<PrimaryCareProviderModel>
               : state.primaryCareProviders,
           snapshot[10].value is List<SymptomEntryModel>
               ? snapshot[10].value as List<SymptomEntryModel>
               : state.symptomEntries,
        ),
        collectionErrors: failures,
        actionMessage: firstFailure == null
            ? null
            : 'Some medical records could not be loaded. Try again.',
      );
    } catch (error) {
      if (emit.isDone) return;
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
      if (emit.isDone) return;
      _emitMutationSuccess(
        emit,
        action: action,
        result: result,
        deletedId: deletedId,
        successMessage: successMessage,
      );
    } catch (error) {
      if (emit.isDone) return;
      _emitFailure(emit, error, keepLoadedState: true);
    }
  }

  Future<List<_MedicalCollectionResult>> _fetchAll() async {
    final results = await Future.wait([
      _capture(repository.getConditions()),
      _capture(repository.getMedications()),
      _capture(repository.getPharmacies()),
      _capture(repository.getUserPharmacies()),
      _capture(repository.getMedicationsDueForRefill()),
      _capture(repository.getRefillOrders()),
      _capture(repository.getAllergies()),
      _capture(repository.getEmergencyContacts()),
      _capture(repository.getAdverseMedications()),
      _capture(repository.getPrimaryCareProviders()),
      _capture(repository.getSymptomEntries()),
    ]);
    return results;
  }

  Future<_MedicalCollectionResult> _capture(Future<Object?> request) async {
    try {
      return _MedicalCollectionResult(value: await request);
    } catch (error) {
      return _MedicalCollectionResult(error: error);
    }
  }

  void _emitSnapshot(
    Emitter<MedicalState> emit,
    (
      List<MedicalConditionModel>,
      List<MedicationModel>,
      List<PharmacyModel>,
      List<UserPharmacyModel>,
      List<MedicationModel>,
      List<RefillOrderModel>,
      List<AllergyModel>,
      List<EmergencyContactModel>,
      List<AdverseMedicationModel>,
      List<PrimaryCareProviderModel>,
      List<SymptomEntryModel>
    ) snapshot, {
    String? actionMessage,
    Map<String, String> collectionErrors = const {},
  }) {
    emit(
      state.copyWith(
        status: MedicalStatus.loaded,
        conditions: snapshot.$1,
        medications: snapshot.$2,
        pharmacies: snapshot.$3,
        userPharmacies: snapshot.$4,
        medicationsDue: snapshot.$5,
        refillOrders: snapshot.$6,
        allergies: snapshot.$7,
        emergencyContacts: snapshot.$8,
        adverseMedications: snapshot.$9,
        primaryCareProviders: snapshot.$10,
        symptomEntries: snapshot.$11,
        busySection: null,
        errorMessage: null,
        actionMessage: actionMessage,
        collectionErrors: collectionErrors,
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
      collectionErrors: const {},
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
      case 'pharmacy':
        emit(
          baseState.copyWith(
            pharmacies: _replaceOrRemove(
              state.pharmacies,
              result,
              deletedId,
              (item) => item.id,
            ),
          ),
        );
      case 'userPharmacy':
        if (result is UserPharmacyModel) {
          final pharmacy = state.pharmacies
              .where((item) => item.id == result.pharmacyId)
              .isEmpty
              ? null
              : state.pharmacies.firstWhere(
                  (item) => item.id == result.pharmacyId,
                );
          emit(
            baseState.copyWith(
              userPharmacies: _replaceOrRemove(
                state.userPharmacies,
                pharmacy == null ? result : result.copyWith(pharmacy: pharmacy),
                deletedId,
                (item) => item.id,
              ),
            ),
          );
        } else {
          emit(baseState);
        }
      case 'refillOrder':
        if (result is RefillOrderModel) {
          final medication = state.medications
              .where((item) => item.id == result.medicationId)
              .isEmpty
              ? null
              : state.medications.firstWhere(
                  (item) => item.id == result.medicationId,
                );
          final pharmacy = state.pharmacies
              .where((item) => item.id == result.pharmacyId)
              .isEmpty
              ? null
              : state.pharmacies.firstWhere(
                  (item) => item.id == result.pharmacyId,
                );
          emit(
            baseState.copyWith(
              refillOrders: _replaceOrRemove(
                state.refillOrders,
                result.copyWith(medication: medication, pharmacy: pharmacy),
                deletedId,
                (item) => item.id,
              ),
            ),
          );
        } else {
          emit(baseState);
        }
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
        collectionErrors: const {},
        sessionInvalid:
            error is ApiException && error.type == ApiErrorType.unauthorized,
      ),
    );
  }

  String _messageFor(Object error) {
    if (error is ApiException) return error.message;
    if (error is FormatException) return error.message;
    return 'The medical records request failed.';
  }
}

class _MedicalCollectionResult {
  const _MedicalCollectionResult({this.value, this.error});

  final Object? value;
  final Object? error;

  bool get isSuccess => error == null;
}