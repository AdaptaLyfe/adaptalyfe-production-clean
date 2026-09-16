abstract final class AppConstants {
  static const appName = 'Adaptalyfe';
  static const apiBaseUrl = String.fromEnvironment(
    'ADAPTALYFE_API_BASE_URL',
    defaultValue: 'https://staging.getadaptalyfeapp.com/',
  );
  static const sessionTokenKey = 'adaptalyfe_session_token';
}