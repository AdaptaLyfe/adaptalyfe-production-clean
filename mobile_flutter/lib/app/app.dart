import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/services.dart';

import '../core/analytics/firebase_analytics_service.dart';
import '../core/notifications/native_notification_service.dart';
import '../core/theme/app_theme.dart';
import '../features/auth/bloc/auth_bloc.dart';
import '../features/auth/bloc/auth_event.dart';
import '../features/auth/bloc/auth_state.dart';
import '../features/settings/bloc/settings_bloc.dart';
import '../features/settings/bloc/settings_event.dart';
import '../features/settings/bloc/settings_state.dart';
import 'routes.dart';

class AdaptalyfeApp extends StatefulWidget {
  const AdaptalyfeApp({super.key});

  @override
  State<AdaptalyfeApp> createState() => _AdaptalyfeAppState();
}

class _AdaptalyfeAppState extends State<AdaptalyfeApp>
    with WidgetsBindingObserver {
  late final AuthBloc _authBloc;
  late final SettingsBloc _settingsBloc;
  late final GoRouter _router;
  late final MethodChannel _deepLinkChannel;
  final _analytics = FirebaseAnalyticsService.instance;
  final _nativeNotifications = NativeNotificationService.instance;
  late final StreamSubscription<NativeNotificationAction>
      _notificationActionsSubscription;
  int? _settingsUserId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _authBloc = AuthBloc(createAuthRepository());
    _settingsBloc = SettingsBloc(createSettingsRepository());
    _router = createAppRouter(_authBloc);
    _deepLinkChannel = const MethodChannel('adaptalyfe/deep_links');
    _deepLinkChannel.setMethodCallHandler(_handleDeepLinkCall);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _loadInitialDeepLink();
      _loadSettingsForCurrentUser();
    });
    _notificationActionsSubscription =
        _nativeNotifications.actions.listen(_handleNotificationAction);
    for (final action in _nativeNotifications.takePendingActions()) {
      _handleNotificationAction(action);
    }
    _router.routerDelegate.addListener(_trackCurrentRoute);
    WidgetsBinding.instance.addPostFrameCallback((_) => _trackCurrentRoute());
    _analytics.startSession();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _notificationActionsSubscription.cancel();
    _deepLinkChannel.setMethodCallHandler(null);
    _router.routerDelegate.removeListener(_trackCurrentRoute);
    _analytics.endSession();
    _router.dispose();
    _settingsBloc.close();
    _authBloc.close();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _analytics.startSession();
      if (_authBloc.state is Authenticated) {
        _authBloc.add(const RefreshAuthentication());
      }
    } else if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
      _analytics.endSession();
    }
  }

  void _trackCurrentRoute() {
    final route = _router.routerDelegate.currentConfiguration.uri.path;
    _analytics.trackRoute(route);
  }

  void _handleNotificationAction(NativeNotificationAction action) {
    final route = action.route;
    if (route != null && route.isNotEmpty && mounted) {
      _router.go(route);
    }
  }

  Future<dynamic> _handleDeepLinkCall(MethodCall call) async {
    if (call.method == 'open' && call.arguments is String) {
      _openDeepLink(call.arguments as String);
    }
    return null;
  }

  Future<void> _loadInitialDeepLink() async {
    try {
      final link = await _deepLinkChannel.invokeMethod<String>('getInitialLink');
      if (link != null && link.isNotEmpty) {
        _openDeepLink(link);
      }
    } catch (_) {
      // Deep-link support is optional on platforms without the channel.
    }
  }

  void _openDeepLink(String rawLink) {
    final uri = Uri.tryParse(rawLink);
    if (uri == null || uri.scheme != 'adaptalyfe') return;

    final isResetPassword =
        uri.host == 'reset-password' || uri.path == '/reset-password';
    if (!isResetPassword) return;

    final token = uri.queryParameters['token'];
    final destination = token == null || token.isEmpty
        ? '/forgot-password'
        : '/reset-password?token=${Uri.encodeComponent(token)}';
    _router.go(destination);
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _authBloc),
        BlocProvider.value(value: _settingsBloc),
      ],
      child: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is Authenticated) {
            _loadSettingsForUser(state.user.id);
            final user = state.user;
            final createdAt = user.createdAt;
            final daysSinceSignup = createdAt == null
                ? null
                : DateTime.now()
                    .difference(createdAt)
                    .inDays
                    .clamp(0, 100000)
                    .toInt();
            _analytics.setAnalyticsUser(
              user.id,
              properties: {
                if (user.accountType != null)
                  'account_type': user.accountType!,
                if (user.subscriptionTier != null)
                  'subscription_tier': user.subscriptionTier!,
                if (user.subscriptionStatus != null)
                  'subscription_status': user.subscriptionStatus!,
                if (daysSinceSignup != null)
                  'days_since_signup': '$daysSinceSignup',
              },
            );
            if (daysSinceSignup != null) {
              _analytics.logRetention(daysSinceSignup, true);
            }
          } else if (state is Unauthenticated || state is AuthError) {
            _settingsUserId = null;
          }
        },
        child: BlocListener<SettingsBloc, SettingsState>(
          listenWhen: (previous, current) =>
              previous.user?.id != current.user?.id ||
              previous.status != current.status ||
              previous.notifications['notificationsEnabled'] !=
                  current.notifications['notificationsEnabled'] ||
              previous.notifications['pushEnabled'] !=
                  current.notifications['pushEnabled'],
          listener: (context, settingsState) {
            final authState = _authBloc.state;
            if (authState is Authenticated &&
                settingsState.user?.id == authState.user.id) {
              final enabled =
                  settingsState.notifications['notificationsEnabled'] ??
                      settingsState.notifications['pushEnabled'];
              unawaited(
                _nativeNotifications.setEnabled(enabled != false),
              );
            }
          },
          child: BlocBuilder<SettingsBloc, SettingsState>(
            builder: (context, settingsState) {
              final authState = _authBloc.state;
              final settingsBelongToCurrentUser =
                  authState is Authenticated &&
                      settingsState.user?.id == authState.user.id;
              final appearance = settingsBelongToCurrentUser
                  ? settingsState.theme
                  : const <String, dynamic>{};
              final highContrast = appearance['highContrast'] == true;
              final compactMode = appearance['compactMode'] == true;
              final lightTheme = _withDensity(
                highContrast ? AppTheme.highContrastLight : AppTheme.light,
                compactMode,
              );
              final darkTheme = _withDensity(
                highContrast ? AppTheme.highContrastDark : AppTheme.dark,
                compactMode,
              );

              return MaterialApp.router(
                title: 'Adaptalyfe',
                theme: lightTheme,
                darkTheme: darkTheme,
                highContrastTheme: _withDensity(
                  AppTheme.highContrastLight,
                  compactMode,
                ),
                highContrastDarkTheme: _withDensity(
                  AppTheme.highContrastDark,
                  compactMode,
                ),
                themeMode: AppTheme.modeForPreference(appearance['theme']),
                routerConfig: _router,
                builder: (context, child) {
                  final media = MediaQuery.of(context);
                  final platformTextScale = media.textScaler.scale(16) / 16;
                  final preferenceTextScale =
                      AppTheme.textScaleForPreference(appearance['fontSize']);
                  return MediaQuery(
                    data: media.copyWith(
                      textScaler: TextScaler.linear(
                        platformTextScale * preferenceTextScale,
                      ),
                      disableAnimations: media.disableAnimations ||
                          appearance['reducedMotion'] == true,
                    ),
                    child: child ?? const SizedBox.shrink(),
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }

  ThemeData _withDensity(ThemeData theme, bool compactMode) => compactMode
      ? theme.copyWith(visualDensity: VisualDensity.compact)
      : theme;

  void _loadSettingsForCurrentUser() {
    final state = _authBloc.state;
    if (state is Authenticated) {
      _loadSettingsForUser(state.user.id);
    }
  }

  void _loadSettingsForUser(int userId) {
    if (_settingsUserId == userId) return;
    _settingsUserId = userId;
    _settingsBloc.add(SettingsStarted(userId));
  }
}