import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/settings_models.dart';

class LocalSettingsStore {
  const LocalSettingsStore();

  static const _legacyKey = 'user-settings';

  String _keyForUser(int userId) => 'user-settings:user:$userId';

  Future<LocalUserSettings> load(int userId) async {
    if (userId <= 0) return const LocalUserSettings();
    final preferences = await SharedPreferences.getInstance();
    final key = _keyForUser(userId);
    var raw = preferences.getString(key);
    if (raw == null) {
      raw = preferences.getString(_legacyKey);
      if (raw != null) {
        final migrated = await preferences.setString(key, raw);
        if (migrated) await preferences.remove(_legacyKey);
      }
    }
    if (raw == null) return const LocalUserSettings();
    try {
      final decoded = jsonDecode(raw);
      return decoded is Map
          ? LocalUserSettings.fromJson(Map<String, dynamic>.from(decoded))
          : const LocalUserSettings();
    } catch (_) {
      return const LocalUserSettings();
    }
  }

  Future<void> save(int userId, LocalUserSettings settings) async {
    if (userId <= 0) {
      throw ArgumentError.value(
        userId,
        'userId',
        'Must be an authenticated user.',
      );
    }
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(
      _keyForUser(userId),
      jsonEncode(settings.toJson()),
    );
  }
}