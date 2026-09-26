import '../models/mood_entry_model.dart';
import 'mood_api.dart';

class MoodRepository {
  const MoodRepository(this.api);

  final MoodApi api;

  Future<List<MoodEntryModel>> getMoodEntries() => api.getMoodEntries();

  Future<MoodEntryModel?> getTodayMood() => api.getTodayMood();

  Future<MoodEntryModel> createMoodEntry(MoodEntryInput input) =>
      api.createMoodEntry(input);
}