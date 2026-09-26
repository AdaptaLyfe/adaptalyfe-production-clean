import 'package:adaptalyfe_mobile/features/settings/data/local_settings_store.dart';
import 'package:adaptalyfe_mobile/features/settings/models/settings_models.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('local settings survive a new store instance for the same user',
      () async {
    const store = LocalSettingsStore();
    await store.save(
      7,
      const LocalUserSettings(
        privacyMode: true,
        locationTracking: false,
      ),
    );

    final reloaded = await const LocalSettingsStore().load(7);

    expect(reloaded.privacyMode, isTrue);
    expect(reloaded.locationTracking, isFalse);
  });

  test('local settings are isolated by authenticated user', () async {
    const store = LocalSettingsStore();
    await store.save(
      7,
      const LocalUserSettings(privacyMode: true),
    );
    await store.save(
      8,
      const LocalUserSettings(privacyMode: false),
    );

    expect((await store.load(7)).privacyMode, isTrue);
    expect((await store.load(8)).privacyMode, isFalse);
  });

  test('legacy device-wide settings migrate to the first loaded account',
      () async {
    SharedPreferences.setMockInitialValues({
      'user-settings': '{"privacyMode":true,"locationTracking":false}',
    });

    const store = LocalSettingsStore();
    final firstUser = await store.load(7);
    final secondUser = await store.load(8);

    expect(firstUser.privacyMode, isTrue);
    expect(firstUser.locationTracking, isFalse);
    expect(secondUser.privacyMode, isFalse);
    expect(secondUser.locationTracking, isTrue);
  });
}