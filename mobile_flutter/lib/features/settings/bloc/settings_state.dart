import 'package:equatable/equatable.dart';

import '../../../models/user_model.dart';
import '../models/settings_models.dart';

enum SettingsStatus {
  initial,
  loading,
  loaded,
  saving,
  failure,
}

class SettingsState extends Equatable {
  const SettingsState({
    this.status = SettingsStatus.initial,
    this.user,
    this.preferences = const UserPreferences(),
    this.localSettings = const LocalUserSettings(),
    this.dashboardModules = defaultDashboardModules,
    this.lockedSettings = const [],
    this.careRecipients = const [],
    this.selectedRecipientId,
    this.managedLockedSettings = const [],
    this.permissions = const [],
    this.organizationMembership,
    this.busyKey,
    this.errorMessage,
    this.actionMessage,
    this.sessionInvalid = false,
    this.accountDeleted = false,
  });

  final SettingsStatus status;
  final UserModel? user;
  final UserPreferences preferences;
  final LocalUserSettings localSettings;
  final List<DashboardModuleModel> dashboardModules;
  final List<LockedSettingModel> lockedSettings;
  final List<Map<String, dynamic>> careRecipients;
  final int? selectedRecipientId;
  final List<LockedSettingModel> managedLockedSettings;
  final List<CaregiverPermissionModel> permissions;
  final OrganizationMembershipModel? organizationMembership;
  final String? busyKey;
  final String? errorMessage;
  final String? actionMessage;
  final bool sessionInvalid;
  final bool accountDeleted;

  bool get isLoading =>
      status == SettingsStatus.initial || status == SettingsStatus.loading;
  bool get isSaving => status == SettingsStatus.saving;

  Map<String, dynamic> get theme => preferences.themeSettings;
  Map<String, dynamic> get accessibility => preferences.accessibilitySettings;
  Map<String, dynamic> get notifications => preferences.notificationSettings;
  Map<String, dynamic> get behavior => preferences.behaviorPatterns;
  Map<String, dynamic> get adaptive => preferences.adaptiveFeatures;
  Map<String, dynamic> get reminders => preferences.reminderTiming;

  SettingsState copyWith({
    SettingsStatus? status,
    Object? user = _notSet,
    UserPreferences? preferences,
    LocalUserSettings? localSettings,
    List<DashboardModuleModel>? dashboardModules,
    List<LockedSettingModel>? lockedSettings,
    List<Map<String, dynamic>>? careRecipients,
    Object? selectedRecipientId = _notSet,
    List<LockedSettingModel>? managedLockedSettings,
    List<CaregiverPermissionModel>? permissions,
    Object? organizationMembership = _notSet,
    Object? busyKey = _notSet,
    Object? errorMessage = _notSet,
    Object? actionMessage = _notSet,
    bool? sessionInvalid,
    bool? accountDeleted,
  }) {
    return SettingsState(
      status: status ?? this.status,
      user: identical(user, _notSet) ? this.user : user as UserModel?,
      preferences: preferences ?? this.preferences,
      localSettings: localSettings ?? this.localSettings,
      dashboardModules: dashboardModules ?? this.dashboardModules,
      lockedSettings: lockedSettings ?? this.lockedSettings,
      careRecipients: careRecipients ?? this.careRecipients,
      selectedRecipientId: identical(selectedRecipientId, _notSet)
          ? this.selectedRecipientId
          : selectedRecipientId as int?,
      managedLockedSettings:
          managedLockedSettings ?? this.managedLockedSettings,
      permissions: permissions ?? this.permissions,
      organizationMembership: identical(organizationMembership, _notSet)
          ? this.organizationMembership
          : organizationMembership as OrganizationMembershipModel?,
      busyKey: identical(busyKey, _notSet)
          ? this.busyKey
          : busyKey as String?,
      errorMessage: identical(errorMessage, _notSet)
          ? this.errorMessage
          : errorMessage as String?,
      actionMessage: identical(actionMessage, _notSet)
          ? this.actionMessage
          : actionMessage as String?,
      sessionInvalid: sessionInvalid ?? this.sessionInvalid,
      accountDeleted: accountDeleted ?? this.accountDeleted,
    );
  }

  @override
  List<Object?> get props => [
        status,
        user,
        preferences,
        localSettings,
        dashboardModules,
        lockedSettings,
        careRecipients,
        selectedRecipientId,
        managedLockedSettings,
        permissions,
        organizationMembership,
        busyKey,
        errorMessage,
        actionMessage,
        sessionInvalid,
        accountDeleted,
      ];
}

const _notSet = Object();