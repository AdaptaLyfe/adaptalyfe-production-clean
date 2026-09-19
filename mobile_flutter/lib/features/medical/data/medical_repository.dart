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

  Future<List<PharmacyModel>> getPharmacies() => api.getPharmacies();
  Future<PharmacyModel> createPharmacy(PharmacyInput input) =>
      api.createPharmacy(input);
  Future<List<UserPharmacyModel>> getUserPharmacies() =>
      api.getUserPharmacies();
  Future<UserPharmacyModel> linkPharmacy(UserPharmacyInput input) =>
      api.linkPharmacy(input);
  Future<List<MedicationModel>> getMedicationsDueForRefill() =>
      api.getMedicationsDueForRefill();
  Future<List<RefillOrderModel>> getRefillOrders() => api.getRefillOrders();
  Future<RefillOrderModel> createRefillReminder(RefillOrderInput input) =>
      api.createRefillReminder(input);

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

  Future<List<AdverseMedicationModel>> getAdverseMedications() =>
      api.getAdverseMedications();
  Future<AdverseMedicationModel> createAdverseMedication(
    AdverseMedicationInput input,
  ) =>
      api.createAdverseMedication(input);
  Future<AdverseMedicationModel> updateAdverseMedication(
    int id,
    AdverseMedicationInput input,
  ) =>
      api.updateAdverseMedication(id, input);
  Future<void> deleteAdverseMedication(int id) =>
      api.deleteAdverseMedication(id);

  Future<List<PrimaryCareProviderModel>> getPrimaryCareProviders() =>
      api.getPrimaryCareProviders();
  Future<PrimaryCareProviderModel> createPrimaryCareProvider(
    PrimaryCareProviderInput input,
  ) =>
      api.createPrimaryCareProvider(input);
  Future<PrimaryCareProviderModel> updatePrimaryCareProvider(
    int id,
    PrimaryCareProviderInput input,
  ) =>
      api.updatePrimaryCareProvider(id, input);
  Future<void> deletePrimaryCareProvider(int id) =>
      api.deletePrimaryCareProvider(id);

  Future<List<SymptomEntryModel>> getSymptomEntries() =>
      api.getSymptomEntries();
  Future<SymptomEntryModel> createSymptomEntry(SymptomEntryInput input) =>
      api.createSymptomEntry(input);
  Future<SymptomEntryModel> updateSymptomEntry(
    int id,
    SymptomEntryInput input,
  ) =>
      api.updateSymptomEntry(id, input);
  Future<void> deleteSymptomEntry(int id) => api.deleteSymptomEntry(id);
}