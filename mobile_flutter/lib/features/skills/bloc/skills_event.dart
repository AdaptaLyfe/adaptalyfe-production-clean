import 'package:equatable/equatable.dart';

import '../models/skill_models.dart';

sealed class SkillsEvent extends Equatable {
  const SkillsEvent();

  @override
  List<Object?> get props => [];
}

final class SkillsStarted extends SkillsEvent {
  const SkillsStarted();
}

final class RefreshSkills extends SkillsEvent {
  const RefreshSkills();
}

final class CreateSkill extends SkillsEvent {
  const CreateSkill(this.input);

  final TransitionSkillInput input;

  @override
  List<Object?> get props => [input];
}

final class UpdateSkill extends SkillsEvent {
  const UpdateSkill({
    required this.skillId,
    required this.input,
  });

  final int skillId;
  final TransitionSkillInput input;

  @override
  List<Object?> get props => [skillId, input];
}

final class UpdateSkillProgress extends SkillsEvent {
  const UpdateSkillProgress({
    required this.skillId,
    required this.currentLevel,
  });

  final int skillId;
  final int currentLevel;

  @override
  List<Object?> get props => [skillId, currentLevel];
}

final class DeleteSkill extends SkillsEvent {
  const DeleteSkill(this.skillId);

  final int skillId;

  @override
  List<Object?> get props => [skillId];
}