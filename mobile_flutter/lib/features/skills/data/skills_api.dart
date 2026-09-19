import '../../../core/network/api_client.dart';
import '../models/skill_models.dart';

class SkillsApi {
  const SkillsApi(this.client);

  final ApiClient client;

  Future<List<TransitionSkillModel>> getSkills() async {
    final response = await client.get<dynamic>('/api/transition-skills');
    if (response.data == null) {
      return const [];
    }
    if (response.data is! List) {
      throw const FormatException('Invalid transition skills response');
    }
    return (response.data as List)
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