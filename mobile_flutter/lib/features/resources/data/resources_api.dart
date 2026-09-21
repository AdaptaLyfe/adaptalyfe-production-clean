import '../../../core/network/api_client.dart';
import '../models/resource_models.dart';
import '../../medical/models/medical_models.dart';

class ResourcesApi {
  const ResourcesApi(this.client);

  final ApiClient client;

  Future<List<PersonalResourceModel>> getPersonalResources() =>
      _getList('/api/personal-resources', PersonalResourceModel.fromJson);

  Future<PersonalResourceModel> createPersonalResource(
    PersonalResourceInput input,
  ) =>
      _post(
        '/api/personal-resources',
        input.toJson(),
        PersonalResourceModel.fromJson,
      );

  Future<PersonalResourceModel> updatePersonalResource(
    int id,
    Map<String, dynamic> updates,
  ) =>
      _patch(
        '/api/personal-resources/$id',
        updates,
        PersonalResourceModel.fromJson,
      );

  Future<void> deletePersonalResource(int id) async {
    await client.delete<dynamic>('/api/personal-resources/$id');
  }

  Future<PersonalResourceModel> recordPersonalResourceAccess(int id) =>
      _patch(
        '/api/personal-resources/$id/access',
        const {},
        PersonalResourceModel.fromJson,
      );

  Future<List<EmergencyResourceModel>> getEmergencyResources() =>
      _getList('/api/emergency-resources', EmergencyResourceModel.fromJson);

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

  Future<void> deleteEmergencyContact(int id) async {
    await client.delete<dynamic>('/api/emergency-contacts/$id');
  }

  Future<EmergencyResourceModel> createEmergencyResource(
    EmergencyResourceInput input,
  ) =>
      _post(
        '/api/emergency-resources',
        input.toJson(),
        EmergencyResourceModel.fromJson,
      );

  Future<EmergencyResourceModel> updateEmergencyResource(
    int id,
    EmergencyResourceInput input,
  ) =>
      _put(
        '/api/emergency-resources/$id',
        input.toJson(),
        EmergencyResourceModel.fromJson,
      );

  Future<void> deleteEmergencyResource(int id) async {
    await client.delete<dynamic>('/api/emergency-resources/$id');
  }

  Future<List<T>> _getList<T>(
    String path,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.get<dynamic>(path);
    if (response.data == null) {
      return <T>[];
    }
    if (response.data is! List) {
      throw const FormatException('Invalid resources collection response');
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

  Future<T> _patch<T>(
    String path,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.patch<dynamic>(path, data: data);
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

  T _parseItem<T>(
    Object? data,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    Object? payload = data;
    if (payload is Map) {
      payload = payload['resource'] ??
          payload['personalResource'] ??
          payload['emergencyResource'] ??
          payload['data'] ??
          payload;
    } else if (payload is List && payload.length == 1) {
      payload = payload.first;
    }
    if (payload is! Map) {
      throw const FormatException('Invalid resource response');
    }
    return fromJson(Map<String, dynamic>.from(payload));
  }
}