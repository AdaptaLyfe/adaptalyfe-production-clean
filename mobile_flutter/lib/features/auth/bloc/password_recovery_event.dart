import 'package:equatable/equatable.dart';

sealed class PasswordRecoveryEvent extends Equatable {
  const PasswordRecoveryEvent();

  @override
  List<Object?> get props => [];
}

final class ForgotPasswordSubmitted extends PasswordRecoveryEvent {
  const ForgotPasswordSubmitted(this.email);

  final String email;

  @override
  List<Object?> get props => [email];
}

final class ResetTokenValidationRequested extends PasswordRecoveryEvent {
  const ResetTokenValidationRequested(this.token);

  final String token;

  @override
  List<Object?> get props => [token];
}

final class ResetPasswordSubmitted extends PasswordRecoveryEvent {
  const ResetPasswordSubmitted({
    required this.token,
    required this.password,
  });

  final String token;
  final String password;

  @override
  List<Object?> get props => [token, password];
}