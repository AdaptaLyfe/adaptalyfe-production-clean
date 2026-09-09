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
      final modules = decoded
          .whereType<Map>()
          .map(
            (item) => DashboardModuleModel.fromJson(
              Map<String, dynamic>.from(item),
            ),
          )
          .toList();
      return modules.isEmpty ? defaultDashboardModules : modules;
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