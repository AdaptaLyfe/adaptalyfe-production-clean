import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../bloc/settings_bloc.dart';
import '../bloc/settings_event.dart';
import '../bloc/settings_state.dart';
import '../models/settings_models.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({required this.userId, super.key});

  final int userId;

  @override
  Widget build(BuildContext context) {
    return BlocListener<SettingsBloc, SettingsState>(
      listenWhen: (previous, current) =>
          previous.errorMessage != current.errorMessage ||
          previous.actionMessage != current.actionMessage ||
          previous.sessionInvalid != current.sessionInvalid ||
          previous.accountDeleted != current.accountDeleted,
      listener: (context, state) {
        if (state.sessionInvalid || state.accountDeleted) {
          context.go('/login');
          return;
        }
        final message = state.errorMessage ?? state.actionMessage;
        if (message != null) {
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(SnackBar(content: Text(message)));
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Settings'),
          actions: [
            IconButton(
              tooltip: 'Refresh settings',
              onPressed: () {
                final userId = context.read<SettingsBloc>().state.user?.id;
                if (userId != null) {
                  context.read<SettingsBloc>().add(RefreshSettings(userId));
                }
              },
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        body: _SettingsBody(userId: userId),
      ),
    );
  }
}

class _SettingsBody extends StatelessWidget {
  const _SettingsBody({required this.userId});

  final int userId;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<SettingsBloc, SettingsState>(
      builder: (context, state) {
        if (state.isLoading && state.user == null) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state.status == SettingsStatus.failure && state.user == null) {
          return _SettingsError(
            message: state.errorMessage ?? 'Unable to load your settings.',
            onRetry: () => context
                .read<SettingsBloc>()
                .add(RefreshSettings(state.user?.id ?? userId)),
          );
        }

        final color = _colorForScheme('${state.theme['colorScheme'] ?? 'default'}');
        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [color.withOpacity(.12), const Color(0xFFF5F3FF), const Color(0xFFF0FDFA)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: RefreshIndicator(
            onRefresh: () => _refresh(context),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
              children: [
                _ProfileCard(state: state),
                const SizedBox(height: 16),
                _AppearanceCard(state: state),
                const SizedBox(height: 16),
                _AccessibilityCard(state: state),
                const SizedBox(height: 16),
                _NotificationCard(state: state),
                const SizedBox(height: 16),
                _BehaviorCard(state: state),
                const SizedBox(height: 16),
                _AdaptiveFeaturesCard(state: state),
                const SizedBox(height: 16),
                _OtherPreferencesCard(state: state),
                const SizedBox(height: 16),
                _DashboardPreferencesCard(state: state),
                const SizedBox(height: 16),
                _ProtectedSettingsCard(state: state),
                if (state.careRecipients.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  _CaregiverControlsCard(state: state),
                ],
                const SizedBox(height: 16),
                _OrganizationAccessCard(state: state),
                const SizedBox(height: 16),
                _DangerZoneCard(state: state),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _refresh(BuildContext context) async {
    final bloc = context.read<SettingsBloc>();
    bloc.add(RefreshSettings(bloc.state.user?.id ?? userId));
    await bloc.stream.firstWhere(
      (state) =>
          (state.status == SettingsStatus.loaded ||
              state.status == SettingsStatus.failure) &&
          !state.isSaving,
    );
  }
}

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({required this.state});

  final SettingsState state;

  @override
  Widget build(BuildContext context) {
    final user = state.user;
    return _Panel(
      child: Row(
        children: [
          const CircleAvatar(
            radius: 28,
            backgroundColor: Color(0xFFE0E7FF),
            child: Icon(Icons.person_rounded, color: Color(0xFF4338CA), size: 30),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user?.name?.trim().isNotEmpty == true
                      ? user!.name!.trim()
                      : user?.username ?? 'Your profile',
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user?.email?.trim().isNotEmpty == true
                      ? user!.email!
                      : '@${user?.username ?? ''}',
                  style: const TextStyle(color: Color(0xFF6B7280), fontSize: 13),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Profile details are managed by your Adaptalyfe account.',
                  style: TextStyle(color: Color(0xFF6B7280), fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AppearanceCard extends StatelessWidget {
  const _AppearanceCard({required this.state});

  final SettingsState state;

  @override
  Widget build(BuildContext context) {
    final theme = state.theme;
    final themeValue = _oneOf('${theme['colorScheme'] ?? theme['theme'] ?? 'light'}', [
      'light',
      'dark',
      'auto',
      'default',
      'green',
      'purple',
      'orange',
      'teal',
      'warm',
    ]);
    return _Panel(
      title: 'Appearance',
      subtitle: 'Customize the look and feel of your dashboard.',
      icon: Icons.palette_outlined,
      child: Column(
        children: [
          _SelectRow(
            label: 'Theme',
            value: themeValue,
            options: const ['light', 'dark', 'auto'],
            onChanged: (value) => _update(context, 'themeSettings', 'theme', value),
          ),
          const SizedBox(height: 14),
          _SelectRow(
            label: 'Color scheme',
            value: _oneOf('${theme['colorScheme'] ?? 'default'}', const [
              'default',
              'green',
              'purple',
              'orange',
              'teal',
              'warm',
            ]),
            options: const ['default', 'green', 'purple', 'orange', 'teal', 'warm'],
            onChanged: (value) => _update(context, 'themeSettings', 'colorScheme', value),
          ),
          const SizedBox(height: 14),
          _SliderRow(
            label: 'Text size',
            value: _double(theme['fontSize'], 16).clamp(12, 24).toDouble(),
            min: 12,
            max: 24,
            divisions: 12,
            suffix: 'px',
            onChanged: (value) => _update(context, 'themeSettings', 'fontSize', value.round()),
          ),
          _SettingSwitch(
            label: 'High contrast',
            description: 'Increases contrast for better visibility.',
            value: _bool(theme['highContrast']),
            onChanged: (value) => _update(context, 'themeSettings', 'highContrast', value),
          ),
          _SettingSwitch(
            label: 'Reduced motion',
            description: 'Minimizes animations and transitions.',
            value: _bool(theme['reducedMotion']),
            onChanged: (value) => _update(context, 'themeSettings', 'reducedMotion', value),
          ),
          _SettingSwitch(
            label: 'Compact mode',
            description: 'Reduces spacing to show more content.',
            value: _bool(theme['compactMode']),
            onChanged: (value) => _update(context, 'themeSettings', 'compactMode', value),
          ),
          _SettingSwitch(
            label: 'Quick Actions Bar',
            description: 'Show quick actions on the dashboard.',
            value: _bool(theme['quickActionsEnabled'], fallback: true),
            onChanged: (value) =>
                _update(context, 'themeSettings', 'quickActionsEnabled', value),
          ),
        ],
      ),
    );
  }
}

class _AccessibilityCard extends StatelessWidget {
  const _AccessibilityCard({required this.state});

  final SettingsState state;

  @override
  Widget build(BuildContext context) {
    final settings = state.accessibility;
    return _Panel(
      title: 'Accessibility',
      subtitle: 'Adjust voice, reading, and navigation preferences.',
      icon: Icons.accessibility_new_rounded,
      child: Column(
        children: [
          _SettingSwitch(
            label: 'Text-to-Speech',
            description: 'Read content aloud.',
            value: _bool(settings['textToSpeech'] ?? settings['textToSpeechEnabled']),
            onChanged: (value) =>
                _update(context, 'accessibilitySettings', 'textToSpeech', value),
          ),
          _SettingSwitch(
            label: 'Voice guidance',
            description: 'Audio instructions and confirmations.',
            value: _bool(settings['voiceGuidance']),
            onChanged: (value) =>
                _update(context, 'accessibilitySettings', 'voiceGuidance', value),
          ),
          _SettingSwitch(
            label: 'Screen reader support',
            description: 'Optimize labels and content for screen readers.',
            value: _bool(settings['screenReader']),
            onChanged: (value) =>
                _update(context, 'accessibilitySettings', 'screenReader', value),
          ),
          _SettingSwitch(
            label: 'Keyboard navigation',
            description: 'Keep keyboard navigation preferences enabled.',
            value: _bool(settings['keyboardNavigation']),
            onChanged: (value) => _update(
                context, 'accessibilitySettings', 'keyboardNavigation', value),
          ),
          _SettingSwitch(
            label: 'Focus indicators',
            description: 'Make the active control easier to see.',
            value: _bool(settings['focusIndicators']),
            onChanged: (value) =>
                _update(context, 'accessibilitySettings', 'focusIndicators', value),
          ),
          _SliderRow(
            label: 'Speech rate',
            value: _double(settings['speechRate'], 1).clamp(.5, 2).toDouble(),
            min: .5,
            max: 2,
            divisions: 15,
            suffix: 'x',
            onChanged: (value) =>
                _update(context, 'accessibilitySettings', 'speechRate', value),
          ),
          _SliderRow(
            label: 'Voice volume',
            value: _double(settings['voiceVolume'] ?? settings['speechVolume'], .8)
                .clamp(0, 1)
                .toDouble(),
            min: 0,
            max: 1,
            divisions: 10,
            suffix: '',
            onChanged: (value) =>
                _update(context, 'accessibilitySettings', 'voiceVolume', value),
          ),
        ],
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.state});

  final SettingsState state;

  @override
  Widget build(BuildContext context) {
    final notifications = state.notifications;
    final reminders = state.reminders;
    return _Panel(
      title: 'Notifications & reminders',
      subtitle: 'Manage alerts and default reminder timing.',
      icon: Icons.notifications_none_rounded,
      child: Column(
        children: [
          _SettingSwitch(
            label: 'Enable notifications',
            description: 'Receive Adaptalyfe alerts and reminders.',
            value: _bool(
              notifications['notificationsEnabled'] ?? notifications['pushEnabled'],
              fallback: true,
            ),
            onChanged: (value) => _update(
              context,
              'notificationSettings',
              'notificationsEnabled',
              value,
            ),
          ),
          _SettingSwitch(
            label: 'Task reminders',
            description: 'Receive reminders for scheduled tasks.',
            value: _bool(reminders['taskReminders'], fallback: true),
            onChanged: (value) =>
                _update(context, 'reminderTiming', 'taskReminders', value),
          ),
          _SettingSwitch(
            label: 'Overdue reminders',
            description: 'Be notified when a task is overdue.',
            value: _bool(reminders['overdueReminders'], fallback: true),
            onChanged: (value) =>
                _update(context, 'reminderTiming', 'overdueReminders', value),
          ),
          _SelectRow(
            label: 'Default reminder time',
            value: '${_intValue(reminders['defaultMinutes'] ?? reminders['taskReminders'], 15)}',
            options: const ['5', '15', '30', '60'],
            onChanged: (value) => _update(
              context,
              'reminderTiming',
              'defaultMinutes',
              int.parse(value),
            ),
          ),
        ],
      ),
    );
  }
}

class _BehaviorCard extends StatelessWidget {
  const _BehaviorCard({required this.state});

  final SettingsState state;

  @override
  Widget build(BuildContext context) {
    final behavior = state.behavior;
    return _Panel(
      title: 'Behavior preferences',
      subtitle: 'Tell Adaptalyfe how you prefer support and reminders.',
      icon: Icons.tune_rounded,
      child: Column(
        children: [
          _SelectRow(
            label: 'Preferred task time',
            value: _oneOf('${behavior['preferredTaskTime'] ?? 'anytime'}',
                const ['morning', 'afternoon', 'evening', 'anytime']),
            options: const ['morning', 'afternoon', 'evening', 'anytime'],
            onChanged: (value) =>
                _update(context, 'behaviorPatterns', 'preferredTaskTime', value),
          ),
          _SelectRow(
            label: 'Reminder style',
            value: _oneOf('${behavior['reminderStyle'] ?? 'standard'}',
                const ['gentle', 'standard', 'urgent']),
            options: const ['gentle', 'standard', 'urgent'],
            onChanged: (value) =>
                _update(context, 'behaviorPatterns', 'reminderStyle', value),
          ),
          _SelectRow(
            label: 'Motivation level',
            value: _oneOf('${behavior['motivationLevel'] ?? 'moderate'}',
                const ['low', 'moderate', 'high']),
            options: const ['low', 'moderate', 'high'],
            onChanged: (value) =>
                _update(context, 'behaviorPatterns', 'motivationLevel', value),
          ),
          _SelectRow(
            label: 'Support level',
            value: _oneOf('${behavior['supportLevel'] ?? 'standard'}',
                const ['minimal', 'standard', 'high']),
            options: const ['minimal', 'standard', 'high'],
            onChanged: (value) =>
                _update(context, 'behaviorPatterns', 'supportLevel', value),
          ),
        ],
      ),
    );
  }
}

class _AdaptiveFeaturesCard extends StatelessWidget {
  const _AdaptiveFeaturesCard({required this.state});

  final SettingsState state;

  @override
  Widget build(BuildContext context) {
    final adaptive = state.adaptive;
    return _Panel(
      title: 'Adaptive features',
      subtitle: 'Choose which personalized helpers are enabled.',
      icon: Icons.auto_awesome_rounded,
      child: Column(
        children: [
          for (final setting in const [
            ['smartReminders', 'Smart reminders', 'Adjust reminders to your patterns.'],
            ['contextualHelp', 'Contextual help', 'Show help based on the current task.'],
            ['progressPrediction', 'Progress prediction', 'Use patterns to estimate progress.'],
            ['moodBasedSuggestions', 'Mood-based suggestions', 'Tailor suggestions to mood check-ins.'],
            ['energyLevelAdjustments', 'Energy-level adjustments', 'Adapt support to reported energy.'],
          ])
            _SettingSwitch(
              label: setting[1],
              description: setting[2],
              value: _bool(adaptive[setting[0]]),
              onChanged: (value) =>
                  _update(context, 'adaptiveFeatures', setting[0], value),
            ),
        ],
      ),
    );
  }
}

class _OtherPreferencesCard extends StatelessWidget {
  const _OtherPreferencesCard({required this.state});

  final SettingsState state;

  @override
  Widget build(BuildContext context) {
    final local = state.localSettings;
    return _Panel(
      title: 'Other preferences',
      subtitle:
          'These options match the web settings that are currently stored on-device.',
      icon: Icons.tune_outlined,
      child: Column(
        children: [
          _SettingSwitch(
            label: 'Premium feature previews',
            description: 'Show premium feature options where available.',
            value: local.premiumFeatures,
            onChanged: (value) => _updateLocal(context, 'premiumFeatures', value),
          ),
          _SettingSwitch(
            label: 'Auto-save',
            description: 'Save changes automatically on this device.',
            value: local.autoSave,
            onChanged: (value) => _updateLocal(context, 'autoSave', value),
          ),
          _SettingSwitch(
            label: 'Privacy mode',
            description: 'Use the privacy preference already supported by the web settings.',
            value: local.privacyMode,
            onChanged: (value) => _updateLocal(context, 'privacyMode', value),
          ),
          _LocalProtectedSwitch(
            state: state,
            settingKey: 'locationTracking',
            label: 'Location tracking',
            description: 'Allow location-based safety features.',
            value: local.locationTracking,
          ),
          _LocalProtectedSwitch(
            state: state,
            settingKey: 'emergencyAlerts',
            label: 'Emergency alerts',
            description: 'Receive urgent safety notifications.',
            value: local.emergencyAlerts,
          ),
          _LocalProtectedSwitch(
            state: state,
            settingKey: 'caregiverAccess',
            label: 'Caregiver access',
            description: 'Allow connected caregivers to access supported information.',
            value: local.caregiverAccess,
          ),
          _LocalProtectedSwitch(
            state: state,
            settingKey: 'medicalDataSharing',
            label: 'Medical data sharing',
            description: 'Share supported medical information with caregivers.',
            value: local.medicalDataSharing,
          ),
          _LocalProtectedSwitch(
            state: state,
            settingKey: 'automaticCheckIns',
            label: 'Automatic check-ins',
            description: 'Enable scheduled check-in prompts.',
            value: local.automaticCheckIns,
          ),
          const SizedBox(height: 6),
          const Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'These local preferences are not sent to the server. Confirmed caregiver locks remain authoritative when present.',
              style: TextStyle(color: Color(0xFF6B7280), fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}

class _LocalProtectedSwitch extends StatelessWidget {
  const _LocalProtectedSwitch({
    required this.state,
    required this.settingKey,
    required this.label,
    required this.description,
    required this.value,
  });

  final SettingsState state;
  final String settingKey;
  final String label;
  final String description;
  final bool value;

  @override
  Widget build(BuildContext context) {
    final locked = _isLocalSettingLocked(state, settingKey);
    return _SettingSwitch(
      label: label,
      description: locked ? '$description Locked by your care team.' : description,
      value: value,
      onChanged: locked
          ? null
          : (nextValue) => _updateLocal(context, settingKey, nextValue),
    );
  }
}

class _DashboardPreferencesCard extends StatelessWidget {
  const _DashboardPreferencesCard({required this.state});

  final SettingsState state;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      title: 'Dashboard preferences',
      subtitle: 'Choose visible modules and their order on this device.',
      icon: Icons.dashboard_customize_outlined,
      trailing: TextButton(
        onPressed: () =>
            context.read<SettingsBloc>().add(const ResetDashboardLayout()),
        child: const Text('Reset'),
      ),
      child: Column(
        children: [
          for (var index = 0; index < state.dashboardModules.length; index++)
            _DashboardModuleRow(
              module: state.dashboardModules[index],
              isFirst: index == 0,
              isLast: index == state.dashboardModules.length - 1,
            ),
          const SizedBox(height: 8),
          const Text(
            'Module order is stored locally on this device, matching the existing dashboard layout preference.',
            style: TextStyle(color: Color(0xFF6B7280), fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _DashboardModuleRow extends StatelessWidget {
  const _DashboardModuleRow({
    required this.module,
    required this.isFirst,
    required this.isLast,
  });

  final DashboardModuleModel module;
  final bool isFirst;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<SettingsBloc>();
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(
        module.enabled ? Icons.visibility_rounded : Icons.visibility_off_outlined,
        color: module.enabled ? const Color(0xFF2563EB) : const Color(0xFF9CA3AF),
      ),
      title: Text(module.name),
      subtitle: Text(module.enabled ? 'Visible' : 'Hidden'),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            tooltip: 'Move up',
            onPressed: isFirst
                ? null
                : () => bloc.add(MoveDashboardModule(
                      moduleId: module.id,
                      direction: -1,
                    )),
            icon: const Icon(Icons.keyboard_arrow_up_rounded),
          ),
          IconButton(
            tooltip: 'Move down',
            onPressed: isLast
                ? null
                : () => bloc.add(MoveDashboardModule(
                      moduleId: module.id,
                      direction: 1,
                    )),
            icon: const Icon(Icons.keyboard_arrow_down_rounded),
          ),
          Switch(
            value: module.enabled,
            onChanged: (_) => bloc.add(ToggleDashboardModule(module.id)),
          ),
        ],
      ),
    );
  }
}

class _ProtectedSettingsCard extends StatelessWidget {
  const _ProtectedSettingsCard({required this.state});

  final SettingsState state;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      title: 'Caregiver-protected settings',
      subtitle: state.lockedSettings.isEmpty
          ? 'No settings are currently locked for your account.'
          : 'Some safety settings are managed by your care team.',
      icon: Icons.shield_outlined,
      child: state.lockedSettings.isEmpty
          ? const Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'If a setting is protected, it will appear here with the caregiver’s reason.',
                style: TextStyle(color: Color(0xFF6B7280), fontSize: 13),
              ),
            )
          : Column(
              children: state.lockedSettings
                  .where((setting) => setting.canUserView)
                  .map((setting) => _LockedSettingTile(setting: setting))
                  .toList(),
            ),
    );
  }
}

class _CaregiverControlsCard extends StatelessWidget {
  const _CaregiverControlsCard({required this.state});

  final SettingsState state;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<SettingsBloc>();
    final selectedId = state.selectedRecipientId;
    final recipient = state.careRecipients.firstWhere(
      (item) => '${item['userId']}' == '$selectedId',
      orElse: () => state.careRecipients.first,
    );
    final currentUserId = state.user?.id;
    return _Panel(
      title: 'Caregiver controls',
      subtitle: 'Manage existing protection and permission controls for your care recipients.',
      icon: Icons.manage_accounts_outlined,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DropdownButtonFormField<int>(
            value: selectedId,
            decoration: const InputDecoration(
              labelText: 'Care recipient',
              border: OutlineInputBorder(),
            ),
            items: state.careRecipients
                .map(
                  (item) => DropdownMenuItem<int>(
                    value: int.tryParse('${item['userId']}'),
                    child: Text('${item['userName'] ?? 'Care recipient'}'),
                  ),
                )
                .toList(),
            onChanged: (value) {
              if (value != null) bloc.add(SelectCareRecipient(value));
            },
          ),
          const SizedBox(height: 14),
          Text(
            'Protected settings for ${recipient['userName'] ?? 'this recipient'}',
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          if (state.managedLockedSettings.isEmpty)
            const Text(
              'No settings are locked.',
              style: TextStyle(color: Color(0xFF6B7280)),
            )
          else
            ...state.managedLockedSettings.map(
              (setting) => _ManagedLockTile(
                setting: setting,
                caregiverId: currentUserId ?? 0,
              ),
            ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: selectedId == null || currentUserId == null
                ? null
                : () => _showLockDialog(
                      context,
                      recipientId: selectedId,
                      caregiverId: currentUserId,
                    ),
            icon: const Icon(Icons.lock_outline_rounded),
            label: const Text('Lock a setting'),
          ),
          const Divider(height: 28),
          const Text(
            'Caregiver permissions',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          for (final permissionType in const [
            'location_tracking',
            'medication_management',
            'emergency_contacts',
            'safety_alerts',
            'financial_monitoring',
          ])
            _PermissionRow(
              permissionType: permissionType,
              permission: _permissionFor(state.permissions, permissionType),
              enabled: selectedId != null && currentUserId != null,
              onChanged: (value) => bloc.add(UpdateCaregiverPermission(
                userId: selectedId ?? 0,
                caregiverId: currentUserId ?? 0,
                permissionType: permissionType,
                isGranted: value,
              )),
            ),
        ],
      ),
    );
  }

  Future<void> _showLockDialog(
    BuildContext context, {
    required int recipientId,
    required int caregiverId,
  }) async {
    final keyController = TextEditingController();
    final valueController = TextEditingController(text: 'locked');
    final reasonController = TextEditingController();
    var canUserView = true;
    final input = await showDialog<SettingsLockInput>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Lock a setting'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: keyController,
                  decoration: const InputDecoration(
                    labelText: 'Setting key',
                    hintText: 'e.g. location_sharing',
                  ),
                ),
                TextField(
                  controller: valueController,
                  decoration: const InputDecoration(labelText: 'Setting value'),
                ),
                TextField(
                  controller: reasonController,
                  decoration: const InputDecoration(labelText: 'Reason'),
                  maxLines: 2,
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('User can view this setting'),
                  value: canUserView,
                  onChanged: (value) => setState(() => canUserView = value),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                if (keyController.text.trim().isEmpty ||
                    reasonController.text.trim().isEmpty) {
                  return;
                }
                Navigator.of(dialogContext).pop(
                  SettingsLockInput(
                    userId: recipientId,
                    settingKey: keyController.text.trim(),
                    settingValue: valueController.text.trim(),
                    lockedBy: caregiverId,
                    lockReason: reasonController.text.trim(),
                    canUserView: canUserView,
                  ),
                );
              },
              child: const Text('Lock'),
            ),
          ],
        ),
      ),
    );
    keyController.dispose();
    valueController.dispose();
    reasonController.dispose();
    if (input != null && context.mounted) {
      context.read<SettingsBloc>().add(LockCareRecipientSetting(input));
    }
  }
}

class _OrganizationAccessCard extends StatefulWidget {
  const _OrganizationAccessCard({required this.state});

  final SettingsState state;

  @override
  State<_OrganizationAccessCard> createState() => _OrganizationAccessCardState();
}

class _OrganizationAccessCardState extends State<_OrganizationAccessCard> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final membership = widget.state.organizationMembership;
    return _Panel(
      title: 'Organization access',
      subtitle: 'Redeem an access code provided by your organization.',
      icon: Icons.business_outlined,
      child: membership?.isActive == true
          ? Row(
              children: [
                const Icon(Icons.check_circle_outline, color: Color(0xFF16A34A)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Free access provided by ${membership!.orgName}.',
                    style: const TextStyle(color: Color(0xFF166534)),
                  ),
                ),
              ],
            )
          : Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    textCapitalization: TextCapitalization.characters,
                    decoration: const InputDecoration(
                      labelText: 'Organization code',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                FilledButton(
                  onPressed: () {
                    if (_controller.text.trim().isNotEmpty) {
                      context
                          .read<SettingsBloc>()
                          .add(RedeemOrganizationCode(_controller.text));
                    }
                  },
                  child: const Text('Redeem'),
                ),
              ],
            ),
    );
  }
}

class _DangerZoneCard extends StatelessWidget {
  const _DangerZoneCard({required this.state});

  final SettingsState state;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      title: 'Danger zone',
      subtitle: 'Permanently delete your account and associated data.',
      icon: Icons.warning_amber_rounded,
      color: const Color(0xFFFFF7F7),
      borderColor: const Color(0xFFFECACA),
      child: SizedBox(
        width: double.infinity,
        child: OutlinedButton.icon(
          onPressed: state.isSaving ? null : () => _confirmDelete(context),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFFB91C1C),
            side: const BorderSide(color: Color(0xFFFCA5A5)),
          ),
          icon: const Icon(Icons.delete_forever_outlined),
          label: const Text('Delete account'),
        ),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context) async {
    final controller = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Delete your account?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'This permanently removes your account and associated data. This cannot be undone.',
            ),
            const SizedBox(height: 14),
            const Text('Type "delete my account" to confirm.'),
            const SizedBox(height: 8),
            TextField(controller: controller),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFFB91C1C)),
            onPressed: () => Navigator.of(dialogContext).pop(
              controller.text.trim().toLowerCase() == 'delete my account',
            ),
            child: const Text('Delete permanently'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (confirmed == true && context.mounted) {
      context.read<SettingsBloc>().add(const DeleteAccountRequested());
    }
  }
}

