import 'package:equatable/equatable.dart';

import '../models/skill_models.dart';

enum SkillsStatus {
  initial,
  loading,
  loaded,
  failure,
}

class SkillsState extends Equatable {
  const SkillsState({
    this.status = SkillsStatus.initial,
    this.skills = const [],
    this.busyKey,
    this.errorMessage,
    this.actionMessage,
    this.sessionInvalid = false,
  });

  final SkillsStatus status;
  final List<TransitionSkillModel> skills;
  final String? busyKey;
  final String? errorMessage;
  final String? actionMessage;
  final bool sessionInvalid;

  bool get isLoading => status == SkillsStatus.loading;
  bool get hasSkills => skills.isNotEmpty;
  int get completedCount => skills.where((skill) => skill.isCompleted).length;
  int get inProgressCount => skills.where((skill) => skill.isInProgress).length;
  int get averageProgress => skills.isEmpty
      ? 0
      : (skills.fold<int>(
                0,
                (total, skill) => total + skill.progressPercentage,
              ) /
              skills.length)
          .round();

  SkillsState copyWith({
    SkillsStatus? status,
    List<TransitionSkillModel>? skills,
    Object? busyKey = _notSet,
    Object? errorMessage = _notSet,
    Object? actionMessage = _notSet,
    bool? sessionInvalid,
  }) {
    return SkillsState(
      status: status ?? this.status,
      skills: skills ?? this.skills,
      busyKey: identical(busyKey, _notSet) ? this.busyKey : busyKey as String?,
      errorMessage: identical(errorMessage, _notSet)
          ? this.errorMessage
          : errorMessage as String?,
      actionMessage: identical(actionMessage, _notSet)
          ? this.actionMessage
          : actionMessage as String?,
      sessionInvalid: sessionInvalid ?? this.sessionInvalid,
    );
  }

  @override
  List<Object?> get props => [
        status,
        skills,
        busyKey,
        errorMessage,
        actionMessage,
        sessionInvalid,
      ];
}

const _notSet = Object();