import 'package:equatable/equatable.dart';

class LocalUserSettings extends Equatable {
  const LocalUserSettings({
    this.premiumFeatures = false,
    this.autoSave = true,
    this.privacyMode = false,
    this.locationTracking = true,
    this.emergencyAlerts = true,
    this.caregiverAccess = true,
    this.medicalDataSharing = true,
    this.automaticCheckIns = true,
  });

  factory LocalUserSettings.fromJson(Map<String, dynamic> json) =>
      LocalUserSettings(
        premiumFeatures: json['premiumFeatures'] == true,
        autoSave: json['autoSave'] != false,
        privacyMode: json['privacyMode'] == true,
        locationTracking: json['locationTracking'] != false,
        emergencyAlerts: json['emergencyAlerts'] != false,
        caregiverAccess: json['caregiverAccess'] != false,
        medicalDataSharing: json['medicalDataSharing'] != false,
        automaticCheckIns: json['automaticCheckIns'] != false,
      );

  final bool premiumFeatures;
  final bool autoSave;
  final bool privacyMode;
  final bool locationTracking;
  final bool emergencyAlerts;
  final bool caregiverAccess;
  final bool medicalDataSharing;
  final bool automaticCheckIns;

  LocalUserSettings copyWith({
    bool? premiumFeatures,
    bool? autoSave,
    bool? privacyMode,
    bool? locationTracking,
    bool? emergencyAlerts,
    bool? caregiverAccess,
    bool? medicalDataSharing,
    bool? automaticCheckIns,
  }) =>
      LocalUserSettings(
        premiumFeatures: premiumFeatures ?? this.premiumFeatures,
        autoSave: autoSave ?? this.autoSave,
        privacyMode: privacyMode ?? this.privacyMode,
        locationTracking: locationTracking ?? this.locationTracking,
        emergencyAlerts: emergencyAlerts ?? this.emergencyAlerts,
        caregiverAccess: caregiverAccess ?? this.caregiverAccess,
        medicalDataSharing: medicalDataSharing ?? this.medicalDataSharing,
        automaticCheckIns: automaticCheckIns ?? this.automaticCheckIns,
      );

  Map<String, dynamic> toJson() => {
        'premiumFeatures': premiumFeatures,
        'autoSave': autoSave,
        'privacyMode': privacyMode,
        'locationTracking': locationTracking,
        'emergencyAlerts': emergencyAlerts,
        'caregiverAccess': caregiverAccess,
        'medicalDataSharing': medicalDataSharing,
        'automaticCheckIns': automaticCheckIns,
      };

  @override
  List<Object?> get props => [
        premiumFeatures,
        autoSave,
        privacyMode,
        locationTracking,
        emergencyAlerts,
        caregiverAccess,
        medicalDataSharing,
        automaticCheckIns,
      ];
}

class UserPreferences extends Equatable {
  const UserPreferences({
    this.notificationSettings = const {},
    this.reminderTiming = const {},
    this.themeSettings = const {},
    this.accessibilitySettings = const {},
    this.behaviorPatterns = const {},
    this.adaptiveFeatures = const {},
  });

  final Map<String, dynamic> notificationSettings;
  final Map<String, dynamic> reminderTiming;
  final Map<String, dynamic> themeSettings;
  final Map<String, dynamic> accessibilitySettings;
  final Map<String, dynamic> behaviorPatterns;
  final Map<String, dynamic> adaptiveFeatures;

  factory UserPreferences.fromJson(Map<String, dynamic> json) {
    final behavior = _map(json['behaviorPatterns']);
    return UserPreferences(
      notificationSettings: _map(json['notificationSettings']),
      reminderTiming: _map(json['reminderTiming']),
      themeSettings: _map(json['themeSettings']),
      accessibilitySettings: _map(json['accessibilitySettings']),
      behaviorPatterns: behavior,
      // The active user_preferences table has five JSON columns. Keep the
      // existing adaptive feature controls inside behaviorPatterns rather than
      // sending an unsupported sixth column to the API.
      adaptiveFeatures: _map(json['adaptiveFeatures'] ?? behavior['adaptiveFeatures']),
    );
  }

