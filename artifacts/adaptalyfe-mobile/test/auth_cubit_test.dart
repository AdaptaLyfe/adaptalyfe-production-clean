import 'package:adaptalyfe_mobile/core/error/app_exception.dart';
import 'package:adaptalyfe_mobile/core/network/api_client.dart';
import 'package:adaptalyfe_mobile/features/auth/domain/auth_repository.dart';
import 'package:adaptalyfe_mobile/features/auth/domain/user.dart';
import 'package:adaptalyfe_mobile/features/auth/presentation/auth_cubit.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';

class FakeAuthRepository implements AuthRepository {
  bool fail = false;
  bool invalidSession = false;
  bool token = true;
  bool logoutFails = false;
  int validateCalls = 0;
  int registerCalls = 0;
  bool logoutCalled = false;
  @override
  Future<bool> hasStoredSession() async => token;
  @override
  Future<User> login(String u, String p) async => fail
      ? throw const NetworkException()
      : const User(id: 1, username: 'sam', name: 'Sam');
  @override
  Future<void> logout() async {
    logoutCalled = true;
    if (logoutFails) throw const NetworkException();
  }

  @override
  Future<void> register(
      {required String name,
      required String username,
      required String password,
      String? email}) async {
    registerCalls++;
  }

  @override
  Future<User> validateSession() {
    validateCalls++;
    if (invalidSession) throw const InvalidSessionException();
    return login('', '');
  }
}

void main() {
  test('sign in emits loading then authenticated', () async {
    final cubit = AuthCubit(FakeAuthRepository());
    final states = <AuthState>[];
    final sub = cubit.stream.listen(states.add);
    await cubit.signIn('sam', 'password');
    await Future<void>.delayed(Duration.zero);
    expect(states.whereType<AuthAuthenticated>().single.user.name, 'Sam');
    await sub.cancel();
    await cubit.close();
  });
  test('network error is retained for an actionable UI state', () async {
    final repo = FakeAuthRepository()..fail = true;
    final cubit = AuthCubit(repo);
    await cubit.signIn('sam', 'password');
    expect(cubit.state, isA<AuthFailure>());
    await cubit.close();
  });
  test('restore does not call API without a local token', () async {
    final repo = FakeAuthRepository()..token = false;
    final cubit = AuthCubit(repo);
    await cubit.restore();
    expect(repo.validateCalls, 0);
    expect(cubit.state, isA<AuthUnauthenticated>());
    await cubit.close();
  });
  test('invalid session restores to signed out', () async {
    final repo = FakeAuthRepository()..invalidSession = true;
    final cubit = AuthCubit(repo);
    await cubit.restore();
    expect(cubit.state, isA<AuthUnauthenticated>());
    await cubit.close();
  });
  test('signup returns the sign-in state', () async {
    final repo = FakeAuthRepository();
    final cubit = AuthCubit(repo);
    await cubit.signUp(name: 'Sam', username: 'sam', password: 'password');
    expect(repo.registerCalls, 1);
    expect(cubit.state, isA<AuthUnauthenticated>());
    await cubit.close();
  });
  test('logout emits unauthenticated even when remote logout fails', () async {
    final repo = FakeAuthRepository()..logoutFails = true;
    final cubit = AuthCubit(repo);
    await cubit.signOut();
    expect(repo.logoutCalled, isTrue);
    expect((cubit.state as AuthUnauthenticated).logoutError,
        isA<NetworkException>());
    await cubit.close();
  });
  test('HTTP response errors map to safe domain errors', () {
    final request = RequestOptions(path: '/api/user');
    expect(
        mapDioError(DioException(
            requestOptions: request,
            response: Response(requestOptions: request, statusCode: 401))),
        isA<InvalidSessionException>());
    expect(
        mapDioError(DioException(
            requestOptions: request,
            response: Response(requestOptions: request, statusCode: 503))),
        isA<ServerException>());
    expect(
        mapDioError(DioException(
            requestOptions: request,
            response: Response(
                requestOptions: request,
                statusCode: 400,
                data: {'error': 'Bad input'}))).message,
        'Bad input');
  });
}
