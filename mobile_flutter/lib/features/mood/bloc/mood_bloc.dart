import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../data/mood_repository.dart';
import '../models/mood_entry_model.dart';
import 'mood_event.dart';
import 'mood_state.dart';

class MoodBloc extends Bloc<MoodEvent, MoodState> {
  MoodBloc(this.repository) : super(const MoodState()) {
    on<MoodStarted>(_loadMood);
    on<RefreshMood>(_loadMood);
    on<AddMood>(_addMood);
  }

  final MoodRepository repository;

  Future<void> _loadMood(
    MoodEvent event,
    Emitter<MoodState> emit,
  ) async {
    emit(
      state.copyWith(
        status: MoodStatus.loading,
        errorMessage: null,
        actionMessage: null,
        alreadyLoggedToday: false,
        sessionInvalid: false,
      ),
    );

    try {
      final results = await Future.wait([
        repository.getMoodEntries(),
        repository.getTodayMood(),
      ]);
      emit(
        state.copyWith(
          status: MoodStatus.loaded,
          entries: results[0] as List<MoodEntryModel>,
          todayMood: results[1] as MoodEntryModel?,
          isSubmitting: false,
          errorMessage: null,
          actionMessage: null,
        ),
      );
    } on ApiException catch (error) {
      _emitFailure(emit, error);
    } catch (error) {
      _emitFailure(emit, error);
    }
  }

  Future<void> _addMood(
    AddMood event,
    Emitter<MoodState> emit,
  ) async {
    if (state.todayMood != null || state.isSubmitting) return;

    emit(
      state.copyWith(
        isSubmitting: true,
        errorMessage: null,
        actionMessage: null,
        alreadyLoggedToday: false,
      ),
    );

    try {
      await repository.createMoodEntry(event.input);
      final results = await Future.wait([
        repository.getMoodEntries(),
        repository.getTodayMood(),
      ]);
      emit(
        state.copyWith(
          status: MoodStatus.loaded,
          entries: results[0] as List<MoodEntryModel>,
          todayMood: results[1] as MoodEntryModel?,
          isSubmitting: false,
          errorMessage: null,
          actionMessage: 'Mood recorded. Thanks for checking in today!',
          alreadyLoggedToday: false,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      final isAlreadyLogged = error.statusCode == 400 &&
          error.data is Map &&
          (error.data as Map)['existing'] == true;
      if (isAlreadyLogged) {
        await _refreshAfterDuplicate(emit);
      } else {
        _emitFailure(emit, error, keepLoadedState: true);
      }
    } catch (error) {
      _emitFailure(emit, error, keepLoadedState: true);
    }
  }

  Future<void> _refreshAfterDuplicate(Emitter<MoodState> emit) async {
    try {
      final results = await Future.wait([
        repository.getMoodEntries(),
        repository.getTodayMood(),
      ]);
      emit(
        state.copyWith(
          status: MoodStatus.loaded,
          entries: results[0] as List<MoodEntryModel>,
          todayMood: results[1] as MoodEntryModel?,
          isSubmitting: false,
          errorMessage: null,
          actionMessage:
              'You have already recorded your mood for today. Check back tomorrow.',
          alreadyLoggedToday: true,
        ),
      );
    } catch (error) {
      _emitFailure(emit, error, keepLoadedState: true);
    }
  }

  void _emitFailure(
    Emitter<MoodState> emit,
    Object error, {
    bool keepLoadedState = false,
  }) {
    final message = error is ApiException
        ? error.message
        : error is FormatException
            ? error.message
            : 'Unable to load your mood entries. Please try again.';
    emit(
      state.copyWith(
        status: keepLoadedState || state.hasData
            ? MoodStatus.loaded
            : MoodStatus.failure,
        isSubmitting: false,
        errorMessage: message,
        sessionInvalid:
            error is ApiException && error.type == ApiErrorType.unauthorized,
      ),
    );
  }
}