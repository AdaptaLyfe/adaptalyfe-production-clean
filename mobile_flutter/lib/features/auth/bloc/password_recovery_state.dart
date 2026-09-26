import 'package:equatable/equatable.dart';

sealed class PasswordRecoveryState extends Equatable {
  const PasswordRecoveryState();

  @override
  List<Object?> get props => [];
}

final class PasswordRecoveryInitial extends PasswordRecoveryState {
  const PasswordRecoveryInitial();
}

final class PasswordRecoveryLoading extends PasswordRecoveryState {
  const PasswordRecoveryLoading(this.operation);

  final PasswordRecoveryOperation operation;

  @override
  List<Object?> get props => [operation];
}

enum PasswordRecoveryOperation { request, validate, reset }

final class PasswordResetRequestSent extends PasswordRecoveryState {
  const PasswordResetRequestSent();
}

final class PasswordResetTokenChecked extends PasswordRecoveryState {
  const PasswordResetTokenChecked({required this.isValid});

  final bool isValid;

  @override
  List<Object?> get props => [isValid];
}

final class PasswordResetCompleted extends PasswordRecoveryState {
  const PasswordResetCompleted();
}

final class PasswordRecoveryError extends PasswordRecoveryState {
  const PasswordRecoveryError(
    this.message, {
    this.operation,
  });

  final String message;
  final PasswordRecoveryOperation? operation;

  @override
  List<Object?> get props => [message, operation];
}