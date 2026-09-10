import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../../../models/user_model.dart';
import '../data/settings_repository.dart';
import '../models/settings_models.dart';
import 'settings_event.dart';
import 'settings_state.dart';

class SettingsBloc extends Bloc<SettingsEvent, SettingsState> {
  SettingsBloc(this.repository) : super(const SettingsState()) {
    on<SettingsStarted>(_load);
    on<RefreshSettings>(_load);
    on<UpdatePreference>(_updatePreference);
    on<UpdateLocalSetting>(_updateLocalSetting);
    on<ToggleDashboardModule>(_toggleDashboardModule);
    on<MoveDashboardModule>(_moveDashboardModule);
    on<ResetDashboardLayout>(_resetDashboardLayout);
    on<SelectCareRecipient>(_selectCareRecipient);
    on<LockCareRecipientSetting>(_lockCareRecipientSetting);
    on<UnlockCareRecipientSetting>(_unlockCareRecipientSetting);
    on<UpdateCaregiverPermission>(_updateCaregiverPermission);
    on<RedeemOrganizationCode>(_redeemOrganizationCode);
    on<DeleteAccountRequested>(_deleteAccount);
    on<ResetSettingsRequested>(_resetSettings);
    on<SaveSettingsRequested>(_saveSettings);
    on<TestVoiceSettingsRequested>(_testVoiceSettings);
  }

  final SettingsRepository repository;

