import '../../../core/error/app_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../domain/auth_repository.dart';
import '../domain/user.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._api, this._tokens);
  final ApiClient _api;
  final TokenStorage _tokens;
  @override
  Future<bool> hasStoredSession() async =>
      (await _tokens.read())?.isNotEmpty == true;

  @override
  Future<User> validateSession() async {
    try {
      final data = await _api.getJson('/api/user');
      final raw = data['user'] is Map ? data['user'] : data;
      return User.fromJson(Map<String, dynamic>.from(raw as Map));
    } on InvalidSessionException {
      await _tokens.clear();
      rethrow;
    } on FormatException {
      throw const InvalidResponseException();
    }
  }

  @override
  Future<User> login(String username, String password) async {
    final data = await _api.postJson('/api/login',
        authenticated: false,
        data: {'username': username, 'password': password});
    final token = data['sessionToken'];
    final rawUser = data['user'];
    if (token is! String || token.isEmpty || rawUser is! Map) {
      throw const InvalidResponseException('Sign-in response is incomplete.');
    }
    await _tokens.write(token);
    try {
      return User.fromJson(Map<String, dynamic>.from(rawUser));
    } on FormatException {
      throw const InvalidResponseException();
    }
  }

  @override
  Future<void> register(
      {required String name,
      required String username,
      required String password,
      String? email}) async {
    final data =
        await _api.postJson('/api/register', authenticated: false, data: {
      'name': name,
      'username': username,
      'password': password,
      if (email != null && email.isNotEmpty) 'email': email
    });
    // Registration is successful only when the documented response contains a user.
    if (data['user'] is! Map) {
      throw const InvalidResponseException(
          'Registration response is incomplete.');
    }
    // Native registration issues a live bearer session. This first-phase product
    // flow intentionally asks the person to sign in, so revoke that session
    // rather than leaving an unused server-side credential active.
    final issuedToken = data['sessionToken'];
    if (issuedToken is String && issuedToken.isNotEmpty) {
      await _tokens.write(issuedToken);
      try {
        await _api.postEmpty('/api/logout');
      } on AppException {
        // Registration remains successful if revocation cannot reach the server.
        // The credential is still removed locally in the finally block.
      } finally {
        await _tokens.clear();
      }
    } else {
      await _tokens.clear();
    }
  }

  @override
  Future<void> logout() async {
    try {
      await _api.postEmpty('/api/logout');
    } finally {
      await _tokens.clear();
    }
  }
}
