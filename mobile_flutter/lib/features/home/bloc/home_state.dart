import 'package:equatable/equatable.dart';

import '../../../models/user_model.dart';

sealed class HomeState extends Equatable {
  const HomeState();

  @override
  List<Object?> get props => [];
}

final class HomeInitial extends HomeState {
  const HomeInitial();
}

final class HomeLoading extends HomeState {
  const HomeLoading();
}

final class HomeLoaded extends HomeState {
  const HomeLoaded(this.user);

  final UserModel user;

  @override
  List<Object?> get props => [user];
}

final class HomeError extends HomeState {
  const HomeError(
    this.message, {
    this.sessionInvalid = false,
  });

  final String message;
  final bool sessionInvalid;

  @override
  List<Object?> get props => [message, sessionInvalid];
}