  Future<void> _load(
    SettingsEvent event,
    Emitter<SettingsState> emit,
  ) async {
    final userId = event is SettingsStarted
        ? event.userId
        : (event as RefreshSettings).userId;
    emit(
      state.copyWith(
        status: SettingsStatus.loading,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );

    try {
      final results = await Future.wait<Object?>([
        repository.getCurrentUser(),
        repository.getPreferences(),
        repository.loadDashboardLayout(),
        repository.getLockedSettings(userId),
        repository.getCareRecipients(),
        repository.getOrganizationMembership(),
        repository.loadLocalSettings(),
      ]);
      final recipients = results[4] as List<Map<String, dynamic>>;
      var selectedRecipientId = state.selectedRecipientId;
      if (selectedRecipientId == null && recipients.isNotEmpty) {
        selectedRecipientId =
            int.tryParse('${recipients.first['userId'] ?? 0}');
      }

      var managedLocks = const <LockedSettingModel>[];
      var permissions = const <CaregiverPermissionModel>[];
      if (selectedRecipientId != null && selectedRecipientId > 0) {
        final caregiverData = await Future.wait<Object>([
          repository.getLockedSettings(selectedRecipientId),
          repository.getPermissions(selectedRecipientId, userId),
        ]);
        managedLocks = caregiverData[0] as List<LockedSettingModel>;
        permissions = caregiverData[1] as List<CaregiverPermissionModel>;
      }

      emit(
        state.copyWith(
          status: SettingsStatus.loaded,
          user: results[0] as UserModel,
          preferences: results[1] as UserPreferences,
          dashboardModules: results[2] as List<DashboardModuleModel>,
          lockedSettings: results[3] as List<LockedSettingModel>,
          careRecipients: recipients,
          selectedRecipientId: selectedRecipientId,
          managedLockedSettings: managedLocks,
          permissions: permissions,
          organizationMembership: results[5],
          localSettings: results[6] as LocalUserSettings,
          busyKey: null,
          errorMessage: null,
        ),
      );
    } on ApiException catch (error) {
      emit(
        state.copyWith(
          status: SettingsStatus.failure,
          errorMessage: error.message,
          sessionInvalid: error.type == ApiErrorType.unauthorized,
        ),
      );
    } catch (error) {
      emit(
        state.copyWith(
          status: SettingsStatus.failure,
          errorMessage: _messageFor(error),
        ),
      );
    }
  }

  Future<void> _updatePreference(
    UpdatePreference event,
    Emitter<SettingsState> emit,
  ) async {
    final updatedCategory = {
      ...state.preferences.category(event.category),
      event.key: event.value,
    };
    final apiCategory =
        event.category == 'adaptiveFeatures' ? 'behaviorPatterns' : event.category;
    final apiValues = event.category == 'adaptiveFeatures'
        ? {
            ...state.behavior,
            'adaptiveFeatures': updatedCategory,
          }
        : updatedCategory;
    emit(
      state.copyWith(
        status: SettingsStatus.saving,
        busyKey: '${event.category}.${event.key}',
        errorMessage: null,
      ),
    );
    try {
      final preferences = await repository.updatePreferences({
        apiCategory: apiValues,
      });
      emit(
        state.copyWith(
          status: SettingsStatus.loaded,
          preferences: preferences,
          busyKey: null,
          actionMessage: 'Settings saved.',
          errorMessage: null,
        ),
      );
    } on ApiException catch (error) {
      _emitActionError(emit, error, '${event.category}.${event.key}');
    } catch (error) {
      emit(
        state.copyWith(
          status: SettingsStatus.loaded,
          busyKey: null,
          errorMessage: _messageFor(error),
        ),
      );
    }
  }

  Future<void> _updateLocalSetting(
    UpdateLocalSetting event,
    Emitter<SettingsState> emit,
  ) async {
    final current = state.localSettings;
    final updated = switch (event.key) {
      'premiumFeatures' => current.copyWith(premiumFeatures: event.value),
      'autoSave' => current.copyWith(autoSave: event.value),
      'privacyMode' => current.copyWith(privacyMode: event.value),
      'locationTracking' => current.copyWith(locationTracking: event.value),
      'emergencyAlerts' => current.copyWith(emergencyAlerts: event.value),
      'caregiverAccess' => current.copyWith(caregiverAccess: event.value),
      'medicalDataSharing' =>
        current.copyWith(medicalDataSharing: event.value),
      'automaticCheckIns' =>
        current.copyWith(automaticCheckIns: event.value),
      _ => current,
    };
    await repository.saveLocalSettings(updated);
    emit(state.copyWith(localSettings: updated, actionMessage: 'Settings saved.'));
  }

  Future<void> _toggleDashboardModule(
    ToggleDashboardModule event,
    Emitter<SettingsState> emit,
  ) async {
    final modules = state.dashboardModules
        .map(
          (module) => module.id == event.moduleId
              ? module.copyWith(enabled: !module.enabled)
              : module,
        )
        .toList();
    await repository.saveDashboardLayout(modules);
    emit(state.copyWith(dashboardModules: modules, actionMessage: 'Dashboard saved.'));
  }

  Future<void> _moveDashboardModule(
    MoveDashboardModule event,
    Emitter<SettingsState> emit,
  ) async {
    final modules = [...state.dashboardModules];
    final index = modules.indexWhere((module) => module.id == event.moduleId);
    final nextIndex = index + event.direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= modules.length) return;
    final item = modules.removeAt(index);
    modules.insert(nextIndex, item);
    final ordered = [
      for (var i = 0; i < modules.length; i++) modules[i].copyWith(order: i),
    ];
    await repository.saveDashboardLayout(ordered);
    emit(state.copyWith(dashboardModules: ordered, actionMessage: 'Dashboard saved.'));
  }

  Future<void> _resetDashboardLayout(
    ResetDashboardLayout event,
    Emitter<SettingsState> emit,
  ) async {
    await repository.resetDashboardLayout();
    emit(
      state.copyWith(
        dashboardModules: defaultDashboardModules,
        actionMessage: 'Dashboard restored to defaults.',
      ),
    );
  }

  Future<void> _selectCareRecipient(
    SelectCareRecipient event,
    Emitter<SettingsState> emit,
  ) async {
    emit(state.copyWith(
      selectedRecipientId: event.userId,
      busyKey: 'recipient',
      errorMessage: null,
    ));
    try {
      final results = await Future.wait<Object>([
        repository.getLockedSettings(event.userId),
        repository.getPermissions(event.userId, state.user?.id ?? 0),
      ]);
      emit(
        state.copyWith(
          status: SettingsStatus.loaded,
          managedLockedSettings: results[0] as List<LockedSettingModel>,
          permissions: results[1] as List<CaregiverPermissionModel>,
          busyKey: null,
        ),
      );
    } catch (error) {
      emit(state.copyWith(
        busyKey: null,
        errorMessage: _messageFor(error),
      ));
    }
  }

