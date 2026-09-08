import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../../auth/data/auth_repository.dart';
import 'splash_event.dart';
import 'splash_state.dart';

class SplashBloc extends Bloc<SplashEvent, SplashState> {
  SplashBloc(this.authRepository) : super(const SplashInitial()) {
    on<SplashStarted>(_onSplashStarted);
  }

  final AuthRepository authRepository;

  Future<void> _onSplashStarted(
    SplashStarted event,
    Emitter<SplashState> emit,
  ) async {
    emit(const SplashLoading());

    try {
      if (!await authRepository.hasSessionToken()) {
        emit(const SplashUnauthenticated());
        return;
      }

      final user = await authRepository.getCurrentUser();
      emit(SplashAuthenticated(user));
    } on ApiException catch (error) {
      if (error.type == ApiErrorType.unauthorized) {
        await authRepository.clearLocalSession();
        emit(const SplashUnauthenticated());
        return;
      }

      emit(SplashError(error.message));
    } catch (error) {
      emit(SplashError(_messageFor(error)));
    }
  }

  String _messageFor(Object error) {
    if (error is FormatException) {
      return error.message;
    }

    return 'We could not check your session. Please try again.';
  }
}