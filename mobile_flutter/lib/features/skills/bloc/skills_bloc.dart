import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../data/skills_repository.dart';
import '../models/skill_models.dart';
import 'skills_event.dart';
import 'skills_state.dart';

EventTransformer<T> _sequential<T>() {
  return (events, mapper) => events.asyncExpand(mapper);
}

void _logLifeSkills(String message) {
  if (kDebugMode) {
    debugPrint('[LifeSkills][BLoC] $message');
  }
}

class SkillsBloc extends Bloc<SkillsEvent, SkillsState> {
  SkillsBloc(this.repository) : super(const SkillsState()) {
    // All skill operations share one queue. Bloc otherwise processes
    // different event types concurrently, allowing a refresh to overwrite a
    // just-completed create/update/delete with an older response.
    on<SkillsEvent>(_handleEvent, transformer: _sequential());
  }

  final SkillsRepository repository;

  Future<void> _handleEvent(
    SkillsEvent event,
    Emitter<SkillsState> emit,
  ) {
    if (event is SkillsStarted || event is RefreshSkills) {
      return _load(event, emit);
    }
    if (event is CreateSkill) return _create(event, emit);
    if (event is UpdateSkill) return _update(event, emit);
    if (event is UpdateSkillProgress) return _updateProgress(event, emit);
    if (event is DeleteSkill) return _delete(event, emit);
    throw StateError('Unsupported Life Skills event: ${event.runtimeType}');
  }

  Future<void> _load(
    SkillsEvent event,
    Emitter<SkillsState> emit,
  ) async {
    _logLifeSkills('user action/event=${event.runtimeType} read start');
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
      _logLifeSkills('read success count=${skills.length}; state update');
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
      _logLifeSkills('read failure error=$error');
      _emitFailure(emit, error, fallback: 'Unable to load your skills.');
    }
  }

  Future<void> _create(
    CreateSkill event,
    Emitter<SkillsState> emit,
  ) async {
    _logLifeSkills(
      'user action create request payload=${event.input.toJson()}',
    );
    final validationError = event.input.validationError;
    if (validationError != null) {
      emit(state.copyWith(errorMessage: validationError, actionMessage: null));
      return;
    }
    emit(state.copyWith(busyKey: 'create', errorMessage: null));
    try {
      final createdSkill = await repository.createSkill(event.input);
      _logLifeSkills(
        'create response id=${createdSkill.id}; state update and UI success',
      );
      final skills = [
        createdSkill,
        ...state.skills.where((skill) => skill.id != createdSkill.id),
      ];
      emit(
        state.copyWith(
          status: SkillsStatus.loaded,
          skills: skills,
          busyKey: null,
          actionMessage: 'New skill milestone added!',
          errorMessage: null,
        ),
      );
    } catch (error) {
      _logLifeSkills('create failure error=$error; loading cleared');
      _emitFailure(emit, error, fallback: 'Unable to add this skill.');
    }
  }

  Future<void> _update(
    UpdateSkill event,
    Emitter<SkillsState> emit,
  ) async {
    _logLifeSkills(
      'user action edit request id=${event.skillId} '
      'payload=${event.input.toJson()}',
    );
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
      _logLifeSkills(
        'edit response id=${updated.id}; state update and UI success',
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
      _logLifeSkills('edit failure id=${event.skillId} error=$error');
      _emitFailure(emit, error, fallback: 'Unable to update this skill.');
    }
  }

  Future<void> _updateProgress(
    UpdateSkillProgress event,
    Emitter<SkillsState> emit,
  ) async {
    _logLifeSkills(
      'user action progress request id=${event.skillId} '
      'payload={currentLevel: ${event.currentLevel}}',
    );
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
      _logLifeSkills(
        'progress response id=${updated.id}; state update and UI success',
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
      _logLifeSkills('progress failure id=${event.skillId} error=$error');
      emit(state.copyWith(skills: previous));
      _emitFailure(emit, error, fallback: 'Unable to update skill progress.');
    }
  }

  Future<void> _delete(
    DeleteSkill event,
    Emitter<SkillsState> emit,
  ) async {
    _logLifeSkills('user action delete request id=${event.skillId}');
    emit(
      state.copyWith(
        busyKey: 'skill-${event.skillId}',
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.deleteSkill(event.skillId);
      _logLifeSkills(
        'delete response id=${event.skillId}; state update and UI success',
      );
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
      _logLifeSkills('delete failure id=${event.skillId} error=$error');
      _emitFailure(emit, error, fallback: 'Unable to delete this skill.');
    }
  }

  void _emitFailure(
    Emitter<SkillsState> emit,
    Object error, {
    required String fallback,
  }) {
    _logLifeSkills(
      'operation failure type=${error.runtimeType} '
      'message=${error is ApiException ? error.message : error}',
    );
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