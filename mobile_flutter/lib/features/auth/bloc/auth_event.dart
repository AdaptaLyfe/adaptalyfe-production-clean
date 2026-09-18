import 'package:equatable/equatable.dart';

sealed class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

final class LoginSubmitted extends AuthEvent {
  const LoginSubmitted({
    required this.username,
    required this.password,
  });

  final String username;
  final String password;

  @override
  List<Object?> get props => [username, password];
}

final class SignupSubmitted extends AuthEvent {
  const SignupSubmitted({
    required this.name,
    this.email,
    required this.username,
    required this.password,
    this.plan = 'basic',
    this.subscribeNewsletter = false,
    this.invitationCode = '',
  });

  final String name;
  final String? email;
  final String username;
  final String password;
  final String plan;
  final bool subscribeNewsletter;
  final String invitationCode;

  @override
  List<Object?> get props => [
        name,
        email,
        username,
        password,
        plan,
        subscribeNewsletter,
        invitationCode,
      ];
}

final class CheckAuthentication extends AuthEvent {
  const CheckAuthentication();
}

final class LogoutRequested extends AuthEvent {
  const LogoutRequested();
}