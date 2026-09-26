import 'package:flutter/foundation.dart';
import 'package:flutter_stripe/flutter_stripe.dart';

import '../../../core/constants/app_constants.dart';

enum StripePaymentMethod {
  card,
  googlePay,
  applePay,
}

class StripePaymentAvailability {
  const StripePaymentAvailability({
    required this.configured,
    required this.walletAvailable,
  });

  final bool configured;
  final bool walletAvailable;

  StripePaymentMethod? get walletMethod {
    if (!walletAvailable) return null;
    if (defaultTargetPlatform == TargetPlatform.android) {
      return StripePaymentMethod.googlePay;
    }
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      return StripePaymentMethod.applePay;
    }
    return null;
  }
}

class StripePaymentException implements Exception {
  const StripePaymentException(
    this.message, {
    this.configuration = false,
  });

  final String message;
  final bool configuration;

  @override
  String toString() => message;
}

class StripePaymentService {
  bool _initialized = false;

  Future<StripePaymentAvailability> initialize() async {
    if (kIsWeb || AppConstants.stripePublishableKey.trim().isEmpty) {
      return const StripePaymentAvailability(
        configured: false,
        walletAvailable: false,
      );
    }

    try {
      Stripe.publishableKey = AppConstants.stripePublishableKey;
      Stripe.merchantIdentifier = AppConstants.stripeMerchantIdentifier;
      Stripe.urlScheme = AppConstants.stripeUrlScheme;
      await Stripe.instance.applySettings();
      _initialized = true;

      var walletAvailable = false;
      try {
        if (defaultTargetPlatform == TargetPlatform.android) {
          walletAvailable = await Stripe.instance.isGooglePaySupported(
            IsGooglePaySupportedParams(
              testEnv: AppConstants.stripeUsesTestMode,
            ),
          );
        } else if (defaultTargetPlatform == TargetPlatform.iOS) {
          walletAvailable = await Stripe.instance.isPlatformPaySupported();
        }
      } catch (_) {
        // A wallet capability can be unavailable while card checkout remains
        // valid, for example on a simulator or without a wallet entitlement.
      }

      return StripePaymentAvailability(
        configured: true,
        walletAvailable: walletAvailable,
      );
    } catch (_) {
      // Card checkout remains available when a wallet is not configured on
      // this device. A missing publishable key is handled above.
      _initialized = false;
      return const StripePaymentAvailability(
        configured: false,
        walletAvailable: false,
      );
    }
  }

  Future<void> presentSubscriptionPayment({
    required String clientSecret,
    required String intentType,
    required StripePaymentMethod method,
  }) async {
    if (!_initialized) {
      throw const StripePaymentException(
        'Stripe payments are not configured for this build.',
        configuration: true,
      );
    }

    await Stripe.instance.initPaymentSheet(
      paymentSheetParameters: SetupPaymentSheetParameters(
        merchantDisplayName: AppConstants.appName,
        paymentIntentClientSecret:
            intentType == 'payment' ? clientSecret : null,
        setupIntentClientSecret: intentType == 'setup' ? clientSecret : null,
        returnURL: '${AppConstants.stripeUrlScheme}://stripe-redirect',
        applePay: method == StripePaymentMethod.applePay
            ? const PaymentSheetApplePay(
                merchantCountryCode: AppConstants.stripeMerchantCountryCode,
              )
            : null,
        googlePay: method == StripePaymentMethod.googlePay
            ? PaymentSheetGooglePay(
                merchantCountryCode: AppConstants.stripeMerchantCountryCode,
                testEnv: AppConstants.stripeUsesTestMode,
              )
            : null,
      ),
    );
    await Stripe.instance.presentPaymentSheet();
  }
}