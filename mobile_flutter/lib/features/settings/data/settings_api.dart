import '../../../core/network/api_client.dart';
import '../../../models/user_model.dart';
import '../models/settings_models.dart';

class SettingsApi {
  const SettingsApi(this.client);

  final ApiClient client;

  Future<UserModel> getCurrentUser() async {
    final response = await client.get<dynamic>('/api/user');
    if (response.data is! Map) {
      throw const FormatException('Invalid current-user response');
    }
    final data = Map<String, dynamic>.from(response.data as Map);
    final nested = data['user'];
    return UserModel.fromJson(
      nested is Map ? Map<String, dynamic>.from(nested) : data,
    );
  }

  Future<UserPreferences> getPreferences() async {
    final response = await client.get<dynamic>('/api/user-preferences');
    if (response.data is! Map) {
      throw const FormatException('Invalid preferences response');
    }
    return UserPreferences.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<UserPreferences> updatePreferences(
    Map<String, dynamic> changes,
  ) async {
    final response = await client.put<dynamic>(
      '/api/user-preferences',
      data: changes,
    );
    if (response.data is! Map) {
      throw const FormatException('Invalid updated preferences response');
    }
    return UserPreferences.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<List<LockedSettingModel>> getLockedSettings(int userId) =>
      _getList('/api/locked-settings/$userId', LockedSettingModel.fromJson);

  Future<List<CaregiverPermissionModel>> getPermissions(
    int userId,
    int caregiverId,
  ) =>
      _getList(
        '/api/caregiver-permissions/$userId/$caregiverId',
        CaregiverPermissionModel.fromJson,
      );

  Future<List<Map<String, dynamic>>> getCareRecipients() async {
    final response = await client.get<dynamic>('/api/my-care-recipients');
    if (response.data is! List) {
      throw const FormatException('Invalid care recipients response');
    }
    return (response.data as List)
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  Future<LockedSettingModel> lockSetting(SettingsLockInput input) async {
    final response = await client.post<dynamic>(
      '/api/locked-settings',
      data: input.toJson(),
    );
    return _parse(response.data, LockedSettingModel.fromJson);
  }

  Future<void> unlockSetting({
    required int userId,
    required String settingKey,
    required int caregiverId,
  }) async {
    await client.delete<dynamic>(
      '/api/locked-settings/$userId/$settingKey',
      data: {'caregiverId': caregiverId},
    );
  }

  Future<CaregiverPermissionModel> setPermission({
    required int userId,
    required int caregiverId,
    required String permissionType,
    required bool isGranted,
  }) async {
    final response = await client.post<dynamic>(
      '/api/caregiver-permissions',
      data: {
        'userId': userId,
        'caregiverId': caregiverId,
        'permissionType': permissionType,
        'isGranted': isGranted,
        'isLocked': true,
        'grantedBy': caregiverId,
      },
    );
    return _parse(response.data, CaregiverPermissionModel.fromJson);
  }

  Future<OrganizationMembershipModel?> getOrganizationMembership() async {
    final response = await client.get<dynamic>('/api/org-codes/my');
    if (response.data == null) return null;
    return _parse(response.data, OrganizationMembershipModel.fromJson);
  }

  Future<String> redeemOrganizationCode(String code) async {
    final response = await client.post<dynamic>(
      '/api/org-codes/redeem',
      data: {'code': code.trim().toUpperCase()},
    );
    if (response.data is Map) {
      return '${(response.data as Map)['orgName'] ?? 'your organization'}';
    }
    return 'your organization';
  }

  Future<void> deleteAccount() async {
    await client.delete<dynamic>('/api/user/delete-account');
  }

  Future<List<T>> _getList<T>(
    String path,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.get<dynamic>(path);
    if (response.data is! List) {
      throw const FormatException('Invalid settings collection response');
    }
    return (response.data as List)
        .whereType<Map>()
        .map((item) => fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  T _parse<T>(
    Object? value,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    if (value is! Map) {
      throw const FormatException('Invalid settings action response');
    }
    return fromJson(Map<String, dynamic>.from(value));
  }
}