class _LockedSettingTile extends StatelessWidget {
  const _LockedSettingTile({required this.setting});

  final LockedSettingModel setting;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: const Icon(Icons.lock_outline_rounded, color: Color(0xFFB91C1C)),
      title: Text(_humanize(setting.settingKey)),
      subtitle: Text(setting.lockReason?.isNotEmpty == true
          ? 'Locked by caregiver: ${setting.lockReason}'
          : 'Locked by caregiver'),
      trailing: const Chip(label: Text('Locked')),
    );
  }
}

class _ManagedLockTile extends StatelessWidget {
  const _ManagedLockTile({
    required this.setting,
    required this.caregiverId,
  });

  final LockedSettingModel setting;
  final int caregiverId;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: const Icon(Icons.lock_rounded, color: Color(0xFFB91C1C)),
      title: Text(_humanize(setting.settingKey)),
      subtitle: Text(setting.lockReason ?? 'Protected setting'),
      trailing: TextButton(
        onPressed: () => context.read<SettingsBloc>().add(
              UnlockCareRecipientSetting(
                userId: setting.userId,
                settingKey: setting.settingKey,
                caregiverId: caregiverId,
              ),
            ),
        child: const Text('Unlock'),
      ),
    );
  }
}

class _PermissionRow extends StatelessWidget {
  const _PermissionRow({
    required this.permissionType,
    required this.permission,
    required this.enabled,
    required this.onChanged,
  });

