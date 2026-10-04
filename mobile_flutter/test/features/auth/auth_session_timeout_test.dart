import 'dart:async';

import 'package:flutter_test/flutter_test.dart';

import 'package:adaptalyfe_mobile/core/network/api_client.dart';
import 'package:adaptalyfe_mobile/core/storage/local_storage.dart';
import 'package:adaptalyfe_mobile/features/auth/bloc/auth_bloc.dart';
import 'package:adaptalyfe_mobile/features/auth/bloc/auth_event.dart';
import 'package:adaptalyfe_mobile/features/auth/bloc/auth_state.dart';
import 'package:adaptalyfe_mobile/features/auth/data/auth_api.dart';
import 'package:adaptalyfe_mobile/features/auth/data/auth_repository.dart';

class _HangingSessionRepository extends AuthRepository {
  _HangingSessionRepository()
      : super(
          api: AuthApi(ApiClient()),
          localStorage: LocalStorage(),
        );

  @override
  Future<bool> hasSessionToken() => Completer<bool>().future;
}

void main() {
  test('a hung secure-session read exits the splash checking state', () async {
    final bloc = AuthBloc(
      _HangingSessionRepository(),
      sessionCheckTimeout: const Duration(milliseconds: 10),
    );
    final errorState = bloc.stream.firstWhere((state) => state is AuthError);

    bloc.add(const CheckAuthentication());

    final state = await errorState.timeout(const Duration(seconds: 1));
    expect(
      (state as AuthError).message,
      contains('Checking your session took too long'),
    );

    await bloc.close();
  });
}