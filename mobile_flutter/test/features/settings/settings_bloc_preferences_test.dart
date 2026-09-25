import 'dart:async';

import 'package:adaptalyfe_mobile/features/settings/bloc/settings_bloc.dart';
import 'package:adaptalyfe_mobile/features/settings/bloc/settings_event.dart';
import 'package:adaptalyfe_mobile/features/settings/bloc/settings_state.dart';
import 'package:adaptalyfe_mobile/features/settings/data/settings_repository.dart';
import 'package:adaptalyfe_mobile/features/settings/models/settings_models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('appearance updates reach global state before persistence completes',
      () async {
    final repository = _ControlledSettingsRepository();
    final bloc = SettingsBloc(repository);
    addTearDown(bloc.close);

    bloc.add(
      const UpdatePreference(
        category: 'themeSettings',
        key: 'theme',
        value: 'dark',
      ),
    );

    final updatedState = await bloc.stream.firstWhere(
      (state) =>
          state.status == SettingsStatus.saving &&
          state.theme['theme'] == 'dark',
    );

    expect(updatedState.theme['theme'], 'dark');
    expect(repository.updateStarted.isCompleted, isTrue);

    repository.updateResult.complete(
      const UserPreferences(themeSettings: {'theme': 'dark'}),
    );
    await bloc.stream.firstWhere(
      (state) =>
          state.status == SettingsStatus.loaded &&
          state.theme['theme'] == 'dark' &&
          state.busyKey == null,
    );
  });
}

class _ControlledSettingsRepository implements SettingsRepository {
  final updateStarted = Completer<void>();
  final updateResult = Completer<UserPreferences>();

  @override
  Future<UserPreferences> updatePreferences(
    Map<String, dynamic> changes,
  ) {
    updateStarted.complete();
    return updateResult.future;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) =>
      super.noSuchMethod(invocation);
}