  Map<String, dynamic> category(String name) {
    switch (name) {
      case 'notificationSettings':
        return notificationSettings;
      case 'reminderTiming':
        return reminderTiming;
      case 'themeSettings':
        return themeSettings;
      case 'accessibilitySettings':
        return accessibilitySettings;
      case 'behaviorPatterns':
        return behaviorPatterns;
      case 'adaptiveFeatures':
        return adaptiveFeatures;
      default:
        return const {};
    }
  }

  UserPreferences withCategory(String name, Map<String, dynamic> values) {
    return UserPreferences(
      notificationSettings: name == 'notificationSettings'
          ? values
          : notificationSettings,
      reminderTiming: name == 'reminderTiming' ? values : reminderTiming,
      themeSettings: name == 'themeSettings' ? values : themeSettings,
      accessibilitySettings: name == 'accessibilitySettings'
          ? values
          : accessibilitySettings,
      behaviorPatterns: name == 'behaviorPatterns'
          ? values
          : behaviorPatterns,
      adaptiveFeatures: name == 'adaptiveFeatures' ? values : adaptiveFeatures,
    );
  }

  @override
  List<Object?> get props => [
        notificationSettings,
        reminderTiming,
        themeSettings,
        accessibilitySettings,
        behaviorPatterns,
        adaptiveFeatures,
      ];
}

class LockedSettingModel extends Equatable {
  const LockedSettingModel({
    required this.id,
    required this.userId,
    required this.settingKey,
    required this.settingValue,
    required this.isLocked,
    required this.lockedBy,
    this.lockReason,
    this.canUserView = true,
    this.createdAt,
  });

  factory LockedSettingModel.fromJson(Map<String, dynamic> json) {
    return LockedSettingModel(
      id: _int(json['id']),
      userId: _int(json['userId']),
      settingKey: '${json['settingKey'] ?? ''}',
      settingValue: '${json['settingValue'] ?? ''}',
      isLocked: json['isLocked'] != false,
      lockedBy: _int(json['lockedBy']),
      lockReason: json['lockReason'] as String?,
      canUserView: json['canUserView'] != false,
      createdAt: _date(json['createdAt']),
    );
  }

  final int id;
  final int userId;
  final String settingKey;
  final String settingValue;
  final bool isLocked;
  final int lockedBy;
  final String? lockReason;
  final bool canUserView;
  final DateTime? createdAt;

  @override
  List<Object?> get props => [
        id,
        userId,
        settingKey,
        settingValue,
        isLocked,
        lockedBy,
        lockReason,
        canUserView,
        createdAt,
      ];
}

class CaregiverPermissionModel extends Equatable {
  const CaregiverPermissionModel({
    required this.id,
    required this.userId,
    required this.caregiverId,
    required this.permissionType,
    required this.isGranted,
    required this.isLocked,
  });

  factory CaregiverPermissionModel.fromJson(Map<String, dynamic> json) {
    return CaregiverPermissionModel(
      id: _int(json['id']),
      userId: _int(json['userId']),
      caregiverId: _int(json['caregiverId']),
      permissionType: '${json['permissionType'] ?? ''}',
      isGranted: json['isGranted'] != false,
      isLocked: json['isLocked'] == true,
    );
  }

  final int id;
  final int userId;
  final int caregiverId;
  final String permissionType;
  final bool isGranted;
  final bool isLocked;

  @override
  List<Object?> get props =>
      [id, userId, caregiverId, permissionType, isGranted, isLocked];
}

class DashboardModuleModel extends Equatable {
  const DashboardModuleModel({
    required this.id,
    required this.name,
    required this.component,
    required this.enabled,
    required this.order,
  });

