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
    // The login response is intentionally minimal. Read the shared current
    // user after storing the native bearer token so entitlement fields and
    // account metadata are immediately consistent with the web session.
    return getCurrentUser();
  }

  Future<RegistrationResult> register({
    required String name,
    String? email,
    required String username,
    required String password,
    String plan = 'basic',
    bool subscribeNewsletter = false,
    String invitationCode = '',
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
    var organizationCodeApplied = false;
    final normalizedCode = invitationCode.trim();
    if (normalizedCode.isNotEmpty) {
      try {
        await api.redeemOrganizationCode(normalizedCode);
        organizationCodeApplied = true;
      } catch (_) {
        // The React flow falls back to caregiver invitation acceptance when
        // organization-code redemption fails.
      }
    }

    return RegistrationResult(
      // Registration also returns a minimal user object. Fetch the canonical
      // record after any invitation-code redemption has completed.
      user: await getCurrentUser(),
      organizationCodeApplied: organizationCodeApplied,
    );
  }

  Future<void> requestPasswordReset(String email) async {
    await api.requestPasswordReset(email);
  }

  Future<bool> validatePasswordResetToken(String token) {
    return api.validatePasswordResetToken(token);
  }

  Future<void> resetPassword({
    required String token,
    required String password,
  }) async {
    await api.resetPassword(token: token, password: password);
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

class RegistrationResult {
  const RegistrationResult({
    required this.user,
    required this.organizationCodeApplied,
  });

  final UserModel user;
  final bool organizationCodeApplied;
}