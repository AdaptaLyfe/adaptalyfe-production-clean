import 'package:equatable/equatable.dart';

import '../models/mood_entry_model.dart';

enum MoodStatus {
  initial,
  loading,
  loaded,
  failure,
}

class MoodState extends Equatable {
  const MoodState({
    this.status = MoodStatus.initial,
    this.entries = const [],
    this.todayMood,
    this.isSubmitting = false,
    this.errorMessage,
    this.actionMessage,
    this.alreadyLoggedToday = false,
    this.sessionInvalid = false,
  });

  final MoodStatus status;
  final List<MoodEntryModel> entries;
  final MoodEntryModel? todayMood;
  final bool isSubmitting;
  final String? errorMessage;
  final String? actionMessage;
  final bool alreadyLoggedToday;
  final bool sessionInvalid;

  bool get isLoading => status == MoodStatus.loading;
  bool get hasData => entries.isNotEmpty || todayMood != null;
  bool get isMoodRequired =>
      status == MoodStatus.loaded && todayMood == null;

  double get averageMood {
    if (entries.isEmpty) return 0;
    return entries.fold<int>(0, (sum, entry) => sum + entry.mood) /
        entries.length;
  }

  MoodState copyWith({
    MoodStatus? status,
    List<MoodEntryModel>? entries,
    Object? todayMood = _notSet,
    bool? isSubmitting,
    Object? errorMessage = _notSet,
    Object? actionMessage = _notSet,
    bool? alreadyLoggedToday,
    bool? sessionInvalid,
  }) {
    return MoodState(
      status: status ?? this.status,
      entries: entries ?? this.entries,
      todayMood: identical(todayMood, _notSet)
          ? this.todayMood
          : todayMood as MoodEntryModel?,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: identical(errorMessage, _notSet)
          ? this.errorMessage
          : errorMessage as String?,
      actionMessage: identical(actionMessage, _notSet)
          ? this.actionMessage
          : actionMessage as String?,
      alreadyLoggedToday:
          alreadyLoggedToday ?? this.alreadyLoggedToday,
      sessionInvalid: sessionInvalid ?? this.sessionInvalid,
    );
  }

  @override
  List<Object?> get props => [
        status,
        entries,
        todayMood,
        isSubmitting,
        errorMessage,
        actionMessage,
        alreadyLoggedToday,
        sessionInvalid,
      ];
}

const _notSet = Object();