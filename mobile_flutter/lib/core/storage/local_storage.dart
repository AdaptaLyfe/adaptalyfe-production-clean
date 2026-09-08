import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/app_constants.dart';

/// Secure storage boundary for the native bearer session token.
class LocalStorage {
  LocalStorage({FlutterSecureStorage? storage})
      : storage = storage ?? FlutterSecureStorage();

  final FlutterSecureStorage storage;

  Future<String?> readSessionToken() {
    return storage.read(key: AppConstants.sessionTokenKey);
  }

  Future<void> writeSessionToken(String token) {
    return storage.write(key: AppConstants.sessionTokenKey, value: token);
  }

  Future<void> clearSessionToken() {
    return storage.delete(key: AppConstants.sessionTokenKey);
  }
}