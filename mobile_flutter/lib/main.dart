import 'package:flutter/material.dart';

import 'app/app.dart';
import 'core/analytics/firebase_analytics_service.dart';
import 'core/notifications/native_notification_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
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