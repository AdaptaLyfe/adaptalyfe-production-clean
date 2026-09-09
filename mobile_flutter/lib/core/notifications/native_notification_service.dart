import 'dart:async';
import 'dart:convert';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

import '../../firebase_options.dart';

const _notificationChannelId = 'adaptalyfe_general';
const _notificationChannelName = 'Adaptalyfe notifications';
const _notificationChannelDescription =
    'Reminders and important Adaptalyfe updates.';

/// A user action from a native notification. The native layer does not know
/// about BLoCs or application state; it only reports an optional app route.
class NativeNotificationAction {
  const NativeNotificationAction({
    this.route,
    this.payload,
  });

  final String? route;
  final String? payload;
}

enum NativeNotificationPermission {
  unknown,
  granted,
  denied,
}

/// Owns platform notification permissions, FCM transport, and local
/// notification presentation/scheduling.
///
/// Server notification data remains in NotificationsBloc and
/// NotificationsRepository. This service never fetches or marks server
/// notifications as read.
class NativeNotificationService {
  NativeNotificationService._();

  static final NativeNotificationService instance =
      NativeNotificationService._();

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  final StreamController<NativeNotificationAction> _actions =
      StreamController<NativeNotificationAction>.broadcast();
  final List<NativeNotificationAction> _pendingActions =
      <NativeNotificationAction>[];

  Future<void>? _initialization;
  FirebaseMessaging? _messaging;
  NativeNotificationPermission _permission =
      NativeNotificationPermission.unknown;

  Stream<NativeNotificationAction> get actions => _actions.stream;
  NativeNotificationPermission get permission => _permission;

  Future<void> initialize() {
    return _initialization ??= _initialize();
  }

  Future<void> _initialize() async {
    tz.initializeTimeZones();
    await _configureLocalNotifications();
    await _configureFirebaseMessaging();
  }

  Future<void> _configureLocalNotifications() async {
    try {
      final localTimezone = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(localTimezone.name));
    } catch (_) {
      // The timezone package remains usable with its default location in
      // unusual simulator/test environments.
    }

