import 'user.dart';

abstract class AuthRepository {
  Future<bool> hasStoredSession();
  Future<User> validateSession();
  Future<User> login(String username, String password);
  Future<void> register(
      {required String name,
      required String username,
      required String password,
      String? email});
  Future<void> logout();
}
