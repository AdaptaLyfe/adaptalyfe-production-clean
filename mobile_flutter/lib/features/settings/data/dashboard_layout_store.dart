import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/settings_models.dart';

class DashboardLayoutStore {
  const DashboardLayoutStore();

  static const _legacyKey = 'dashboard-layout';
  static const _legacyMigrationKey = 'dashboard-layout-user-scope-migrated';
  static const _keyPrefix = 'dashboard-layout:user:';
  static Future<void> _operationQueue = Future<void>.value();

  Future<List<DashboardModuleModel>> load(int userId) {
    return _serialize(() async {
      final preferences = await SharedPreferences.getInstance();
      final key = _keyFor(userId);
      var raw = preferences.getString(key);
      if (raw == null) {
        await _migrateLegacyLayout(preferences, userId);
        raw = preferences.getString(key);
      }
      return raw == null ? [...defaultDashboardModules] : _decode(raw);
    });
  }

  Future<void> save(int userId, List<DashboardModuleModel> modules) {
    final key = _keyFor(userId);
    final encodedLayout =
        jsonEncode(modules.map((module) => module.toJson()).toList());
    return _serialize(() async {
      final preferences = await SharedPreferences.getInstance();
      await _migrateLegacyLayout(preferences, userId);
      final saved = await preferences.setString(key, encodedLayout);
      if (!saved) {
        throw StateError('Could not save this user’s dashboard layout.');
      }
    });
  }

  Future<void> reset(int userId) {
    final key = _keyFor(userId);
    return _serialize(() async {
      final preferences = await SharedPreferences.getInstance();
      await _migrateLegacyLayout(preferences, userId);
      await preferences.remove(key);
    });
  }

  Future<T> _serialize<T>(Future<T> Function() operation) {
    final result = _operationQueue.then((_) => operation());
    _operationQueue = result.then<void>(
      (_) {},
      onError: (Object _, StackTrace __) {},
    );
    return result;
  }

  Future<void> _migrateLegacyLayout(
    SharedPreferences preferences,
    int userId,
  ) async {
    if (preferences.getBool(_legacyMigrationKey) ?? false) return;

    final legacyLayout = preferences.getString(_legacyKey);
    if (legacyLayout != null) {
      final saved = await preferences.setString(
        _keyFor(userId),
        legacyLayout,
      );
      if (!saved) {
        throw StateError('Could not migrate the saved dashboard layout.');
      }
    }

    final markedMigrated =
        await preferences.setBool(_legacyMigrationKey, true);
    if (!markedMigrated) {
      throw StateError('Could not finish dashboard layout migration.');
    }
    await preferences.remove(_legacyKey);
  }

  String _keyFor(int userId) {
    if (userId <= 0) {
      throw ArgumentError.value(userId, 'userId', 'Must be a positive ID.');
    }
    return '$_keyPrefix$userId';
  }

  List<DashboardModuleModel> _decode(String raw) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) return defaultDashboardModules;
      final saved = decoded
          .whereType<Map>()
          .map(
            (item) => DashboardModuleModel.fromJson(
              Map<String, dynamic>.from(item),
            ),
          )
          .toList();
      final seen = <String>{};
      final merged = <DashboardModuleModel>[];
      for (final module in saved) {
        if (seen.add(module.id)) merged.add(module);
      }
      for (final module in defaultDashboardModules) {
        if (seen.add(module.id)) merged.add(module);
      }
      return [
        for (var index = 0; index < merged.length; index++)
          merged[index].copyWith(order: index),
      ];
    } catch (_) {
      return defaultDashboardModules;
    }
  }
}