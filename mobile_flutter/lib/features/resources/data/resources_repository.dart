import '../models/resource_models.dart';
import 'resources_api.dart';

class ResourcesRepository {
  const ResourcesRepository(this.api);

  final ResourcesApi api;

  Future<List<PersonalResourceModel>> getPersonalResources() =>
      api.getPersonalResources();

  Future<PersonalResourceModel> createPersonalResource(
    PersonalResourceInput input,
  ) =>
      api.createPersonalResource(input);

  Future<PersonalResourceModel> updatePersonalResource(
    int id,
    Map<String, dynamic> updates,
  ) =>
      api.updatePersonalResource(id, updates);

  Future<void> deletePersonalResource(int id) =>
      api.deletePersonalResource(id);

  Future<PersonalResourceModel> recordPersonalResourceAccess(int id) =>
      api.recordPersonalResourceAccess(id);

  Future<List<EmergencyResourceModel>> getEmergencyResources() =>
      api.getEmergencyResources();

  Future<EmergencyResourceModel> createEmergencyResource(
    EmergencyResourceInput input,
  ) =>
      api.createEmergencyResource(input);

  Future<EmergencyResourceModel> updateEmergencyResource(
    int id,
    EmergencyResourceInput input,
  ) =>
      api.updateEmergencyResource(id, input);

  Future<void> deleteEmergencyResource(int id) =>
      api.deleteEmergencyResource(id);
}