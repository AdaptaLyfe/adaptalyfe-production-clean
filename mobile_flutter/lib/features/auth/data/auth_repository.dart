import 'auth_api.dart';

/// Repository boundary for future authentication use cases.
class AuthRepository {
  const AuthRepository(this.api);

  final AuthApi api;
}