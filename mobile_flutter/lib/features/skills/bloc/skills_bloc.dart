import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../data/skills_repository.dart';
import '../models/skill_models.dart';
import 'skills_event.dart';
import 'skills_state.dart';

class SkillsBloc extends Bloc<SkillsEvent, SkillsState> {
  SkillsBloc(this.repository) : super(const SkillsState()) {
    on<SkillsStarted>(_load);
    on<RefreshSkills>(_load);
    on<CreateSkill>(_create);
    on<UpdateSkill>(_update);
    on<UpdateSkillProgress>(_updateProgress);
    on<DeleteSkill>(_delete);
  }

  final SkillsRepository repository;

  Future<void> _load(
    SkillsEvent event,
    Emitter<SkillsState> emit,
  ) async {
    emit(
      state.copyWith(
        status: SkillsStatus.loading,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );
    try {
      final skills = await repository.getSkills();
      emit(
        state.copyWith(
          status: SkillsStatus.loaded,
          skills: skills,
          busyKey: null,
          errorMessage: null,
          actionMessage: null,
        ),
      );
    } catch (error) {
      _emitFailure(emit, error, fallback: 'Unable to load your skills.');
    }
  }

  Future<void> _create(
    CreateSkill event,
    Emitter<SkillsState> emit,
  ) async {
    final validationError = event.input.validationError;
    if (validationError != null) {
      emit(state.copyWith(errorMessage: validationError, actionMessage: null));
      return;
    }
    emit(state.copyWith(busyKey: 'create', errorMessage: null));
    try {
      final skill = await repository.createSkill(event.input);
      emit(
        state.copyWith(
          status: SkillsStatus.loaded,
          skills: [...state.skills, skill],
          busyKey: null,
          actionMessage: 'New skill milestone added!',
          errorMessage: null,
        ),
      );
    } catch (error) {
      _emitFailure(emit, error, fallback: 'Unable to add this skill.');
    }
  }

  Future<void> _update(
    UpdateSkill event,
    Emitter<SkillsState> emit,
  ) async {
    final validationError = event.input.validationError;
    if (validationError != null) {
      emit(state.copyWith(errorMessage: validationError, actionMessage: null));
      return;
    }
    emit(
      state.copyWith(
        busyKey: 'skill-${event.skillId}',
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      final updated = await repository.updateSkill(
        event.skillId,
        event.input.toJson(),
      );
      emit(
        state.copyWith(
          status: SkillsStatus.loaded,
          skills: state.skills
              .map((skill) => skill.id == updated.id ? updated : skill)
              .toList(),
          busyKey: null,
          actionMessage: 'Skill updated successfully!',
          errorMessage: null,
        ),
      );
    } catch (error) {
      _emitFailure(emit, error, fallback: 'Unable to update this skill.');
    }
  }

  Future<void> _updateProgress(
    UpdateSkillProgress event,
    Emitter<SkillsState> emit,
  ) async {
    TransitionSkillModel? skill;
    for (final item in state.skills) {
      if (item.id == event.skillId) {
        skill = item;
        break;
      }
    }
    if (skill == null) return;
    if (event.currentLevel < 1 || event.currentLevel > skill.targetLevel) {
      emit(state.copyWith(errorMessage: skillLevelRangeError));
      return;
    }

    final previous = state.skills;
    emit(
      state.copyWith(
        skills: previous
            .map(
              (item) => item.id == event.skillId
                  ? item.copyWith(currentLevel: event.currentLevel)
                  : item,
            )
            .toList(),
        busyKey: 'skill-${event.skillId}',
        errorMessage: null,
      ),
    );
    try {
      final updated = await repository.updateSkill(
        event.skillId,
        {'currentLevel': event.currentLevel},
      );
      emit(
        state.copyWith(
          skills: state.skills
              .map((item) => item.id == updated.id ? updated : item)
              .toList(),
          busyKey: null,
          actionMessage: 'Great job on improving your skills!',
          errorMessage: null,
        ),
      );
    } catch (error) {
      emit(state.copyWith(skills: previous));
      _emitFailure(emit, error, fallback: 'Unable to update skill progress.');
    }
  }

  Future<void> _delete(
    DeleteSkill event,
    Emitter<SkillsState> emit,
  ) async {
    emit(
      state.copyWith(
        busyKey: 'skill-${event.skillId}',
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.deleteSkill(event.skillId);
      emit(
        state.copyWith(
          status: SkillsStatus.loaded,
          skills: state.skills
              .where((skill) => skill.id != event.skillId)
              .toList(),
          busyKey: null,
          actionMessage: 'Skill deleted successfully!',
          errorMessage: null,
        ),
      );
    } catch (error) {
      _emitFailure(emit, error, fallback: 'Unable to delete this skill.');
    }
  }

  void _emitFailure(
    Emitter<SkillsState> emit,
    Object error, {
    required String fallback,
  }) {
    final unauthorized =
        error is ApiException && error.type == ApiErrorType.unauthorized;
    emit(
      state.copyWith(
        status: state.skills.isEmpty ? SkillsStatus.failure : SkillsStatus.loaded,
        busyKey: null,
        errorMessage: error is ApiException ? error.message : fallback,
        actionMessage: null,
        sessionInvalid: unauthorized,
      ),
    );
  }
}