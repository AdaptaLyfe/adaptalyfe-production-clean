import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../data/home_repository.dart';
import 'home_event.dart';
import 'home_state.dart';

class HomeBloc extends Bloc<HomeEvent, HomeState> {
  HomeBloc(this.repository) : super(const HomeInitial()) {
    on<HomeStarted>(_loadHome);
    on<RefreshHome>(_loadHome);
  }

  final HomeRepository repository;

  Future<void> _loadHome(
    HomeEvent event,
    Emitter<HomeState> emit,
  ) async {
    emit(const HomeLoading());

    try {
      final user = await repository.getCurrentUser();
      emit(HomeLoaded(user));
    } catch (error) {
      emit(HomeError(_messageFor(error)));
    }
  }

  String _messageFor(Object error) {
    if (error is ApiException) {
      return error.message;
    }
    if (error is FormatException) {
      return error.message;
    }
    return 'Unable to load your dashboard. Please try again.';
  }
}