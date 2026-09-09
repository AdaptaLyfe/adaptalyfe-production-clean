import '../models/sleep_models.dart';

sealed class SleepEvent {
  const SleepEvent();
}

class SleepStarted extends SleepEvent {
  const SleepStarted();
}

class RefreshSleep extends SleepEvent {
  const RefreshSleep();
}

class SleepDateSelected extends SleepEvent {
  const SleepDateSelected(this.date);

  final DateTime date;
}

class AddSleepSession extends SleepEvent {
  const AddSleepSession(this.input);

  final SleepSessionInput input;
}

class UpdateSleepSession extends SleepEvent {
  const UpdateSleepSession({
    required this.id,
    required this.input,
  });

  final int id;
  final SleepSessionInput input;
}

class DeleteSleepSession extends SleepEvent {
  const DeleteSleepSession(this.id);

  final int id;
}