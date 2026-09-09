import 'dart:async';

import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_core/firebase_core.dart';

import '../../firebase_options.dart';

/// Centralized, best-effort Firebase Analytics boundary for the native app.
///
/// Analytics must never block authentication, navigation, or feature actions.
/// Every public method is safe when Firebase is not configured or a native
/// Firebase initialization/logging call fails.
class FirebaseAnalyticsService {
  FirebaseAnalyticsService._();

  static final FirebaseAnalyticsService instance =
      FirebaseAnalyticsService._();

  FirebaseAnalytics? _analytics;
  Future<void>? _initialization;
  DateTime? _sessionStartedAt;
  bool _firebaseUnavailableLogged = false;
  String? _lastRoute;

  bool get isAvailable => _analytics != null;

  Future<void> initialize() {
    return _initialization ??= _initialize();
  }

  Future<void> _initialize() async {
    try {
      if (!DefaultFirebaseOptions.isConfigured) {
        _logUnavailableOnce(
          'Firebase Analytics skipped: mobile Firebase options are not configured.',
        );
        return;
      }

      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
      final analytics = FirebaseAnalytics.instance;
      await analytics.setAnalyticsCollectionEnabled(true);
      _analytics = analytics;
    } catch (error) {
      _logUnavailableOnce('Firebase Analytics initialization failed: $error');
    }
  }

  Future<void> startSession() async {
    if (_sessionStartedAt != null) return;
    _sessionStartedAt = DateTime.now();
    await logSessionStart();
    await logDailyActivity('app_open');
  }

  Future<void> endSession() async {
    final startedAt = _sessionStartedAt;
    _sessionStartedAt = null;
    if (startedAt == null) return;
    final duration = DateTime.now().difference(startedAt).inSeconds;
    await logSessionEnd(duration);
  }

  Future<void> logLogin(String method) =>
      _logEvent('login', {'method': method});

  Future<void> logSignUp(String method) =>
      _logEvent('sign_up', {'method': method});

  Future<void> logScreenView(String screenName) async {
    final analytics = await _ready();
    if (analytics == null) return;
    try {
      await analytics.logScreenView(
        screenName: screenName,
        screenClass: screenName,
      );
    } catch (_) {
      // Analytics failures must never affect app behavior.
    }
  }

  Future<void> logFeatureUsage(
    String featureName, {
    Map<String, String>? details,
  }) =>
      _logEvent(
        'feature_used',
        {'feature_name': featureName, ...?details},
      );

  Future<void> logDailyActivity(String activityType) => _logEvent(
        'daily_activity',
        {
          'activity_type': activityType,
          'timestamp': DateTime.now().toUtc().toIso8601String(),
        },
      );

  Future<void> logMoodEntry(int moodValue, String moodLabel) => _logEvent(
        'mood_logged',
        {
          'mood_value': '$moodValue',
          'mood_label': moodLabel,
        },
      );

  Future<void> logTaskCompletion(String taskCategory) =>
      _logEvent('task_completed', {'task_category': taskCategory});

  Future<void> logSubscriptionEvent(String action, String planType) =>
      _logEvent(
        'subscription_event',
        {'action': action, 'plan_type': planType},
      );

  Future<void> logTrialStatus(int daysLeft, String status) => _logEvent(
        'trial_status',
        {'days_left': '$daysLeft', 'status': status},
      );

  Future<void> logChurnRisk(
    String reason, {
    Map<String, String>? details,
  }) =>
      _logEvent(
        'churn_risk',
        {'reason': reason, ...?details},
      );

  Future<void> logRetention(int daysSinceSignup, bool isActive) => _logEvent(
        'retention_check',
        {
          'days_since_signup': '$daysSinceSignup',
          'is_active': '$isActive',
        },
      );

  Future<void> logSessionStart() => _logEvent(
        'session_start_custom',
        {'timestamp': DateTime.now().toUtc().toIso8601String()},
      );

  Future<void> logSessionEnd(int durationSeconds) => _logEvent(
        'session_end_custom',
        {'duration_seconds': '$durationSeconds'},
      );

  Future<void> logPageNavigation(String from, String to) => _logEvent(
        'page_navigation',
        {'from_page': from, 'to_page': to},
      );

  Future<void> logError(String errorType, String errorMessage) => _logEvent(
        'app_error',
        {
          'error_type': errorType,
          'error_message': errorMessage.substring(
            0,
            errorMessage.length > 100 ? 100 : errorMessage.length,
          ),
        },
      );

  Future<void> setAnalyticsUser(
    int userId, {
    Map<String, String>? properties,
  }) async {
    final analytics = await _ready();
    if (analytics == null) return;
    try {
      await analytics.setUserId(id: '$userId');
      if (properties != null) {
        await setAnalyticsUserProperties(properties);
      }
    } catch (_) {
      // Analytics failures must never affect app behavior.
    }
  }

  Future<void> setAnalyticsUserProperties(
    Map<String, String> properties,
  ) async {
    final analytics = await _ready();
    if (analytics == null) return;
    try {
      for (final entry in properties.entries) {
        await analytics.setUserProperty(
          name: entry.key,
          value: entry.value,
        );
      }
    } catch (_) {
      // Analytics failures must never affect app behavior.
    }
  }

  /// Tracks a Flutter route using the same logical screen names as the web
  /// analytics hook, while preserving the native route path in navigation
  /// events.
  Future<void> trackRoute(String route) async {
    if (route == _lastRoute) return;
    final previous = _lastRoute;
    _lastRoute = route;
    if (previous != null) {
      await logPageNavigation(previous, route);
    }

    final screenName = _screenNameForRoute(route);
    await logScreenView(screenName);
    await logDailyActivity('page_view');
    if (route == '/daily-tasks') {
      await logFeatureUsage('daily_tasks');
    }
  }

  Future<FirebaseAnalytics?> _ready() async {
    await initialize();
    return _analytics;
  }

  Future<void> _logEvent(
    String name,
    Map<String, String> parameters,
  ) async {
    final analytics = await _ready();
    if (analytics == null) return;
    try {
      await analytics.logEvent(name: name, parameters: parameters);
    } catch (_) {
      // Analytics failures must never affect app behavior.
    }
  }

  String _screenNameForRoute(String route) {
    const names = {
      '/home': 'Dashboard',
      '/mood-tracking': 'Mood Tracking',
      '/daily-tasks': 'Daily Tasks',
      '/financial': 'Financial',
      '/calendar': 'Calendar',
      '/resources': 'Resources',
      '/settings': 'Settings',
      '/subscription': 'Subscription',
      '/medical': 'Medical Info',
      '/meal-shopping': 'Meal Planning',
      '/caregiver-setup': 'Caregiver',
      '/caregiver-dashboard': 'Caregiver',
      '/sleep-tracking': 'Sleep Tracking',
      '/academic-planner': 'Academic Planner',
      '/login': 'Login',
      '/signup': 'Signup',
      '/accept-invitation': 'Accept Invitation',
    };
    return names[route] ?? route;
  }

  void _logUnavailableOnce(String message) {
    if (_firebaseUnavailableLogged) return;
    _firebaseUnavailableLogged = true;
    // Deliberately avoid logging config values or any credential material.
    // ignore: avoid_print
    print(message);
  }
}