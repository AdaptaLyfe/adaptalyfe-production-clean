import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:adaptalyfe_mobile/features/settings/data/dashboard_layout_store.dart';
import 'package:adaptalyfe_mobile/features/settings/models/settings_models.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late DashboardModuleModel firstModule;
  late List<DashboardModuleModel> changedFirstModule;

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    firstModule = defaultDashboardModules.first;
    changedFirstModule = [
      for (final module in defaultDashboardModules)
        if (module.id == firstModule.id)
          module.copyWith(enabled: !module.enabled)
        else
          module,
    ];
  });

  test('layout persists per user across store instances without account bleed',
      () async {
    await const DashboardLayoutStore().saveForUser(
      userId: 101,
      modules: changedFirstModule,
    );

    final reloadedForFirstUser =
        await const DashboardLayoutStore().loadForUser(userId: 101);
    final secondUserLayout =
        await const DashboardLayoutStore().loadForUser(userId: 202);

    expect(
      reloadedForFirstUser
          .firstWhere((module) => module.id == firstModule.id)
          .enabled,
      !firstModule.enabled,
    );
    expect(
      secondUserLayout
          .firstWhere((module) => module.id == firstModule.id)
          .enabled,
      firstModule.enabled,
    );
  });

  test('legacy layout is migrated once and not shared with later users',
      () async {
    SharedPreferences.setMockInitialValues({
      'dashboard-layout': jsonEncode(
        changedFirstModule.map((module) => module.toJson()).toList(),
      ),
    });

    final firstUserLayout =
        await const DashboardLayoutStore().loadForUser(userId: 101);
    final secondUserLayout =
        await const DashboardLayoutStore().loadForUser(userId: 202);
    final preferences = await SharedPreferences.getInstance();

    expect(
      firstUserLayout
          .firstWhere((module) => module.id == firstModule.id)
          .enabled,
      !firstModule.enabled,
    );
    expect(
      secondUserLayout
          .firstWhere((module) => module.id == firstModule.id)
          .enabled,
      firstModule.enabled,
    );
    expect(preferences.getString('dashboard-layout'), isNull);
  });

  test('concurrent saves from separate instances preserve the final snapshot',
      () async {
    final finalSnapshot = [
      for (final module in defaultDashboardModules)
        module.copyWith(enabled: module.id != firstModule.id),
    ];

    await Future.wait([
      const DashboardLayoutStore().saveForUser(
        userId: 101,
        modules: changedFirstModule,
      ),
      const DashboardLayoutStore().saveForUser(
        userId: 101,
        modules: finalSnapshot,
      ),
    ]);

    final saved =
        await const DashboardLayoutStore().loadForUser(userId: 101);
    expect(
      saved.map((module) => module.enabled).toList(),
      finalSnapshot.map((module) => module.enabled).toList(),
    );
  });

  test('reset only clears the selected user layout', () async {
    await const DashboardLayoutStore().saveForUser(
      userId: 101,
      modules: changedFirstModule,
    );
    await const DashboardLayoutStore().saveForUser(
      userId: 202,
      modules: changedFirstModule,
    );

    await const DashboardLayoutStore().resetForUser(userId: 101);

    final firstUserLayout =
        await const DashboardLayoutStore().loadForUser(userId: 101);
    final secondUserLayout =
        await const DashboardLayoutStore().loadForUser(userId: 202);
    expect(
      firstUserLayout
          .firstWhere((module) => module.id == firstModule.id)
          .enabled,
      firstModule.enabled,
    );
    expect(
      secondUserLayout
          .firstWhere((module) => module.id == firstModule.id)
          .enabled,
      !firstModule.enabled,
    );
  });
}