  Future<void> _lockCareRecipientSetting(
    LockCareRecipientSetting event,
    Emitter<SettingsState> emit,
  ) async {
    emit(state.copyWith(status: SettingsStatus.saving, busyKey: 'lock'));
    try {
      final locked = await repository.lockSetting(event.input);
      emit(
        state.copyWith(
          status: SettingsStatus.loaded,
          managedLockedSettings: [
            locked,
            ...state.managedLockedSettings
                .where((item) => item.settingKey != locked.settingKey),
          ],
          busyKey: null,
          actionMessage: 'Setting locked for your care recipient.',
        ),
      );
    } on ApiException catch (error) {
      _emitActionError(emit, error, 'lock');
    } catch (error) {
      _emitUnexpectedActionError(emit, error, 'lock');
    }
  }

  Future<void> _unlockCareRecipientSetting(
    UnlockCareRecipientSetting event,
    Emitter<SettingsState> emit,
  ) async {
    emit(state.copyWith(status: SettingsStatus.saving, busyKey: 'unlock'));
    try {
      await repository.unlockSetting(
        userId: event.userId,
        settingKey: event.settingKey,
        caregiverId: event.caregiverId,
      );
      emit(
        state.copyWith(
          status: SettingsStatus.loaded,
          managedLockedSettings: state.managedLockedSettings
              .where((item) => item.settingKey != event.settingKey)
              .toList(),
          busyKey: null,
          actionMessage: 'Setting unlocked.',
        ),
      );
    } on ApiException catch (error) {
      _emitActionError(emit, error, 'unlock');
    } catch (error) {
      _emitUnexpectedActionError(emit, error, 'unlock');
    }
  }

  Future<void> _updateCaregiverPermission(
    UpdateCaregiverPermission event,
    Emitter<SettingsState> emit,
  ) async {
    emit(state.copyWith(status: SettingsStatus.saving, busyKey: 'permission'));
    try {
      final permission = await repository.setPermission(
        userId: event.userId,
        caregiverId: event.caregiverId,
        permissionType: event.permissionType,
        isGranted: event.isGranted,
      );
      emit(
        state.copyWith(
          status: SettingsStatus.loaded,
          permissions: [
            permission,
            ...state.permissions.where(
              (item) => item.permissionType != permission.permissionType,
            ),
          ],
          busyKey: null,
          actionMessage: 'Caregiver permission updated.',
        ),
      );
    } on ApiException catch (error) {
      _emitActionError(emit, error, 'permission');
    } catch (error) {
      _emitUnexpectedActionError(emit, error, 'permission');
    }
  }

  Future<void> _redeemOrganizationCode(
    RedeemOrganizationCode event,
    Emitter<SettingsState> emit,
  ) async {
    emit(state.copyWith(status: SettingsStatus.saving, busyKey: 'org-code'));
    try {
      final orgName = await repository.redeemOrganizationCode(event.code);
      final membership = await repository.getOrganizationMembership();
      emit(
        state.copyWith(
          status: SettingsStatus.loaded,
          organizationMembership: membership,
          busyKey: null,
          actionMessage: 'Organization access granted through $orgName.',
        ),
      );
    } on ApiException catch (error) {
      _emitActionError(emit, error, 'org-code');
    } catch (error) {
      _emitUnexpectedActionError(emit, error, 'org-code');
    }
  }

  Future<void> _deleteAccount(
    DeleteAccountRequested event,
    Emitter<SettingsState> emit,
  ) async {
    emit(state.copyWith(status: SettingsStatus.saving, busyKey: 'delete'));
    try {
      await repository.deleteAccount();
      emit(state.copyWith(
        status: SettingsStatus.loaded,
        busyKey: null,
        accountDeleted: true,
        actionMessage: 'Your account was deleted.',
      ));
    } on ApiException catch (error) {
      _emitActionError(emit, error, 'delete');
    } catch (error) {
      _emitUnexpectedActionError(emit, error, 'delete');
    }
  }

