import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/error/app_exception.dart';
import '../domain/auth_repository.dart';
import '../domain/user.dart';

sealed class AuthState {
  const AuthState();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated({this.message, this.logoutError});
  final String? message;
  final AppException? logoutError;
}

class AuthAuthenticated extends AuthState {
  const AuthAuthenticated(this.user);
  final User user;
}

class AuthFailure extends AuthState {
  const AuthFailure(this.error);
  final AppException error;
}

class AuthCubit extends Cubit<AuthState> {
  AuthCubit(this._repository) : super(const AuthLoading());
  final AuthRepository _repository;
  Future<void> restore() async {
    emit(const AuthLoading());
    if (!await _repository.hasStoredSession()) {
      emit(const AuthUnauthenticated());
      return;
    }
    try {
      emit(AuthAuthenticated(await _repository.validateSession()));
    } on InvalidSessionException catch (error) {
      emit(AuthUnauthenticated(message: error.message));
    } on AppException catch (e) {
      emit(AuthFailure(e));
    }
  }

  Future<void> signIn(String username, String password) async {
    emit(const AuthLoading());
    try {
      emit(AuthAuthenticated(await _repository.login(username, password)));
    } on AppException catch (e) {
      emit(AuthFailure(e));
    }
  }

  Future<void> signUp(
      {required String name,
      required String username,
      required String password,
      String? email}) async {
    emit(const AuthLoading());
    try {
      await _repository.register(
          name: name, username: username, password: password, email: email);
      emit(const AuthUnauthenticated(
          message: 'Account created. Please sign in.'));
    } on AppException catch (e) {
      emit(AuthFailure(e));
    }
  }

  Future<void> signOut() async {
    AppException? error;
    try {
      await _repository.logout();
    } on AppException catch (e) {
      error = e;
    }
    // Logout is local-first after the request has been attempted. The repository
    // guarantees secure token deletion in finally, even if the API is offline.
    emit(AuthUnauthenticated(logoutError: error));
  }
}
