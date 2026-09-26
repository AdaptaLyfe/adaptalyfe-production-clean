import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/home_models.dart';

class HomeQuickActionsStore {
  const HomeQuickActionsStore();

  static const _key = 'quick-actions-settings';

  Future<List<HomeQuickAction>> load() async {
    final preferences = await SharedPreferences.getInstance();
    final raw = preferences.getString(_key);
    if (raw == null) return defaultHomeQuickActions;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) return defaultHomeQuickActions;
      final defaultsById = {
        for (final action in defaultHomeQuickActions) action.id: action,
      };
      final ordered = <HomeQuickAction>[];
      for (final item in decoded.whereType<Map>()) {
        final id = _canonicalId('${item['id']}');
        final action = defaultsById[id];
        if (action != null && !ordered.any((saved) => saved.id == id)) {
          ordered.add(action.copyWith(visible: item['visible'] == true));
        }
      }
      for (final action in defaultHomeQuickActions) {
        if (!ordered.any((item) => item.id == action.id)) {
          ordered.add(action);
        }
      }
      return ordered;
    } catch (_) {
      return defaultHomeQuickActions;
    }
  }

  Future<void> save(List<HomeQuickAction> actions) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(
      _key,
      jsonEncode(actions.map((action) => action.toJson()).toList()),
    );
  }

  Future<void> reset() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_key);
  }

  String _canonicalId(String id) {
    const legacyIds = {
      'meals': 'meal-shopping',
      'tasks': 'daily-tasks',
      'mood': 'mood-checkin',
      'documents': 'personal-documents',
      'bills': 'financial',
      'support': 'caregiver',
    };
    return legacyIds[id] ?? id;
  }
}