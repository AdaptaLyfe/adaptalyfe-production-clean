import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/settings_models.dart';

class LocalSettingsStore {
  const LocalSettingsStore();

  static const _key = 'user-settings';

  Future<LocalUserSettings> load() async {
    final preferences = await SharedPreferences.getInstance();
    final raw = preferences.getString(_key);
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

  Future<void> save(LocalUserSettings settings) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_key, jsonEncode(settings.toJson()));
  }
}