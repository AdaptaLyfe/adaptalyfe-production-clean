import '../../../models/user_model.dart';
import '../models/settings_models.dart';
import 'dashboard_layout_store.dart';
import 'local_settings_store.dart';
import 'settings_api.dart';

class SettingsRepository {
  const SettingsRepository(
    this.api,
    this.dashboardLayoutStore,
    this.localSettingsStore,
  );

  final SettingsApi api;
  final DashboardLayoutStore dashboardLayoutStore;
  final LocalSettingsStore localSettingsStore;

  Future<UserModel> getCurrentUser() => api.getCurrentUser();
  Future<UserPreferences> getPreferences() => api.getPreferences();
  Future<UserPreferences> updatePreferences(Map<String, dynamic> changes) =>
      api.updatePreferences(changes);
  Future<List<LockedSettingModel>> getLockedSettings(int userId) =>
      api.getLockedSettings(userId);
  Future<List<Map<String, dynamic>>> getCareRecipients() =>
      api.getCareRecipients();
  Future<List<CaregiverPermissionModel>> getPermissions(
    int userId,
    int caregiverId,
  ) =>
      api.getPermissions(userId, caregiverId);
  Future<LockedSettingModel> lockSetting(SettingsLockInput input) =>
      api.lockSetting(input);
  Future<void> unlockSetting({
    required int userId,
    required String settingKey,
    required int caregiverId,
  }) =>
      api.unlockSetting(
        userId: userId,
        settingKey: settingKey,
        caregiverId: caregiverId,
      );
  Future<CaregiverPermissionModel> setPermission({
    required int userId,
    required int caregiverId,
    required String permissionType,
    required bool isGranted,
  }) =>
      api.setPermission(
        userId: userId,
        caregiverId: caregiverId,
        permissionType: permissionType,
        isGranted: isGranted,
      );
  Future<OrganizationMembershipModel?> getOrganizationMembership() =>
      api.getOrganizationMembership();
  Future<String> redeemOrganizationCode(String code) =>
      api.redeemOrganizationCode(code);
  Future<void> deleteAccount() => api.deleteAccount();
  Future<List<DashboardModuleModel>> loadDashboardLayout(int userId) =>
      dashboardLayoutStore.load(userId);
  Future<void> saveDashboardLayout(
    int userId,
    List<DashboardModuleModel> modules,
  ) =>
      dashboardLayoutStore.save(userId, modules);
  Future<void> resetDashboardLayout(int userId) =>
      dashboardLayoutStore.reset(userId);
  Future<LocalUserSettings> loadLocalSettings() => localSettingsStore.load();
  Future<void> saveLocalSettings(LocalUserSettings settings) =>
      localSettingsStore.save(settings);
}