    const androidSettings = AndroidInitializationSettings('app_icon');
    const darwinSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );
    final settings = InitializationSettings(
      android: androidSettings,
      iOS: darwinSettings,
    );

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: _onLocalNotificationResponse,
    );

    final android = _localNotifications.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    await android?.createNotificationChannel(
      const AndroidNotificationChannel(
        _notificationChannelId,
        _notificationChannelName,
        description: _notificationChannelDescription,
        importance: Importance.high,
      ),
    );

    final launchDetails =
        await _localNotifications.getNotificationAppLaunchDetails();
    final response = launchDetails?.notificationResponse;
    if (launchDetails?.didNotificationLaunchApp == true &&
        response?.payload != null) {
      _publishAction(response!.payload);
    }
  }

  Future<void> _configureFirebaseMessaging() async {
    if (!DefaultFirebaseOptions.isConfigured) return;

    try {
      await _ensureFirebaseInitialized();
      final messaging = FirebaseMessaging.instance;
      _messaging = messaging;

      await messaging.setForegroundNotificationPresentationOptions(
        alert: false,
        badge: true,
        sound: true,
      );

      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
      FirebaseMessaging.onMessageOpenedApp.listen(_handleOpenedMessage);
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        _publishAction(_payloadForMessage(initialMessage));
      }
    } catch (_) {
      // Native push is optional. Local notifications and server data remain
      // available if Firebase/APNs is not configured for this build.
    }
  }

  Future<void> _ensureFirebaseInitialized() async {
    try {
      Firebase.app();
    } on FirebaseException catch (error) {
      if (error.code != 'no-app') rethrow;
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
    }
  }

  Future<NativeNotificationPermission> requestPermission() async {
    await initialize();

    var granted = true;
    final android = _localNotifications.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    if (android != null) {
      granted = await android.requestNotificationsPermission() ?? false;
    }

    final darwin = _localNotifications.resolvePlatformSpecificImplementation<
        DarwinFlutterLocalNotificationsPlugin>();
    if (darwin != null) {
      granted = (await darwin.requestPermissions(
            alert: true,
            badge: true,
            sound: true,
          ) ??
          false);
    }

    final messaging = _messaging;
    if (messaging != null) {
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: true,
      );
      granted = granted &&
          (settings.authorizationStatus == AuthorizationStatus.authorized ||
              settings.authorizationStatus == AuthorizationStatus.provisional);
    }

    _permission = granted
        ? NativeNotificationPermission.granted
        : NativeNotificationPermission.denied;
    return _permission;
  }

  Future<void> scheduleLocalNotification(
    String title,
    String body,
    DateTime scheduledTime, {
    String? tag,
    String? route,
  }) async {
    await initialize();
    if (!scheduledTime.isAfter(DateTime.now())) return;

    await _localNotifications.zonedSchedule(
      _notificationId(tag ?? '$title-${scheduledTime.millisecondsSinceEpoch}'),
      title,
      body,
      tz.TZDateTime.from(scheduledTime, tz.local),
      _notificationDetails,
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      payload: route ?? '/notifications',
    );
  }

  Future<void> scheduleMedicationReminder(
    String medicationName,
    DateTime time,
  ) =>
      scheduleLocalNotification(
        'Medication Reminder',
        'Time to take your $medicationName',
        time,
        tag: 'medication-$medicationName',
        route: '/medical',
      );

  Future<void> scheduleAppointmentReminder(
    String appointmentTitle,
    DateTime appointmentTime,
  ) {
    final reminderTime =
        appointmentTime.subtract(const Duration(hours: 1));
    return scheduleLocalNotification(
      'Appointment Reminder',
      '$appointmentTitle in 1 hour',
      reminderTime,
      tag: 'appointment-$appointmentTitle',
      route: '/calendar',
    );
  }

  Future<void> scheduleDailyCheckIn([DateTime? time]) {
    final tomorrow = (time ?? DateTime.now()).add(const Duration(days: 1));
    return scheduleLocalNotification(
      'Daily Check-in',
      'How are you feeling today? Remember to complete your mood check.',
      tomorrow,
      tag: 'daily-checkin',
      route: '/mood-tracking',
    );
  }

  Future<void> sendEmergencyNotification(String message) async {
    await initialize();
    await _localNotifications.show(
      _notificationId('emergency'),
      'Adaptalyfe Emergency Alert',
      message,
      _notificationDetails,
      payload: '/notifications',
    );
  }

  Future<void> cancelScheduledNotification(String tag) async {
    await initialize();
    await _localNotifications.cancel(_notificationId(tag));
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    final title = message.notification?.title ??
        message.data['title']?.toString() ??
        'Adaptalyfe';
    final body = message.notification?.body ??
        message.data['body']?.toString() ??
        message.data['message']?.toString() ??
        '';
    if (body.isEmpty) return;

    await _localNotifications.show(
      _notificationId(message.messageId ?? '$title-$body'),
      title,
      body,
      _notificationDetails,
      payload: _payloadForMessage(message),
    );
  }

  void _handleOpenedMessage(RemoteMessage message) {
    _publishAction(_payloadForMessage(message));
  }

  void _onLocalNotificationResponse(NotificationResponse response) {
    if (response.actionId == NotificationResponse.dismissActionId) return;
    _publishAction(response.payload);
  }

  void _publishAction(String? payload) {
    if (payload == null || payload.isEmpty) return;
    final action = NativeNotificationAction(
      route: _routeFromPayload(payload),
      payload: payload,
    );
    if (_actions.hasListener) {
      _actions.add(action);
    } else {
      _pendingActions.add(action);
    }
  }

  List<NativeNotificationAction> takePendingActions() {
    final pending = List<NativeNotificationAction>.from(_pendingActions);
    _pendingActions.clear();
    return pending;
  }

  String _payloadForMessage(RemoteMessage message) {
    final route = message.data['route']?.toString();
    if (route != null && route.isNotEmpty) return route;
    return '/notifications';
  }

  String? _routeFromPayload(String payload) {
    if (payload.startsWith('/')) return payload;
    try {
      final decoded = jsonDecode(payload);
      if (decoded is Map && decoded['route'] is String) {
        return decoded['route'] as String;
      }
    } catch (_) {
      // A non-JSON payload is still useful to the caller as raw data.
    }
    return '/notifications';
  }

  int _notificationId(String value) {
    var hash = 17;
    for (final codeUnit in value.codeUnits) {
      hash = (hash * 31 + codeUnit) & 0x7fffffff;
    }
    return hash;
  }

  NotificationDetails get _notificationDetails => const NotificationDetails(
        android: AndroidNotificationDetails(
          _notificationChannelId,
          _notificationChannelName,
          channelDescription: _notificationChannelDescription,
          importance: Importance.high,
          priority: Priority.high,
          icon: 'app_icon',
        ),
        iOS: DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      );
}

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (!DefaultFirebaseOptions.isConfigured) return;

  try {
    WidgetsFlutterBinding.ensureInitialized();
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    final plugin = FlutterLocalNotificationsPlugin();
    const initializationSettings = InitializationSettings(
      android: AndroidInitializationSettings('app_icon'),
      iOS: DarwinInitializationSettings(),
    );
    await plugin.initialize(initializationSettings);
    await plugin.show(
      _backgroundNotificationId(message.messageId ?? 'remote'),
      message.notification?.title ??
          message.data['title']?.toString() ??
          'Adaptalyfe',
      message.notification?.body ??
          message.data['body']?.toString() ??
          message.data['message']?.toString() ??
          '',
      const NotificationDetails(
        android: AndroidNotificationDetails(
          _notificationChannelId,
          _notificationChannelName,
          channelDescription: _notificationChannelDescription,
          importance: Importance.high,
          priority: Priority.high,
          icon: 'app_icon',
        ),
        iOS: DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: message.data['route']?.toString() ?? '/notifications',
    );
  } catch (_) {
    // Background delivery must not crash the isolate.
  }
}

int _backgroundNotificationId(String value) {
  var hash = 17;
  for (final codeUnit in value.codeUnits) {
    hash = (hash * 31 + codeUnit) & 0x7fffffff;
  }
  return hash;
}