  final String permissionType;
  final CaregiverPermissionModel? permission;
  final bool enabled;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(_humanize(permissionType)),
      subtitle: permission?.isLocked == true ? const Text('Protected') : null,
      value: permission?.isGranted ?? true,
      onChanged: enabled ? onChanged : null,
    );
  }
}

class _Panel extends StatelessWidget {
  const _Panel({
    required this.child,
    this.title,
    this.subtitle,
    this.icon,
    this.trailing,
    this.color = Colors.white,
    this.borderColor,
  });

  final Widget child;
  final String? title;
  final String? subtitle;
  final IconData? icon;
  final Widget? trailing;
  final Color color;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor ?? const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(color: Color(0x10000000), blurRadius: 8, offset: Offset(0, 3)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null)
            Row(
              children: [
                if (icon != null) ...[
                  Icon(icon, color: const Color(0xFF2563EB)),
                  const SizedBox(width: 8),
                ],
                Expanded(
                  child: Text(
                    title!,
                    style: const TextStyle(
                      color: Color(0xFF111827),
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
          if (subtitle != null) ...[
            const SizedBox(height: 5),
            Text(subtitle!, style: const TextStyle(color: Color(0xFF6B7280), fontSize: 13)),
          ],
          if (title != null || subtitle != null) const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

class _SettingSwitch extends StatelessWidget {
  const _SettingSwitch({
    required this.label,
    required this.value,
    this.onChanged,
    this.description,
  });

  final String label;
  final String? description;
  final bool value;
  final ValueChanged<bool>? onChanged;

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label),
      subtitle: description == null ? null : Text(description!),
      value: value,
      onChanged: onChanged,
    );
  }
}

class _SliderRow extends StatelessWidget {
  const _SliderRow({
    required this.label,
    required this.value,
    required this.min,
    required this.max,
    required this.divisions,
    required this.suffix,
    required this.onChanged,
  });

  final String label;
  final double value;
  final double min;
  final double max;
  final int divisions;
  final String suffix;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('$label: ${value.toStringAsFixed(suffix == 'x' ? 1 : 0)}$suffix'),
        Slider(
          value: value,
          min: min,
          max: max,
          divisions: divisions,
          onChanged: onChanged,
        ),
      ],
    );
  }
}

