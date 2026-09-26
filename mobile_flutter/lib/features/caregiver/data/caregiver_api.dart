import '../../../core/network/api_client.dart';
import '../models/caregiver_models.dart';

class CaregiverApi {
  const CaregiverApi(this.client);

  final ApiClient client;

  Future<List<CaregiverInvitationModel>> getInvitations(int userId) =>
      _getList(
        '/api/caregiver-invitations/$userId?pendingOnly=true',
        CaregiverInvitationModel.fromJson,
      );

  Future<CaregiverInvitationModel> createInvitation(
    CaregiverInvitationInput input,
  ) async {
    final response = await client.post<dynamic>(
      '/api/caregiver-invitations',
      data: input.toJson(),
    );
    return _parseItem(response.data, CaregiverInvitationModel.fromJson);
  }

  Future<void> deleteInvitation(int id) async {
    await client.delete<dynamic>('/api/caregiver-invitations/$id');
  }

  Future<CaregiverInvitationModel> validateInvitation(String code) async {
    final response = await client.get<dynamic>(
      '/api/invitation/${Uri.encodeComponent(code.trim().toUpperCase())}',
    );
    return _parseItem(response.data, CaregiverInvitationModel.fromJson);
  }

  Future<CaregiverInvitationModel> acceptInvitation({
    required String code,
    required int userId,
  }) async {
    final response = await client.post<dynamic>(
      '/api/accept-invitation',
      data: {
        'invitationCode': code.trim().toUpperCase(),
        'userId': userId,
      },
    );
    final data = response.data;
    if (data is Map && data['invitation'] is Map) {
      return CaregiverInvitationModel.fromJson(
        Map<String, dynamic>.from(data['invitation'] as Map),
      );
    }
    return _parseItem(data, CaregiverInvitationModel.fromJson);
  }

  Future<List<CareRelationshipModel>> getRelationshipsForUser(int userId) =>
      _getList(
        '/api/care-relationships/user/$userId',
        CareRelationshipModel.fromJson,
      );

  Future<void> removeRelationship(int id) async {
    await client.delete<dynamic>('/api/care-relationships/$id');
  }

  Future<List<CareRecipientSummaryModel>> getMyCareRecipients() => _getList(
        '/api/my-care-recipients',
        CareRecipientSummaryModel.fromJson,
      );

  Future<List<T>> _getList<T>(
    String path,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.get<dynamic>(path);
    if (response.data is! List) {
      throw const FormatException('Invalid caregiver collection response');
    }
    return (response.data as List)
        .whereType<Map>()
        .map((item) => fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  T _parseItem<T>(
    Object? data,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    if (data is! Map) {
      throw const FormatException('Invalid caregiver response');
    }
    return fromJson(Map<String, dynamic>.from(data));
  }
}