class AppConfig {
  const AppConfig._();

  /// Existing Adaptalyfe API from the mobile integration documentation.
  /// Override with --dart-define=API_BASE_URL=... for local development.
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://staging.getadaptalyfeapp.com',
  );
}
