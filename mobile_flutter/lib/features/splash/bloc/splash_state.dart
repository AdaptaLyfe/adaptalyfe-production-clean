import 'package:equatable/equatable.dart';

import '../../../models/user_model.dart';

sealed class SplashState extends Equatable {
  const SplashState();

  @override
  List<Object?> get props => [];
}

final class SplashInitial extends SplashState {
  const SplashInitial();
}

final class SplashLoading extends SplashState {
  const SplashLoading();
}

final class SplashAuthenticated extends SplashState {
  const SplashAuthenticated(this.user);

  final UserModel user;

  @override
  List<Object?> get props => [user];
}

final class SplashUnauthenticated extends SplashState {
  const SplashUnauthenticated();
}

final class SplashError extends SplashState {
  const SplashError(this.message);

  final String message;

  @override
  List<Object?> get props => [message];
}