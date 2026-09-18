import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../data/auth_repository.dart';
import 'password_recovery_event.dart';
import 'password_recovery_state.dart';

class PasswordRecoveryBloc
    extends Bloc<PasswordRecoveryEvent, PasswordRecoveryState> {
  PasswordRecoveryBloc(this.repository)
      : super(const PasswordRecoveryInitial()) {
    on<ForgotPasswordSubmitted>(_requestReset);
    on<ResetTokenValidationRequested>(_validateToken);
    on<ResetPasswordSubmitted>(_resetPassword);
  }

  final AuthRepository repository;

  Future<void> _requestReset(
    ForgotPasswordSubmitted event,
    Emitter<PasswordRecoveryState> emit,
  ) async {
    emit(const PasswordRecoveryLoading(PasswordRecoveryOperation.request));
    try {
      await repository.requestPasswordReset(event.email);
      emit(const PasswordResetRequestSent());
    } catch (_) {
      emit(
        const PasswordRecoveryError(
          'We couldn’t submit that request right now. Please try again.',
          operation: PasswordRecoveryOperation.request,
        ),
      );
    }
  }

  Future<void> _validateToken(
    ResetTokenValidationRequested event,
    Emitter<PasswordRecoveryState> emit,
  ) async {
    emit(const PasswordRecoveryLoading(PasswordRecoveryOperation.validate));
    try {
      final isValid = event.token.trim().isNotEmpty &&
          await repository.validatePasswordResetToken(event.token.trim());
      emit(PasswordResetTokenChecked(isValid: isValid));
    } catch (_) {
      emit(const PasswordResetTokenChecked(isValid: false));
    }
  }

  Future<void> _resetPassword(
    ResetPasswordSubmitted event,
    Emitter<PasswordRecoveryState> emit,
  ) async {
    emit(const PasswordRecoveryLoading(PasswordRecoveryOperation.reset));
    try {
      await repository.resetPassword(
        token: event.token,
        password: event.password,
      );
      emit(const PasswordResetCompleted());
    } catch (error) {
      emit(
        PasswordRecoveryError(
          _messageFor(error),
          operation: PasswordRecoveryOperation.reset,
        ),
      );
    }
  }

  String _messageFor(Object error) {
    if (error is ApiException) {
      return error.message;
    }
    if (error is FormatException) {
      return error.message;
    }
    return 'We couldn’t submit that request right now. Please try again.';
  }
}