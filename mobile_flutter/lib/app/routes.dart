import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../core/network/api_client.dart';
import '../core/network/current_user_api.dart';
import '../core/storage/local_storage.dart';
import '../features/auth/bloc/auth_bloc.dart';
import '../features/auth/bloc/auth_state.dart';
import '../features/auth/bloc/password_recovery_bloc.dart';
import '../features/auth/data/auth_api.dart';
import '../features/auth/data/auth_repository.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/password_recovery_screen.dart';
import '../features/auth/presentation/signup_screen.dart';
import '../features/academic/bloc/academic_bloc.dart';
import '../features/academic/bloc/academic_event.dart';
import '../features/academic/data/academic_api.dart';
import '../features/academic/data/academic_repository.dart';
import '../features/academic/presentation/academic_planner_screen.dart';
import '../features/calendar/bloc/calendar_bloc.dart';
import '../features/calendar/bloc/calendar_event.dart';
import '../features/calendar/data/calendar_api.dart';
import '../features/calendar/data/calendar_repository.dart';
import '../features/calendar/presentation/calendar_screen.dart';
import '../features/caregiver/bloc/caregiver_bloc.dart';
import '../features/caregiver/bloc/caregiver_event.dart';
import '../features/caregiver/data/caregiver_api.dart';
import '../features/caregiver/data/caregiver_repository.dart';
import '../features/caregiver/presentation/accept_invitation_screen.dart';
import '../features/caregiver/presentation/caregiver_dashboard_screen.dart';
import '../features/caregiver/presentation/caregiver_setup_screen.dart';
import '../features/daily_tasks/bloc/daily_tasks_bloc.dart';
import '../features/daily_tasks/bloc/daily_tasks_event.dart';
import '../features/daily_tasks/data/daily_tasks_api.dart';
import '../features/daily_tasks/data/daily_tasks_repository.dart';
import '../features/daily_tasks/presentation/daily_tasks_screen.dart';
import '../features/financial/bloc/financial_bloc.dart';
import '../features/financial/bloc/financial_event.dart';
import '../features/financial/data/financial_api.dart';
import '../features/financial/data/financial_repository.dart';
import '../features/financial/presentation/financial_screen.dart';
import '../features/home/bloc/home_bloc.dart';
import '../features/home/bloc/home_event.dart';
import '../features/home/data/home_quick_actions_store.dart';
import '../features/home/data/home_repository.dart';
import '../features/home/presentation/ai_chat_assistant_screen.dart';
import '../features/home/presentation/home_screen.dart';
import '../features/medical/bloc/medical_bloc.dart';
import '../features/medical/bloc/medical_event.dart';
import '../features/medical/data/medical_api.dart';
import '../features/medical/data/medical_repository.dart';
import '../features/medical/presentation/medical_screen.dart';
import '../features/mood/bloc/mood_bloc.dart';
import '../features/mood/bloc/mood_event.dart';
import '../features/mood/data/mood_api.dart';
import '../features/mood/data/mood_repository.dart';
import '../features/mood/presentation/mood_tracking_screen.dart';
import '../features/meal_shopping/bloc/meal_shopping_bloc.dart';
import '../features/meal_shopping/bloc/meal_shopping_event.dart';
import '../features/meal_shopping/data/meal_shopping_api.dart';
import '../features/meal_shopping/data/meal_shopping_repository.dart';
import '../features/meal_shopping/presentation/meal_shopping_screen.dart';
import '../features/notifications/bloc/notifications_bloc.dart';
import '../features/notifications/bloc/notifications_event.dart';
import '../features/notifications/data/notifications_api.dart';
import '../features/notifications/data/notifications_repository.dart';
import '../features/notifications/presentation/notifications_screen.dart';
import '../features/personal_documents/data/personal_documents_repository.dart';
import '../features/personal_documents/presentation/personal_documents_screen.dart';
import '../features/rewards/bloc/rewards_bloc.dart';
import '../features/rewards/bloc/rewards_event.dart';
import '../features/rewards/data/rewards_api.dart';
import '../features/rewards/data/rewards_repository.dart';
import '../features/rewards/presentation/rewards_screen.dart';
import '../features/settings/bloc/settings_bloc.dart';
import '../features/settings/bloc/settings_event.dart';
import '../features/settings/data/dashboard_layout_store.dart';
import '../features/settings/data/local_settings_store.dart';
import '../features/settings/data/settings_api.dart';
import '../features/settings/data/settings_repository.dart';
import '../features/settings/presentation/settings_screen.dart';
import '../features/skills/bloc/skills_bloc.dart';
import '../features/skills/bloc/skills_event.dart';
import '../features/skills/data/skills_api.dart';
import '../features/skills/data/skills_repository.dart';
import '../features/skills/presentation/skills_screen.dart';
import '../features/resources/bloc/resources_bloc.dart';
import '../features/resources/bloc/resources_event.dart';
import '../features/resources/data/resources_api.dart';
import '../features/resources/data/resources_repository.dart';
import '../features/resources/presentation/resources_screen.dart';
import '../features/sleep/bloc/sleep_bloc.dart';
import '../features/sleep/bloc/sleep_event.dart';
import '../features/sleep/data/sleep_api.dart';
import '../features/sleep/data/sleep_repository.dart';
import '../features/sleep/presentation/sleep_tracking_screen.dart';
import '../features/splash/presentation/splash_screen.dart';
import '../features/subscription/bloc/subscription_bloc.dart';
import '../features/subscription/bloc/subscription_event.dart';
import '../features/subscription/data/purchase_service.dart';
import '../features/subscription/data/stripe_payment_service.dart';
import '../features/subscription/data/subscription_api.dart';
import '../features/subscription/data/subscription_repository.dart';
import '../features/subscription/presentation/subscription_screen.dart';
import 'app_route_observer.dart';
import 'app_navigation.dart';

