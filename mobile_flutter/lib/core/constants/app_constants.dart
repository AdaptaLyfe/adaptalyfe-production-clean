abstract final class AppConstants {
  static const appName = 'Adaptalyfe';
  static const apiBaseUrl = String.fromEnvironment(
    'ADAPTALYFE_API_BASE_URL',
    defaultValue: 'https://staging.getadaptalyfeapp.com/',
  );
  static const sessionTokenKey = 'adaptalyfe_session_token';
  static const stripePublishableKey = String.fromEnvironment(
    'STRIPE_PUBLISHABLE_KEY',
  );
  static const stripeMerchantIdentifier = String.fromEnvironment(
    'STRIPE_MERCHANT_IDENTIFIER',
    defaultValue: 'merchant.com.adaptalyfe.app',
  );
  static const stripeMerchantCountryCode = String.fromEnvironment(
    'STRIPE_MERCHANT_COUNTRY_CODE',
    defaultValue: 'US',
  );
  static const stripeUrlScheme = 'adaptalyfe';

  static bool get stripeUsesTestMode =>
      stripePublishableKey.startsWith('pk_test_');
}