import '../../../core/network/api_client.dart';
import '../models/skill_models.dart';

class SkillsApi {
  const SkillsApi(this.client);

  final ApiClient client;

  Future<List<TransitionSkillModel>> getSkills() async {
    final response = await client.get<dynamic>('/api/transition-skills');
    final rawItems = switch (response.data) {
      null => const <dynamic>[],
      List<dynamic> items => items,
      Map<dynamic, dynamic> payload => payload['skills'] is List
          ? payload['skills'] as List<dynamic>
          : payload['transitionSkills'] is List
              ? payload['transitionSkills'] as List<dynamic>
              : payload['data'] is List
                  ? payload['data'] as List<dynamic>
                  : const <dynamic>[],
      _ => throw const FormatException('Invalid transition skills response'),
    };

    return rawItems
        .whereType<Map>()
        .map((item) => TransitionSkillModel.fromJson(
              Map<String, dynamic>.from(item),
            ))
        .toList();
  }

  Future<TransitionSkillModel> createSkill(TransitionSkillInput input) =>
      _post('/api/transition-skills', input.toJson());

  Future<TransitionSkillModel> updateSkill(
    int id,
    Map<String, dynamic> updates,
  ) =>
      _patch('/api/transition-skills/$id', updates);

  Future<void> deleteSkill(int id) async {
    await client.delete<dynamic>('/api/transition-skills/$id');
  }

  Future<TransitionSkillModel> _post(
    String path,
    Map<String, dynamic> data,
  ) async {
    final response = await client.post<dynamic>(path, data: data);
    return _parseItem(response.data);
  }

  Future<TransitionSkillModel> _patch(
    String path,
    Map<String, dynamic> data,
  ) async {
    final response = await client.patch<dynamic>(path, data: data);
    return _parseItem(response.data);
  }

  TransitionSkillModel _parseItem(Object? data) {
    if (data is Map && data['skill'] is Map) {
      data = data['skill'];
    }
    if (data is! Map) {
      throw const FormatException('Invalid transition skill response');
    }
    return TransitionSkillModel.fromJson(Map<String, dynamic>.from(data));
  }
}