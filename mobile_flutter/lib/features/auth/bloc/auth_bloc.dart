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
      emit(AuthError(_messageFor(error)));
    }
  }

  Future<void> _onSignupSubmitted(
    SignupSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());

    try {
      final user = await repository.register(
        name: event.name,
        email: event.email,
        username: event.username,
        password: event.password,
        plan: event.plan,
        subscribeNewsletter: event.subscribeNewsletter,
      );
      emit(Authenticated(user));
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
}