class _SelectRow extends StatelessWidget {
  const _SelectRow({
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
  });

  final String label;
  final String value;
  final List<String> options;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      value: value,
      decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
      items: options
          .map((item) => DropdownMenuItem(value: item, child: Text(_humanize(item))))
          .toList(),
      onChanged: (item) {
        if (item != null) onChanged(item);
      },
    );
  }
}

class _SettingsError extends StatelessWidget {
  const _SettingsError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded, color: Color(0xFFB91C1C), size: 42),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 14),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }
}

void _update(BuildContext context, String category, String key, Object? value) {
  context.read<SettingsBloc>().add(
        UpdatePreference(category: category, key: key, value: value),
      );
}

void _updateLocal(BuildContext context, String key, bool value) {
  context.read<SettingsBloc>().add(
        UpdateLocalSetting(key: key, value: value),
      );
}

bool _isLocalSettingLocked(SettingsState state, String key) {
  const aliases = {
    'locationTracking': ['locationTracking', 'location_tracking', 'location_sharing'],
    'emergencyAlerts': ['emergencyAlerts', 'emergency_alerts', 'safety_alerts'],
    'caregiverAccess': ['caregiverAccess', 'caregiver_access'],
    'medicalDataSharing': ['medicalDataSharing', 'medical_data_sharing'],
    'automaticCheckIns': ['automaticCheckIns', 'automatic_check_ins'],
  };
  final keys = aliases[key] ?? [key];
  return state.lockedSettings.any(
    (setting) => setting.isLocked && keys.contains(setting.settingKey),
  );
}

