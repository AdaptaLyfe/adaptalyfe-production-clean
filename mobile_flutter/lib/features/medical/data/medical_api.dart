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
      _put('/api/allergies/$id', input.toJson(), AllergyModel.fromJson);

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
        input.toJson(),
        MedicalConditionModel.fromJson,
      );

  Future<void> deleteCondition(int id) =>
      _delete('/api/medical-conditions/$id');

  Future<List<MedicationModel>> getMedications() =>
      _getList('/api/medications', MedicationModel.fromJson);

  Future<MedicationModel> createMedication(MedicationInput input) =>
      _post('/api/medications', input.toJson(), MedicationModel.fromJson);

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
        input.toJson(),
        EmergencyContactModel.fromJson,
      );

  Future<void> deleteEmergencyContact(int id) =>
      _delete('/api/emergency-contacts/$id');

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