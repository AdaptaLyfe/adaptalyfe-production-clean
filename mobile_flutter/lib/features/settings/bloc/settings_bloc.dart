import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../../../models/user_model.dart';
import '../data/settings_repository.dart';
import '../models/settings_models.dart';
import 'settings_event.dart';
import 'settings_state.dart';

const _invalidInvitationCodeMessage =
    'Invalid invitation code. Please check and try again.';
const _genericInvitationCodeError =
    'Unable to redeem invitation code. Please try again.';

EventTransformer<T> _sequential<T>() {
  return (events, mapper) => events.asyncExpand(mapper);
}

class SettingsBloc extends Bloc<SettingsEvent, SettingsState> {
  SettingsBloc(this.repository) : super(const SettingsState()) {
    on<SettingsStarted>(_load);
    on<RefreshSettings>(_load);
    on<UpdatePreference>(
      _updatePreference,
      transformer: _sequential(),
    );
    on<UpdateLocalSetting>(_updateLocalSetting);
    on<ToggleDashboardModule>(
      _toggleDashboardModule,
      transformer: _sequential(),
    );
    on<MoveDashboardModule>(
      _moveDashboardModule,
      transformer: _sequential(),
    );
    on<ResetDashboardLayout>(
      _resetDashboardLayout,
      transformer: _sequential(),
    );
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
  int? _loadedUserId;
  int _loadGeneration = 0;
  Future<void> _preferenceWriteQueue = Future<void>.value();

  Future<UserPreferences> _persistPreferences(
    Map<String, dynamic> payload,
  ) {
    final result = _preferenceWriteQueue.then(
      (_) => repository.updatePreferences(payload),
    );
    _preferenceWriteQueue = result.then<void>(
      (_) {},
      onError: (Object error, StackTrace stackTrace) {},
    );
    return result;
  }

  Future<void> _load(
    SettingsEvent event,
    Emitter<SettingsState> emit,
  ) async {
    final loadGeneration = ++_loadGeneration;
    final userId = event is SettingsStarted
        ? event.userId
        : (event as RefreshSettings).userId;
    final userChanged = _loadedUserId != null && _loadedUserId != userId;
    _loadedUserId = userId;
    var loadingState = state.copyWith(
      status: SettingsStatus.loading,
      busyKey: null,
      errorMessage: null,
      actionMessage: null,
      sessionInvalid: false,
    );
    if (userChanged) {
      loadingState = loadingState.copyWith(
        user: null,
        preferences: const UserPreferences(),
        localSettings: const LocalUserSettings(),
        dashboardModules: defaultDashboardModules,
        lockedSettings: const [],
        careRecipients: const [],
        selectedRecipientId: null,
        managedLockedSettings: const [],
        permissions: const [],
        organizationMembership: null,
      );
    }
    emit(loadingState);

    try {
      final coreSettings = await Future.wait<Object>([
        repository.getCurrentUser(),
        repository.getPreferences(),
      ]);
      if (loadGeneration != _loadGeneration) return;
      emit(
        state.copyWith(
          user: coreSettings[0] as UserModel,
          preferences: coreSettings[1] as UserPreferences,
        ),
      );

      final results = await Future.wait<Object?>([
        repository.loadDashboardLayout(userId),
        repository.getLockedSettings(userId),
        repository.getCareRecipients(),
        repository.getOrganizationMembership(),
        repository.loadLocalSettings(userId),
      ]);
      if (loadGeneration != _loadGeneration) return;
      final recipients = results[2] as List<Map<String, dynamic>>;
      var selectedRecipientId =
          userChanged ? null : state.selectedRecipientId;
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
      if (loadGeneration != _loadGeneration) return;

      emit(
        state.copyWith(
          status: SettingsStatus.loaded,
          dashboardModules: results[0] as List<DashboardModuleModel>,
          lockedSettings: results[1] as List<LockedSettingModel>,
          careRecipients: recipients,
          selectedRecipientId: selectedRecipientId,
          managedLockedSettings: managedLocks,
          permissions: permissions,
          organizationMembership: results[3],
          localSettings: results[4] as LocalUserSettings,
          busyKey: null,
          errorMessage: null,
        ),
      );
    } on ApiException catch (error) {
      if (loadGeneration != _loadGeneration) return;
      emit(
        state.copyWith(
          status: SettingsStatus.failure,
          errorMessage: error.message,
          sessionInvalid: error.type == ApiErrorType.unauthorized,
        ),
      );
    } catch (error) {
      if (loadGeneration != _loadGeneration) return;
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
    final previousPreferences = state.preferences;
    final updatedCategory = {
      ...state.preferences.category(event.category),
      event.key: event.value,
    };
    final updatedPreferences =
        state.preferences.withCategory(event.category, updatedCategory);
    final apiCategory = event.category == 'adaptiveFeatures'
        ? 'behaviorPatterns'
        : event.category;
    final apiValues = event.category == 'adaptiveFeatures'
        ? {
            ...state.behavior,
            'adaptiveFeatures': updatedCategory,
          }
        : updatedCategory;
    final shouldAutoSave = state.localSettings.autoSave;
    emit(
      state.copyWith(
        preferences: updatedPreferences,
        status: shouldAutoSave ? SettingsStatus.saving : SettingsStatus.loaded,
        busyKey: shouldAutoSave ? '${event.category}.${event.key}' : null,
        errorMessage: null,
        actionMessage: shouldAutoSave
            ? null
            : 'Changes will be saved when you tap Save Settings.',
      ),
    );
    if (!shouldAutoSave) return;

    try {
      final savedPreferences = await _persistPreferences({
        apiCategory: apiValues,
      });
      emit(
        state.copyWith(
          status: SettingsStatus.loaded,
          preferences: savedPreferences,
          busyKey: null,
          actionMessage: 'Settings saved.',
          errorMessage: null,
        ),
      );
    } on ApiException catch (error) {
      emit(
        state.copyWith(
          status: SettingsStatus.loaded,
          preferences: previousPreferences,
          busyKey: null,
          errorMessage: error.message,
          sessionInvalid: error.type == ApiErrorType.unauthorized,
        ),
      );
    } catch (error) {
      emit(
        state.copyWith(
          status: SettingsStatus.loaded,
          preferences: previousPreferences,
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
    await repository.saveLocalSettings(_requireLoadedUserId(), updated);
    emit(state.copyWith(localSettings: updated, actionMessage: 'Settings saved.'));
  }

  Future<void> _toggleDashboardModule(
    ToggleDashboardModule event,
    Emitter<SettingsState> emit,
  ) async {
    final modules = _normalizeDashboardModules(state.dashboardModules
        .map(
          (module) => module.id == event.moduleId
              ? module.copyWith(enabled: !module.enabled)
              : module,
        )
        .toList());
    await _persistDashboardLayout(
      modules,
      () => repository.saveDashboardLayout(_requireLoadedUserId(), modules),
      emit,
    );
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
    final ordered = _normalizeDashboardModules(modules);
    await _persistDashboardLayout(
      ordered,
      () => repository.saveDashboardLayout(_requireLoadedUserId(), ordered),
      emit,
    );
  }

  Future<void> _resetDashboardLayout(
    ResetDashboardLayout event,
    Emitter<SettingsState> emit,
  ) async {
    await _persistDashboardLayout(
      _normalizeDashboardModules(defaultDashboardModules),
      () => repository.resetDashboardLayout(_requireLoadedUserId()),
      emit,
      successMessage: 'Dashboard restored to defaults.',
    );
  }

  Future<void> _persistDashboardLayout(
    List<DashboardModuleModel> modules,
    Future<void> Function() persist,
    Emitter<SettingsState> emit, {
    String successMessage = 'Dashboard saved.',
  }) async {
    final previous = state.dashboardModules;
    emit(
      state.copyWith(
        status: SettingsStatus.saving,
        dashboardModules: modules,
        busyKey: 'dashboard',
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await persist();
      emit(
        state.copyWith(
          status: SettingsStatus.loaded,
          dashboardModules: modules,
          busyKey: null,
          actionMessage: successMessage,
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } catch (error) {
      emit(
        state.copyWith(
          status: SettingsStatus.loaded,
          dashboardModules: previous,
          busyKey: null,
          actionMessage: null,
          errorMessage: _messageFor(error),
          sessionInvalid:
              error is ApiException && error.type == ApiErrorType.unauthorized,
        ),
      );
    }
  }

  int _requireLoadedUserId() {
    final userId = _loadedUserId;
    if (userId == null) {
      throw StateError('Dashboard layout has not been loaded for a user.');
    }
    return userId;
  }

  List<DashboardModuleModel> _normalizeDashboardModules(
    List<DashboardModuleModel> modules,
  ) {
    final seen = <String>{};
    final normalized = <DashboardModuleModel>[];
    for (final module in modules) {
      if (seen.add(module.id)) normalized.add(module);
    }
    return [
      for (var index = 0; index < normalized.length; index++)
        normalized[index].copyWith(order: index),
    ];
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
    emit(
      state.copyWith(
        status: SettingsStatus.saving,
        busyKey: 'org-code',
        errorMessage: null,
        actionMessage: null,
      ),
    );
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
        'reducedMotion': false,
        'compactMode': false,
        'quickActionsEnabled': true,
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
        'adaptiveFeatures': <String, dynamic>{},
      },
      adaptiveFeatures: {},
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
      final preferences = await _persistPreferences(
        _preferencesPayload(defaults),
      );
      await repository.saveLocalSettings(
        _requireLoadedUserId(),
        const LocalUserSettings(),
      );
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
      final preferences = await _persistPreferences(
        _preferencesPayload(state.preferences),
      );
      await repository.saveLocalSettings(
        _requireLoadedUserId(),
        state.localSettings,
      );
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
      'behaviorPatterns': {
        ...preferences.behaviorPatterns,
        if (preferences.adaptiveFeatures.isNotEmpty)
          'adaptiveFeatures': preferences.adaptiveFeatures,
      },
    };
  }

  void _emitActionError(
    Emitter<SettingsState> emit,
    ApiException? error,
    String busyKey,
  ) {
    final message = busyKey == 'org-code'
        ? _organizationCodeErrorMessage(error)
        : error?.message ?? 'Unable to save this setting.';
    emit(
      state.copyWith(
        status: SettingsStatus.loaded,
        busyKey: null,
        errorMessage: message,
        sessionInvalid: error?.type == ApiErrorType.unauthorized,
      ),
    );
  }

  String _organizationCodeErrorMessage(ApiException? error) {
    final rawMessage = error?.message.toLowerCase() ?? '';
    if (error?.statusCode == 404 ||
        rawMessage.contains('invalid organization code')) {
      return _invalidInvitationCodeMessage;
    }
    return _genericInvitationCodeError;
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