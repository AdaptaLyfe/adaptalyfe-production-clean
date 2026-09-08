import '../models/medical_models.dart';
import 'medical_api.dart';

class MedicalRepository {
  const MedicalRepository(this.api);

  final MedicalApi api;

  Future<List<MedicalConditionModel>> getConditions() => api.getConditions();
  Future<MedicalConditionModel> createCondition(MedicalConditionInput input) =>
      api.createCondition(input);
  Future<MedicalConditionModel> updateCondition(
    int id,
    MedicalConditionInput input,
  ) =>
      api.updateCondition(id, input);
  Future<void> deleteCondition(int id) => api.deleteCondition(id);

  Future<List<MedicationModel>> getMedications() => api.getMedications();
  Future<MedicationModel> createMedication(MedicationInput input) =>
      api.createMedication(input);

  Future<List<AllergyModel>> getAllergies() => api.getAllergies();
  Future<AllergyModel> createAllergy(AllergyInput input) =>
      api.createAllergy(input);
  Future<AllergyModel> updateAllergy(int id, AllergyInput input) =>
      api.updateAllergy(id, input);
  Future<void> deleteAllergy(int id) => api.deleteAllergy(id);

  Future<List<EmergencyContactModel>> getEmergencyContacts() =>
      api.getEmergencyContacts();
  Future<EmergencyContactModel> createEmergencyContact(
    EmergencyContactInput input,
  ) =>
      api.createEmergencyContact(input);
  Future<EmergencyContactModel> updateEmergencyContact(
    int id,
    EmergencyContactInput input,
  ) =>
      api.updateEmergencyContact(id, input);
  Future<void> deleteEmergencyContact(int id) =>
      api.deleteEmergencyContact(id);
}