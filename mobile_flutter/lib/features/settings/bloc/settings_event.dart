import 'package:equatable/equatable.dart';

import '../models/settings_models.dart';

sealed class SettingsEvent extends Equatable {
  const SettingsEvent();

  @override
  List<Object?> get props => [];
}

final class SettingsStarted extends SettingsEvent {
  const SettingsStarted(this.userId);

  final int userId;

  @override
  List<Object?> get props => [userId];
}

final class RefreshSettings extends SettingsEvent {
  const RefreshSettings(this.userId);

  final int userId;

  @override
  List<Object?> get props => [userId];
}

final class UpdatePreference extends SettingsEvent {
  const UpdatePreference({
    required this.category,
    required this.key,
    required this.value,
  });

  final String category;
  final String key;
  final Object? value;

  @override
  List<Object?> get props => [category, key, value];
}

final class UpdateLocalSetting extends SettingsEvent {
  const UpdateLocalSetting({
    required this.key,
    required this.value,
  });

  final String key;
  final bool value;

  @override
  List<Object?> get props => [key, value];
}

final class ToggleDashboardModule extends SettingsEvent {
  const ToggleDashboardModule(this.moduleId);

  final String moduleId;

  @override
  List<Object?> get props => [moduleId];
}

final class MoveDashboardModule extends SettingsEvent {
  const MoveDashboardModule({
    required this.moduleId,
    required this.direction,
  });

  final String moduleId;
  final int direction;

  @override
  List<Object?> get props => [moduleId, direction];
}

final class ResetDashboardLayout extends SettingsEvent {
  const ResetDashboardLayout();
}

final class SelectCareRecipient extends SettingsEvent {
  const SelectCareRecipient(this.userId);

  final int userId;

  @override
  List<Object?> get props => [userId];
}

final class LockCareRecipientSetting extends SettingsEvent {
  const LockCareRecipientSetting(this.input);

  final SettingsLockInput input;

  @override
  List<Object?> get props => [input];
}

final class UnlockCareRecipientSetting extends SettingsEvent {
  const UnlockCareRecipientSetting({
    required this.userId,
    required this.settingKey,
    required this.caregiverId,
  });

  final int userId;
  final String settingKey;
  final int caregiverId;

  @override
  List<Object?> get props => [userId, settingKey, caregiverId];
}

final class UpdateCaregiverPermission extends SettingsEvent {
  const UpdateCaregiverPermission({
    required this.userId,
    required this.caregiverId,
    required this.permissionType,
    required this.isGranted,
  });

  final int userId;
  final int caregiverId;
  final String permissionType;
  final bool isGranted;

  @override
  List<Object?> get props =>
      [userId, caregiverId, permissionType, isGranted];
}

final class RedeemOrganizationCode extends SettingsEvent {
  const RedeemOrganizationCode(this.code);

  final String code;

  @override
  List<Object?> get props => [code];
}

final class DeleteAccountRequested extends SettingsEvent {
  const DeleteAccountRequested();
}