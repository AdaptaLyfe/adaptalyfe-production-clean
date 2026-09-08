import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure storage boundary for future session persistence.
///
/// Read/write behavior is intentionally deferred until authentication is built.
class LocalStorage {
  LocalStorage({FlutterSecureStorage? storage})
      : storage = storage ?? FlutterSecureStorage();

  final FlutterSecureStorage storage;
}