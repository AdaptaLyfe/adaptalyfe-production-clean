import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';

import 'app/app.dart';
import 'core/analytics/firebase_analytics_service.dart';
import 'core/constants/app_constants.dart';
import 'core/notifications/native_notification_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await _configureStripe();
  final analytics = FirebaseAnalyticsService.instance;
  await analytics.initialize();
  await NativeNotificationService.instance.initialize();
  final previousFlutterErrorHandler = FlutterError.onError;
  FlutterError.onError = (details) {
    analytics.logError('flutter_error', details.exceptionAsString());
    previousFlutterErrorHandler?.call(details);
  };
  runApp(const AdaptalyfeApp());
}

Future<void> _configureStripe() async {
  if (AppConstants.stripePublishableKey.trim().isEmpty) return;

  Stripe.publishableKey = AppConstants.stripePublishableKey;
  Stripe.merchantIdentifier = AppConstants.stripeMerchantIdentifier;
  Stripe.urlScheme = AppConstants.stripeUrlScheme;
  await Stripe.instance.applySettings();
}