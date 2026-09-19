import '../../../core/network/api_client.dart';
import '../models/medical_models.dart';

class MedicalApi {
  const MedicalApi(this.client);

  final ApiClient client;

  Future<List<AllergyModel>> getAllergies() =>
      _getList('/api/allergies', AllergyModel.fromJson);

  Future<AllergyModel> createAllergy(AllergyInput input) =>
      _post('/api/allergies', input.toJson(), AllergyModel.fromJson);

  Future<AllergyModel> updateAllergy(int id, AllergyInput input) =>
      _put('/api/allergies/$id', input.toUpdateJson(), AllergyModel.fromJson);

  Future<void> deleteAllergy(int id) =>
      _delete('/api/allergies/$id');

  Future<List<MedicalConditionModel>> getConditions() =>
      _getList('/api/medical-conditions', MedicalConditionModel.fromJson);

  Future<MedicalConditionModel> createCondition(
    MedicalConditionInput input,
  ) =>
      _post(
        '/api/medical-conditions',
        input.toJson(),
        MedicalConditionModel.fromJson,
      );

  Future<MedicalConditionModel> updateCondition(
    int id,
    MedicalConditionInput input,
  ) =>
      _put(
        '/api/medical-conditions/$id',
        input.toUpdateJson(),
        MedicalConditionModel.fromJson,
      );

  Future<void> deleteCondition(int id) =>
      _delete('/api/medical-conditions/$id');

  Future<List<MedicationModel>> getMedications() =>
      _getList('/api/medications', MedicationModel.fromJson);

  Future<MedicationModel> createMedication(MedicationInput input) =>
      _post('/api/medications', input.toJson(), MedicationModel.fromJson);

  Future<List<PharmacyModel>> getPharmacies() =>
      _getList('/api/pharmacies', PharmacyModel.fromJson);

  Future<PharmacyModel> createPharmacy(PharmacyInput input) =>
      _post('/api/pharmacies', input.toJson(), PharmacyModel.fromJson);

  Future<List<UserPharmacyModel>> getUserPharmacies() =>
      _getList('/api/user-pharmacies', UserPharmacyModel.fromJson);

  Future<UserPharmacyModel> linkPharmacy(UserPharmacyInput input) =>
      _post('/api/user-pharmacies', input.toJson(), UserPharmacyModel.fromJson);

  Future<List<MedicationModel>> getMedicationsDueForRefill() =>
      _getList('/api/medications/due-for-refill', MedicationModel.fromJson);

  Future<List<RefillOrderModel>> getRefillOrders() =>
      _getList('/api/refill-orders', RefillOrderModel.fromJson);

  Future<RefillOrderModel> createRefillReminder(RefillOrderInput input) =>
      _post('/api/refill-orders', input.toJson(), RefillOrderModel.fromJson);

  Future<List<EmergencyContactModel>> getEmergencyContacts() =>
      _getList('/api/emergency-contacts', EmergencyContactModel.fromJson);

  Future<EmergencyContactModel> createEmergencyContact(
    EmergencyContactInput input,
  ) =>
      _post(
        '/api/emergency-contacts',
        input.toJson(),
        EmergencyContactModel.fromJson,
      );

  Future<EmergencyContactModel> updateEmergencyContact(
    int id,
    EmergencyContactInput input,
  ) =>
      _put(
        '/api/emergency-contacts/$id',
        input.toUpdateJson(),
        EmergencyContactModel.fromJson,
      );

  Future<void> deleteEmergencyContact(int id) =>
      _delete('/api/emergency-contacts/$id');

  Future<List<AdverseMedicationModel>> getAdverseMedications() =>
      _getList('/api/adverse-medications', AdverseMedicationModel.fromJson);

  Future<AdverseMedicationModel> createAdverseMedication(
    AdverseMedicationInput input,
  ) =>
      _post(
        '/api/adverse-medications',
        input.toJson(),
        AdverseMedicationModel.fromJson,
      );

  Future<AdverseMedicationModel> updateAdverseMedication(
    int id,
    AdverseMedicationInput input,
  ) =>
      _put(
        '/api/adverse-medications/$id',
        input.toUpdateJson(),
        AdverseMedicationModel.fromJson,
      );

  Future<void> deleteAdverseMedication(int id) =>
      _delete('/api/adverse-medications/$id');

  Future<List<PrimaryCareProviderModel>> getPrimaryCareProviders() =>
      _getList('/api/primary-care-providers', PrimaryCareProviderModel.fromJson);

  Future<PrimaryCareProviderModel> createPrimaryCareProvider(
    PrimaryCareProviderInput input,
  ) =>
      _post(
        '/api/primary-care-providers',
        input.toJson(),
        PrimaryCareProviderModel.fromJson,
      );

  Future<PrimaryCareProviderModel> updatePrimaryCareProvider(
    int id,
    PrimaryCareProviderInput input,
  ) =>
      _put(
        '/api/primary-care-providers/$id',
        input.toUpdateJson(),
        PrimaryCareProviderModel.fromJson,
      );

  Future<void> deletePrimaryCareProvider(int id) =>
      _delete('/api/primary-care-providers/$id');

  Future<List<SymptomEntryModel>> getSymptomEntries() =>
      _getList('/api/symptom-entries', SymptomEntryModel.fromJson);

  Future<SymptomEntryModel> createSymptomEntry(SymptomEntryInput input) =>
      _post('/api/symptom-entries', input.toJson(), SymptomEntryModel.fromJson);

  Future<SymptomEntryModel> updateSymptomEntry(
    int id,
    SymptomEntryInput input,
  ) =>
      _patch(
        '/api/symptom-entries/$id',
        input.toUpdateJson(),
        SymptomEntryModel.fromJson,
      );

  Future<void> deleteSymptomEntry(int id) =>
      _delete('/api/symptom-entries/$id');

  Future<List<T>> _getList<T>(
    String path,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.get<dynamic>(path);
    if (response.data is! List) {
      throw const FormatException('Invalid medical collection response');
    }
    return (response.data as List)
        .whereType<Map>()
        .map((item) => fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<T> _post<T>(
    String path,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.post<dynamic>(path, data: data);
    return _parseItem(response.data, fromJson);
  }

  Future<T> _put<T>(
    String path,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.put<dynamic>(path, data: data);
    return _parseItem(response.data, fromJson);
  }

  Future<T> _patch<T>(
    String path,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.patch<dynamic>(path, data: data);
    return _parseItem(response.data, fromJson);
  }

  Future<void> _delete(String path) async {
    await client.delete<dynamic>(path);
  }

  T _parseItem<T>(
    Object? data,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    if (data is! Map) {
      throw const FormatException('Invalid medical item response');
    }
    return fromJson(Map<String, dynamic>.from(data));
  }
}