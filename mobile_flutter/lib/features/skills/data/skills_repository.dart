import '../models/skill_models.dart';
import 'skills_api.dart';

class SkillsRepository {
  const SkillsRepository(this.api);

  final SkillsApi api;

  Future<List<TransitionSkillModel>> getSkills() => api.getSkills();

  Future<TransitionSkillModel> createSkill(TransitionSkillInput input) =>
      api.createSkill(input);

  Future<TransitionSkillModel> updateSkill(
    int id,
    Map<String, dynamic> updates,
  ) =>
      api.updateSkill(id, updates);

  Future<void> deleteSkill(int id) => api.deleteSkill(id);
}