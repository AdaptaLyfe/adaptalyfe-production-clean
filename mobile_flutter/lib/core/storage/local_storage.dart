import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/app_constants.dart';

/// Secure storage boundary for the native bearer session token.
///
/// The value is stored with platform-secure storage: Android uses its secure
/// storage implementation and iOS uses Keychain. Passwords are never accepted
/// or written by this class.
class LocalStorage {
  LocalStorage({FlutterSecureStorage? storage})
      : storage = storage ?? FlutterSecureStorage();

  final FlutterSecureStorage storage;

  Future<void> saveSessionToken(String sessionToken) {
    final token = sessionToken.trim();
    if (token.isEmpty) {
      throw ArgumentError.value(
        sessionToken,
        'sessionToken',
        'A session token is required',
      );
    }

    return storage.write(
      key: AppConstants.sessionTokenKey,
      value: token,
    );
  }

  Future<String?> getSessionToken() {
    return storage.read(key: AppConstants.sessionTokenKey);
  }

  Future<void> clearSessionToken() {
    return storage.delete(key: AppConstants.sessionTokenKey);
  }

  Future<bool> hasSessionToken() async {
    final token = await getSessionToken();
    return token != null && token.trim().isNotEmpty;
  }
}