GoRouter createAppRouter(AuthBloc authBloc) {
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: _AuthRouterRefresh(authBloc),
    redirect: (context, state) {
      final location = state.uri.path;
      final authState = authBloc.state;
      final isPasswordRecoveryRoute =
          location == '/forgot-password' || location == '/reset-password';

      if (authState is AuthInitial || authState is AuthChecking) {
        return location == '/splash' || isPasswordRecoveryRoute
            ? null
            : '/splash';
      }

      // Login and signup own their post-auth destination (including
      // invitation and subscription flows). Redirecting them to /home at the
      // same time creates competing navigation calls and can stack routes
      // while an auth overlay is being removed.
      if (authState is Authenticated && location == '/splash') {
        return '/home';
      }

      if (location == '/accept-invitation' &&
          authState is Unauthenticated) {
        final code = state.uri.queryParameters['code'];
        if (code == null || code.trim().isEmpty) {
          return '/login';
        }
        return '/login?code=${Uri.encodeComponent(code)}';
      }

      final isProtectedRoute =
          location == '/home' ||
          location == '/ai-chat' ||
          location == '/dashboard' ||
          location == '/daily-tasks' ||
          location == '/notifications' ||
          location == '/financial' ||
          location == '/medical' ||
          location == '/meal-shopping' ||
          location == '/academic-planner' ||
          location == '/calendar' ||
          location == '/sleep-tracking' ||
          location == '/skills-milestones' ||
          location == '/resources' ||
          location == '/rewards' ||
          location == '/settings' ||
          location == '/subscription' ||
          location == '/caregiver-setup' ||
          location == '/accept-invitation' ||
          location == '/caregiver-dashboard' ||
          location == '/caregiver' ||
          location == '/pharmacy' ||
          location == '/personal-documents' ||
          location == '/mood-tracking';

      if (isProtectedRoute && authState is! Authenticated) {
        if (authState is Unauthenticated) {
          return '/login';
        }
        if (authState is AuthLoading) {
          return null;
        }
        return '/splash';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => LoginScreen(
          initialInvitationCode: state.uri.queryParameters['code'],
        ),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => SignupScreen(
          initialInvitationCode: state.uri.queryParameters['code'],
        ),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => BlocProvider(
          create: (_) => PasswordRecoveryBloc(createAuthRepository()),
          child: const ForgotPasswordScreen(),
        ),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) => BlocProvider(
          create: (_) => PasswordRecoveryBloc(createAuthRepository()),
          child: ResetPasswordScreen(
            token: state.uri.queryParameters['token'] ?? '',
          ),
        ),
      ),
      GoRoute(
        path: '/dashboard',
        redirect: (context, state) => '/home',
      ),
      ShellRoute(
        observers: [appRouteObserver],
        builder: (context, state, child) => BlocProvider(
          create: (_) => SubscriptionBloc(
            _createSubscriptionRepository(),
            PurchaseService(),
            StripePaymentService(),
          )..add(const SubscriptionStarted()),
          child: AppNavigationShell(
            location: state.uri.path,
            child: child,
          ),
        ),
        routes: [
          GoRoute(
            path: '/home',
            builder: (context, state) {
              final currentAuthState = authBloc.state;
              final userId = currentAuthState is Authenticated
                  ? currentAuthState.user.id
                  : 0;
              return MultiBlocProvider(
                providers: [
                  BlocProvider(
                    create: (_) => HomeBloc(_createHomeRepository())
                      ..add(const HomeStarted()),
                  ),
                  BlocProvider(
                    create: (_) => DailyTasksBloc(_createDailyTasksRepository())
                      ..add(const DailyTasksStarted()),
                  ),
                  BlocProvider(
                    create: (_) => MoodBloc(_createMoodRepository())
                      ..add(const MoodStarted()),
                  ),
                  BlocProvider(
                    create: (_) => FinancialBloc(_createFinancialRepository())
                      ..add(const FinancialStarted()),
                  ),
                  BlocProvider(
                    create: (_) => CalendarBloc(_createCalendarRepository())
                      ..add(const CalendarStarted()),
                  ),
                  BlocProvider(
                    create: (_) => MedicalBloc(_createMedicalRepository())
                      ..add(const MedicalStarted()),
                  ),
                  BlocProvider(
                    create: (_) => RewardsBloc(_createRewardsRepository())
                      ..add(const RewardsStarted()),
                  ),
                  BlocProvider(
                    create: (_) => CaregiverBloc(_createCaregiverRepository())
                      ..add(CaregiverStarted(userId)),
                  ),
                ],
                child: const HomeScreen(),
              );
            },
          ),
          GoRoute(
            path: '/ai-chat',
            builder: (context, state) => BlocProvider(
              create: (_) => HomeBloc(_createHomeRepository())
                ..add(const HomeStarted()),
              child: const AIChatAssistantScreen(),
            ),
          ),
          GoRoute(
            path: '/daily-tasks',
            builder: (context, state) => BlocProvider(
              create: (_) => DailyTasksBloc(_createDailyTasksRepository())
                ..add(const DailyTasksStarted()),
              child: const DailyTasksScreen(),
            ),
          ),
          GoRoute(
            path: '/notifications',
            builder: (context, state) => BlocProvider(
              create: (_) => NotificationsBloc(_createNotificationsRepository())
                ..add(const NotificationsStarted()),
              child: const NotificationsScreen(),
            ),
          ),
          GoRoute(
            path: '/financial',
            builder: (context, state) => BlocProvider(
              create: (_) => FinancialBloc(_createFinancialRepository())
                ..add(const FinancialStarted()),
              child: const FinancialScreen(),
            ),
          ),
          GoRoute(
            path: '/mood-tracking',
            builder: (context, state) => BlocProvider(
              create: (_) => MoodBloc(_createMoodRepository())
                ..add(const MoodStarted()),
              child: const MoodTrackingScreen(),
            ),
          ),
          GoRoute(
            path: '/medical',
            builder: (context, state) => BlocProvider(
              create: (_) => MedicalBloc(_createMedicalRepository())
                ..add(const MedicalStarted()),
              child: const MedicalScreen(),
            ),
          ),
          GoRoute(
            path: '/pharmacy',
            builder: (context, state) => BlocProvider(
              create: (_) => MedicalBloc(_createMedicalRepository())
                ..add(const MedicalStarted()),
              child: const PharmacyScreen(),
            ),
          ),
          GoRoute(
            path: '/meal-shopping',
            builder: (context, state) => BlocProvider(
              create: (_) => MealShoppingBloc(_createMealShoppingRepository())
                ..add(const MealShoppingStarted()),
              child: const MealShoppingScreen(),
            ),
          ),
          GoRoute(
            path: '/academic-planner',
            builder: (context, state) => BlocProvider(
              create: (_) => AcademicBloc(_createAcademicRepository())
                ..add(const AcademicStarted()),
              child: const AcademicPlannerScreen(),
            ),
          ),
          GoRoute(
            path: '/calendar',
            builder: (context, state) => BlocProvider(
              create: (_) => CalendarBloc(_createCalendarRepository())
                ..add(const CalendarStarted()),
              child: const CalendarScreen(),
            ),
          ),
          GoRoute(
            path: '/sleep-tracking',
            builder: (context, state) => BlocProvider(
              create: (_) => SleepBloc(_createSleepRepository())
                ..add(const SleepStarted()),
              child: const SleepTrackingScreen(),
            ),
          ),
          GoRoute(
            path: '/skills-milestones',
            builder: (context, state) => BlocProvider(
              create: (_) => SkillsBloc(_createSkillsRepository())
                ..add(const SkillsStarted()),
              child: const SkillsScreen(),
            ),
          ),
          GoRoute(
            path: '/resources',
            builder: (context, state) => BlocProvider(
              create: (_) => ResourcesBloc(_createResourcesRepository())
                ..add(const ResourcesStarted()),
              child: const ResourcesScreen(),
            ),
          ),
          GoRoute(
            path: '/rewards',
            builder: (context, state) => BlocProvider(
              create: (_) => RewardsBloc(_createRewardsRepository())
                ..add(const RewardsStarted()),
              child: const RewardsScreen(),
            ),
          ),
          GoRoute(
            path: '/subscription',
            builder: (context, state) => const SubscriptionScreen(),
          ),
          GoRoute(
            path: '/settings',
            builder: (context, state) {
              final authState = authBloc.state;
              final userId = authState is Authenticated ? authState.user.id : 0;
              return BlocProvider(
                create: (_) => SettingsBloc(_createSettingsRepository())
                  ..add(SettingsStarted(userId)),
                child: SettingsScreen(userId: userId),
              );
            },
          ),
          GoRoute(
            path: '/caregiver-setup',
            builder: (context, state) {
              final user = authBloc.state;
              final userId = user is Authenticated ? user.user.id : 0;
              return BlocProvider(
                create: (_) => CaregiverBloc(_createCaregiverRepository())
                  ..add(CaregiverStarted(userId)),
                child: const CaregiverSetupScreen(),
              );
            },
          ),
          GoRoute(
            path: '/caregiver',
            builder: (context, state) {
              final currentAuthState = authBloc.state;
              final userId = currentAuthState is Authenticated
                  ? currentAuthState.user.id
                  : 0;
              return BlocProvider(
                create: (_) => CaregiverBloc(_createCaregiverRepository())
                  ..add(CaregiverStarted(userId)),
                child: const CaregiverSetupScreen(),
              );
            },
          ),
          GoRoute(
            path: '/personal-documents',
            builder: (context, state) => PersonalDocumentsScreen(
              repository: _createPersonalDocumentsRepository(),
            ),
          ),
          GoRoute(
            path: '/accept-invitation',
            builder: (context, state) {
              final user = authBloc.state;
              final userId = user is Authenticated ? user.user.id : 0;
              return BlocProvider(
                create: (_) => CaregiverBloc(_createCaregiverRepository())
                  ..add(CaregiverStarted(userId)),
                child: AcceptInvitationScreen(
                  initialCode: state.uri.queryParameters['code'],
                ),
              );
            },
          ),
          GoRoute(
            path: '/caregiver-dashboard',
            builder: (context, state) => BlocProvider(
              create: (_) => CaregiverBloc(_createCaregiverRepository())
                ..add(const LoadCareRecipients()),
              child: const CaregiverDashboardScreen(),
            ),
          ),
        ],
      ),
    ],
  );
}

