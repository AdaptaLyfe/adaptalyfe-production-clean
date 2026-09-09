import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../core/network/api_client.dart';
import '../core/storage/local_storage.dart';
import '../features/auth/bloc/auth_bloc.dart';
import '../features/auth/bloc/auth_state.dart';
import '../features/auth/data/auth_api.dart';
import '../features/auth/data/auth_repository.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/signup_screen.dart';
import '../features/academic/bloc/academic_bloc.dart';
import '../features/academic/bloc/academic_event.dart';
import '../features/academic/data/academic_api.dart';
import '../features/academic/data/academic_repository.dart';
import '../features/academic/presentation/academic_planner_screen.dart';
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
import '../features/home/data/home_repository.dart';
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
import '../features/splash/presentation/splash_screen.dart';

GoRouter createAppRouter(AuthBloc authBloc) {
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: _AuthRouterRefresh(authBloc),
    redirect: (context, state) {
      final location = state.uri.path;
      final authState = authBloc.state;
      final isAuthRoute =
          location == '/splash' ||
          location == '/login' ||
          location == '/signup';

      if (authState is AuthInitial || authState is AuthChecking) {
        return location == '/splash' ? null : '/splash';
      }

      if (authState is Authenticated && isAuthRoute) {
        return '/home';
      }

      final isProtectedRoute =
          location == '/home' ||
          location == '/daily-tasks' ||
          location == '/notifications' ||
          location == '/financial' ||
          location == '/medical' ||
          location == '/meal-shopping' ||
           location == '/academic-planner' ||
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
        path: '/home',
        builder: (context, state) => BlocProvider(
          create: (_) => HomeBloc(_createHomeRepository())
            ..add(const HomeStarted()),
          child: const HomeScreen(),
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
  return HomeRepository(
    ApiClient(localStorage: localStorage),
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