bool _bool(Object? value, {bool fallback = false}) =>
    value is bool ? value : fallback;

double _double(Object? value, double fallback) {
  if (value is num) return value.toDouble();
  return double.tryParse('$value') ?? fallback;
}

int _intValue(Object? value, int fallback) {
  if (value is int) return value;
  if (value is num) return value.round();
  return int.tryParse('$value') ?? fallback;
}

String _oneOf(String value, List<String> options) =>
    options.contains(value) ? value : options.first;

String _humanize(String value) => value
    .split('_')
    .map((part) => part.isEmpty ? part : '${part[0].toUpperCase()}${part.substring(1)}')
    .join(' ');

Color _colorForScheme(String scheme) {
  switch (scheme) {
    case 'green':
      return const Color(0xFF16A34A);
    case 'purple':
      return const Color(0xFF7C3AED);
    case 'orange':
      return const Color(0xFFEA580C);
    case 'teal':
      return const Color(0xFF0D9488);
    case 'warm':
      return const Color(0xFFD97706);
    default:
      return const Color(0xFF2563EB);
  }
}

CaregiverPermissionModel? _permissionFor(
  List<CaregiverPermissionModel> permissions,
  String type,
) {
  for (final permission in permissions) {
    if (permission.permissionType == type) return permission;
  }
  return null;
}