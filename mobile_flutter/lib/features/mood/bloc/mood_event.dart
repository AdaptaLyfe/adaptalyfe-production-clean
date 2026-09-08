import 'package:equatable/equatable.dart';

import '../models/mood_entry_model.dart';

sealed class MoodEvent extends Equatable {
  const MoodEvent();

  @override
  List<Object?> get props => [];
}

final class MoodStarted extends MoodEvent {
  const MoodStarted();
}

final class RefreshMood extends MoodEvent {
  const RefreshMood();
}

final class AddMood extends MoodEvent {
  const AddMood(this.input);

  final MoodEntryInput input;

  @override
  List<Object?> get props => [input];
}