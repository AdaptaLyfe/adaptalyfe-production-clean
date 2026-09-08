import '../../../core/network/api_client.dart';
import '../models/mood_entry_model.dart';

class MoodApi {
  const MoodApi(this.client);

  final ApiClient client;

  Future<List<MoodEntryModel>> getMoodEntries() async {
    final response = await client.get<dynamic>('/api/mood-entries');
    final data = response.data;
    if (data is! List) {
      throw const FormatException('Invalid mood entries response');
    }

    return data
        .whereType<Map>()
        .map(
          (entry) => MoodEntryModel.fromJson(
            Map<String, dynamic>.from(entry),
          ),
        )
        .toList();
  }

  Future<MoodEntryModel?> getTodayMood() async {
    final response = await client.get<dynamic>('/api/mood-entries/today');
    if (response.data == null) return null;
    if (response.data is! Map) {
      throw const FormatException('Invalid today mood response');
    }

    return MoodEntryModel.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<MoodEntryModel> createMoodEntry(MoodEntryInput input) async {
    final response = await client.post<dynamic>(
      '/api/mood-entries',
      data: input.toJson(),
    );
    if (response.data is! Map) {
      throw const FormatException('Invalid created mood response');
    }

    return MoodEntryModel.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }
}