class AppConfig {
  const AppConfig._();

  /// Emulator-only default; configure a real deployment at build time.
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5000',
  );
}