  factory DashboardModuleModel.fromJson(Map<String, dynamic> json) {
    return DashboardModuleModel(
      id: '${json['id'] ?? ''}',
      name: '${json['name'] ?? json['id'] ?? 'Dashboard module'}',
      component: '${json['component'] ?? ''}',
      enabled: json['enabled'] == true,
      order: _int(json['order']),
    );
  }

  final String id;
  final String name;
  final String component;
  final bool enabled;
  final int order;

  DashboardModuleModel copyWith({bool? enabled, int? order}) =>
      DashboardModuleModel(
        id: id,
        name: name,
        component: component,
        enabled: enabled ?? this.enabled,
        order: order ?? this.order,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'component': component,
        'enabled': enabled,
        'order': order,
      };

  @override
  List<Object?> get props => [id, name, component, enabled, order];
}

class OrganizationMembershipModel extends Equatable {
  const OrganizationMembershipModel({
    required this.status,
    required this.orgName,
  });

  factory OrganizationMembershipModel.fromJson(Map<String, dynamic> json) =>
      OrganizationMembershipModel(
        status: '${json['status'] ?? ''}',
        orgName: '${json['orgName'] ?? 'Organization'}',
      );

  final String status;
  final String orgName;

  bool get isActive => status == 'active';

  @override
  List<Object?> get props => [status, orgName];
}

const defaultDashboardModules = <DashboardModuleModel>[
  DashboardModuleModel(
    id: 'daily-summary',
    name: 'Daily Summary',
    component: 'DailySummary',
    enabled: true,
    order: 0,
  ),
  DashboardModuleModel(
    id: 'daily-tasks',
    name: 'Task Management',
    component: 'DailyTasksModule',
    enabled: true,
    order: 1,
  ),
  DashboardModuleModel(
    id: 'mood',
    name: 'Mood Log',
    component: 'MoodModule',
    enabled: true,
    order: 2,
  ),
  DashboardModuleModel(
    id: 'financial',
    name: 'Financial Tracker',
    component: 'FinancialModule',
    enabled: false,
    order: 3,
  ),
  DashboardModuleModel(
    id: 'appointments',
    name: 'Appointments',
    component: 'AppointmentsModule',
    enabled: false,
    order: 4,
  ),
  DashboardModuleModel(
    id: 'pharmacy',
    name: 'Medication List',
    component: 'PharmacyModule',
    enabled: false,
    order: 5,
  ),
  DashboardModuleModel(
    id: 'achievements',
    name: 'Achievements',
    component: 'AchievementsModule',
    enabled: false,
    order: 6,
  ),
  DashboardModuleModel(
    id: 'caregiver',
    name: 'Support Network',
    component: 'CaregiverModule',
    enabled: false,
    order: 7,
  ),
  DashboardModuleModel(
    id: 'accessibility',
    name: 'Accessibility Settings',
    component: 'AccessibilitySettingsModule',
    enabled: false,
    order: 8,
  ),
];

class SettingsLockInput {
  const SettingsLockInput({
    required this.userId,
    required this.settingKey,
    required this.settingValue,
    required this.lockedBy,
    required this.lockReason,
    required this.canUserView,
  });

  final int userId;
  final String settingKey;
  final String settingValue;
  final int lockedBy;
  final String lockReason;
  final bool canUserView;

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'settingKey': settingKey,
        'settingValue': settingValue,
        'isLocked': true,
        'lockedBy': lockedBy,
        'lockReason': lockReason,
        'canUserView': canUserView,
      };
}

int _int(Object? value) {
  if (value is int) return value;
  return int.tryParse('$value') ?? 0;
}

DateTime? _date(Object? value) =>
    value is String ? DateTime.tryParse(value) : null;

Map<String, dynamic> _map(Object? value) =>
    value is Map ? Map<String, dynamic>.from(value) : const {};