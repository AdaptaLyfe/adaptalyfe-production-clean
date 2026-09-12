import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/settings_models.dart';

class DashboardLayoutStore {
  const DashboardLayoutStore();

  static const _key = 'dashboard-layout';

  Future<List<DashboardModuleModel>> load() async {
    final preferences = await SharedPreferences.getInstance();
    final raw = preferences.getString(_key);
    if (raw == null) return defaultDashboardModules;
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

  Future<void> save(List<DashboardModuleModel> modules) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(
      _key,
      jsonEncode(modules.map((module) => module.toJson()).toList()),
    );
  }

  Future<void> reset() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_key);
  }
}