import '../../../core/storage/local_storage.dart';
import '../../../models/user_model.dart';
import 'auth_api.dart';

/// Authentication repository.
///
/// Widgets and BLoCs depend on this repository. Only this class coordinates
/// AuthApi responses with local session storage.
class AuthRepository {
  const AuthRepository({
    required this.api,
    required this.localStorage,
  });

  final AuthApi api;
  final LocalStorage localStorage;

  Future<bool> hasSessionToken() {
    return localStorage.hasSessionToken();
  }

  Future<void> clearLocalSession() {
    return localStorage.clearSessionToken();
  }

  Future<UserModel> login({
    required String username,
    required String password,
  }) async {
    final response = await api.login(
      username: username,
      password: password,
    );

    await _saveSessionTokenIfPresent(response);
    return _userFromResponse(response);
  }

  Future<UserModel> register({
    required String name,
    String? email,
    required String username,
    required String password,
    String plan = 'basic',
    bool subscribeNewsletter = false,
  }) async {
    final response = await api.register(
      name: name,
      email: email,
      username: username,
      password: password,
      plan: plan,
      subscribeNewsletter: subscribeNewsletter,
    );

    // Native registration responses use the same sessionToken contract as
    // native login responses.
    await _saveSessionTokenIfPresent(response);
    return _userFromResponse(response);
  }

  Future<UserModel> getCurrentUser() async {
    final response = await api.getCurrentUser();
    return _userFromResponse(response);
  }

  Future<void> logout() async {
    try {
      await api.logout();
    } finally {
      // Match the existing client behavior: local auth is cleared even if the
      // server request fails because the device must not retain the token.
      await localStorage.clearSessionToken();
    }
  }

  Future<void> _saveSessionTokenIfPresent(
    Map<String, dynamic> response,
  ) async {
    final token = response['sessionToken'];
    if (token is String && token.trim().isNotEmpty) {
      await localStorage.saveSessionToken(token);
    }
  }

  UserModel _userFromResponse(Map<String, dynamic> response) {
    final nestedUser = response['user'];
    final userData = nestedUser is Map
        ? Map<String, dynamic>.from(nestedUser)
        : response;

    return UserModel.fromJson(userData);
  }
}