AuthRepository createAuthRepository() {
  final localStorage = LocalStorage();
  final apiClient = ApiClient(localStorage: localStorage);
  return AuthRepository(
    api: AuthApi(apiClient),
    localStorage: localStorage,
  );
}

class _AuthRouterRefresh extends ChangeNotifier {
  _AuthRouterRefresh(AuthBloc authBloc) {
    _subscription = authBloc.stream.listen((_) => notifyListeners());
  }

  late final StreamSubscription<AuthState> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

HomeRepository _createHomeRepository() {
  final localStorage = LocalStorage();
  final client = ApiClient(localStorage: localStorage);
  return HomeRepository(
    CurrentUserApi(client),
    client,
    const DashboardLayoutStore(),
    const HomeQuickActionsStore(),
  );
}

DailyTasksRepository _createDailyTasksRepository() {
  final localStorage = LocalStorage();
  return DailyTasksRepository(
    DailyTasksApi(
      ApiClient(localStorage: localStorage),
    ),
  );
}

NotificationsRepository _createNotificationsRepository() {
  final localStorage = LocalStorage();
  return NotificationsRepository(
    NotificationsApi(
      ApiClient(localStorage: localStorage),
    ),
  );
}

FinancialRepository _createFinancialRepository() {
  final localStorage = LocalStorage();
  return FinancialRepository(
    FinancialApi(
      ApiClient(localStorage: localStorage),
    ),
  );
}

MoodRepository _createMoodRepository() {
  final localStorage = LocalStorage();
  return MoodRepository(
    MoodApi(
      ApiClient(localStorage: localStorage),
    ),
  );
}

MedicalRepository _createMedicalRepository() {
  final localStorage = LocalStorage();
  return MedicalRepository(
    MedicalApi(
      ApiClient(localStorage: localStorage),
    ),
  );
}

MealShoppingRepository _createMealShoppingRepository() {
  final localStorage = LocalStorage();
  return MealShoppingRepository(
    MealShoppingApi(
      ApiClient(localStorage: localStorage),
    ),
  );
}

AcademicRepository _createAcademicRepository() {
  final localStorage = LocalStorage();
  return AcademicRepository(
    AcademicApi(
      ApiClient(localStorage: localStorage),
    ),
  );
}

CalendarRepository _createCalendarRepository() {
  final localStorage = LocalStorage();
  return CalendarRepository(
    CalendarApi(
      ApiClient(localStorage: localStorage),
    ),
  );
}

SleepRepository _createSleepRepository() {
  final localStorage = LocalStorage();
  return SleepRepository(
    SleepApi(
      ApiClient(localStorage: localStorage),
    ),
  );
}

SkillsRepository _createSkillsRepository() {
  final localStorage = LocalStorage();
  return SkillsRepository(
    SkillsApi(
      ApiClient(localStorage: localStorage),
    ),
  );
}

ResourcesRepository _createResourcesRepository() {
  final localStorage = LocalStorage();
  return ResourcesRepository(
    ResourcesApi(
      ApiClient(localStorage: localStorage),
    ),
  );
}

RewardsRepository _createRewardsRepository() {
  final localStorage = LocalStorage();
  return RewardsRepository(
    RewardsApi(
      ApiClient(localStorage: localStorage),
    ),
  );
}

SubscriptionRepository _createSubscriptionRepository() {
  final localStorage = LocalStorage();
  return SubscriptionRepository(
    SubscriptionApi(
      ApiClient(localStorage: localStorage),
    ),
  );
}

CaregiverRepository _createCaregiverRepository() {
  final localStorage = LocalStorage();
  return CaregiverRepository(
    CaregiverApi(
      ApiClient(localStorage: localStorage),
    ),
  );
}

PersonalDocumentsRepository _createPersonalDocumentsRepository() {
  return PersonalDocumentsRepository(
    ApiClient(localStorage: LocalStorage()),
  );
}

SettingsRepository _createSettingsRepository() {
  final localStorage = LocalStorage();
  final client = ApiClient(localStorage: localStorage);
  return SettingsRepository(
    SettingsApi(client),
    const DashboardLayoutStore(),
    const LocalSettingsStore(),
  );
}