  Future<void> _resetSettings(
    ResetSettingsRequested event,
    Emitter<SettingsState> emit,
  ) async {
    const defaults = UserPreferences(
      notificationSettings: {
        'notificationsEnabled': true,
      },
      reminderTiming: {
        'defaultMinutes': 15,
        'taskReminders': true,
        'overdueReminders': true,
      },
      themeSettings: {
        'theme': 'light',
        'colorScheme': 'default',
        'fontSize': 16,
        'highContrast': false,
      },
      accessibilitySettings: {
        'voiceGuidance': true,
        'speechRate': 1.0,
        'voiceVolume': 0.8,
      },
      behaviorPatterns: {
        'preferredTaskTime': 'anytime',
        'reminderStyle': 'standard',
        'motivationLevel': 'moderate',
        'supportLevel': 'standard',
      },
    );

    emit(
      state.copyWith(
        status: SettingsStatus.saving,
        busyKey: 'reset',
        errorMessage: null,
        actionMessage: null,
      ),
    );

    try {
      final preferences = await repository.updatePreferences(
        _preferencesPayload(defaults),
      );
      await repository.saveLocalSettings(const LocalUserSettings());
      emit(
        state.copyWith(
          status: SettingsStatus.loaded,
          preferences: preferences,
          localSettings: const LocalUserSettings(),
          busyKey: null,
          actionMessage: 'All settings have been reset to defaults.',
        ),
      );
    } on ApiException catch (error) {
      _emitActionError(emit, error, 'reset');
    } catch (error) {
      _emitUnexpectedActionError(emit, error, 'reset');
    }
  }

  Future<void> _saveSettings(
    SaveSettingsRequested event,
    Emitter<SettingsState> emit,
  ) async {
    emit(
      state.copyWith(
        status: SettingsStatus.saving,
        busyKey: 'save',
        errorMessage: null,
        actionMessage: null,
      ),
    );

    try {
      final preferences = await repository.updatePreferences(
        _preferencesPayload(state.preferences),
      );
      await repository.saveLocalSettings(state.localSettings);
      emit(
        state.copyWith(
          status: SettingsStatus.loaded,
          preferences: preferences,
          busyKey: null,
          actionMessage: 'Your preferences have been saved successfully.',
        ),
      );
    } on ApiException catch (error) {
      _emitActionError(emit, error, 'save');
    } catch (error) {
      _emitUnexpectedActionError(emit, error, 'save');
    }
  }

  Future<void> _testVoiceSettings(
    TestVoiceSettingsRequested event,
    Emitter<SettingsState> emit,
  ) async {
    final rate =
        state.accessibility['voiceSpeed'] ?? state.accessibility['speechRate'] ?? 1.0;
    emit(
      state.copyWith(
        actionMessage: 'Voice settings test requested at ${rate}x speed.',
        errorMessage: null,
      ),
    );
  }

  Map<String, dynamic> _preferencesPayload(UserPreferences preferences) {
    return {
      'notificationSettings': preferences.notificationSettings,
      'reminderTiming': preferences.reminderTiming,
      'themeSettings': preferences.themeSettings,
      'accessibilitySettings': preferences.accessibilitySettings,
      'behaviorPatterns': preferences.behaviorPatterns,
    };
  }

  void _emitActionError(
    Emitter<SettingsState> emit,
    ApiException? error,
    String busyKey,
  ) {
    emit(
      state.copyWith(
        status: SettingsStatus.loaded,
        busyKey: null,
        errorMessage: error?.message ?? 'Unable to save this setting.',
        sessionInvalid: error?.type == ApiErrorType.unauthorized,
      ),
    );
  }

  void _emitUnexpectedActionError(
    Emitter<SettingsState> emit,
    Object error,
    String busyKey,
  ) {
    emit(
      state.copyWith(
        status: SettingsStatus.loaded,
        busyKey: null,
        errorMessage: _messageFor(error),
      ),
    );
  }

  String _messageFor(Object error) {
    if (error is ApiException) return error.message;
    if (error is FormatException) return error.message;
    return 'Unable to load your settings. Please try again.';
  }
}