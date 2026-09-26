import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../data/auth_repository.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc(this.repository) : super(const AuthInitial()) {
    on<LoginSubmitted>(_onLoginSubmitted);
    on<SignupSubmitted>(_onSignupSubmitted);
    on<CheckAuthentication>(_onCheckAuthentication);
    on<RefreshAuthentication>(_onRefreshAuthentication);
    on<LogoutRequested>(_onLogoutRequested);
  }

  final AuthRepository repository;

  Future<void> _onLoginSubmitted(
    LoginSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    try {
      final user = await repository.login(
        username: event.username,
        password: event.password,
      );
      emit(Authenticated(user));
    } catch (error) {
      emit(AuthError(_loginMessageFor(error)));
    }
  }

  Future<void> _onSignupSubmitted(
    SignupSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    try {
      final registration = await repository.register(
        name: event.name,
        email: event.email,
        username: event.username,
        password: event.password,
        plan: event.plan,
        subscribeNewsletter: event.subscribeNewsletter,
        invitationCode: event.invitationCode,
      );
      emit(
        Authenticated(
          registration.user,
          organizationCodeApplied: registration.organizationCodeApplied,
        ),
      );
    } catch (error) {
      emit(AuthError(_messageFor(error)));
    }
  }

  Future<void> _onCheckAuthentication(
    CheckAuthentication event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthChecking());

    if (!await repository.hasSessionToken()) {
      emit(const Unauthenticated());
      return;
    }

    try {
      final user = await repository.getCurrentUser();
      emit(Authenticated(user));
    } on ApiException catch (error) {
      if (error.type == ApiErrorType.unauthorized) {
        await repository.clearLocalSession();
        emit(const Unauthenticated());
        return;
      }

      emit(AuthError(error.message));
    } catch (error) {
      emit(AuthError(_messageFor(error)));
    }
  }

  Future<void> _onRefreshAuthentication(
    RefreshAuthentication event,
    Emitter<AuthState> emit,
  ) async {
    final currentState = state;
    if (currentState is! Authenticated) return;

    try {
      // Keep the authenticated state while refreshing so app resume does not
      // redirect through the splash screen or disrupt the current route.
      final user = await repository.getCurrentUser();
      // Do not let a slow resume request restore a session after a logout or
      // a different user has already taken over the bloc.
      final latestState = state;
      if (latestState is! Authenticated ||
          latestState.user.id != currentState.user.id) {
        return;
      }
      emit(
        Authenticated(
          user,
          organizationCodeApplied: currentState.organizationCodeApplied,
        ),
      );
    } on ApiException catch (error) {
      if (error.type == ApiErrorType.unauthorized) {
        await repository.clearLocalSession();
        emit(const Unauthenticated());
      }
      // Transient resume failures leave the last known authenticated state in
      // place. The next resume or explicit screen refresh can retry.
    } catch (_) {
      // Keep the last known authenticated state on transient network errors.
    }
  }

  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    try {
      await repository.logout();
    } catch (_) {
      // The repository clears the local session in its finally block. A
      // failed server-side logout must not keep the user inside Home.
    }

    emit(const Unauthenticated());
  }

  String _messageFor(Object error) {
    if (error is ApiException) {
      if (error.type == ApiErrorType.unauthorized) {
        return 'Invalid email or password. Please try again.';
      }
      return error.message;
    }

    if (error is FormatException) {
      return error.message;
    }

    return 'Something went wrong. Please try again.';
  }

  String _loginMessageFor(Object error) {
    if (error is ApiException && error.type == ApiErrorType.unauthorized) {
      return 'Invalid email or password. Please try again.';
    }

    if (error is ApiException && error.message.trim().isNotEmpty) {
      return error.message;
    }
    if (error is FormatException && error.message.trim().isNotEmpty) {
      return error.message;
    }

    return 'Invalid username or password';
  }
}