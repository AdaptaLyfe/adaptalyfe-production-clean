import 'package:equatable/equatable.dart';

const skillLevelRangeError =
    'Current level cannot be greater than target level.';

class TransitionSkillInput extends Equatable {
  const TransitionSkillInput({
    required this.skillCategory,
    required this.skillName,
    this.description,
    this.currentLevel = 1,
    this.targetLevel = 5,
    this.priority = 'medium',
    this.practiceActivities = const [],
  });

  final String skillCategory;
  final String skillName;
  final String? description;
  final int currentLevel;
  final int targetLevel;
  final String priority;
  final List<String> practiceActivities;

  String? get validationError {
    if (skillName.trim().isEmpty) return 'Skill name is required.';
    if (currentLevel < 1 || currentLevel > 10) {
      return 'Current level must be between 1 and 10.';
    }
    if (targetLevel < 1 || targetLevel > 10) {
      return 'Target level must be between 1 and 10.';
    }
    if (currentLevel > targetLevel) return skillLevelRangeError;
    return null;
  }

  Map<String, dynamic> toJson() => {
        'skillCategory': skillCategory,
        'skillName': skillName.trim(),
        'description': _nullableText(description),
        'currentLevel': currentLevel,
        'targetLevel': targetLevel,
        'priority': priority,
        if (practiceActivities.isNotEmpty)
          'practiceActivities': practiceActivities,
      };

  @override
  List<Object?> get props => [
        skillCategory,
        skillName,
        description,
        currentLevel,
        targetLevel,
        priority,
        practiceActivities,
      ];
}

class TransitionSkillModel extends Equatable {
  const TransitionSkillModel({
    required this.id,
    required this.userId,
    required this.skillCategory,
    required this.skillName,
    required this.description,
    required this.currentLevel,
    required this.targetLevel,
    required this.priority,
    required this.practiceActivities,
    required this.milestones,
    required this.lastPracticed,
    required this.createdAt,
    required this.updatedAt,
  });

  factory TransitionSkillModel.fromJson(Map<String, dynamic> json) {
    return TransitionSkillModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      skillCategory: _asString(
        json['skillCategory'],
        fallback: 'independent_living',
      ),
      skillName: _asString(json['skillName']),
      description: _asNullableString(json['description']),
      currentLevel: _asInt(json['currentLevel'], fallback: 1),
      targetLevel: _asInt(json['targetLevel'], fallback: 5),
      priority: _asString(json['priority'], fallback: 'medium'),
      practiceActivities: _asStringList(json['practiceActivities']),
      milestones: _asDynamicList(json['milestones']),
      lastPracticed: _asDate(json['lastPracticed']),
      createdAt: _asDate(json['createdAt']),
      updatedAt: _asDate(json['updatedAt']),
    );
  }

  final int id;
  final int userId;
  final String skillCategory;
  final String skillName;
  final String? description;
  final int currentLevel;
  final int targetLevel;
  final String priority;
  final List<String> practiceActivities;
  final List<Object?> milestones;
  final DateTime? lastPracticed;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  int get progressPercentage {
    if (targetLevel <= 0) return 0;
    final percentage = (currentLevel / targetLevel * 100).round();
    return percentage.clamp(0, 100).toInt();
  }

  bool get isCompleted => currentLevel >= targetLevel;
  bool get isInProgress => !isCompleted;

  TransitionSkillModel copyWith({
    int? currentLevel,
    int? targetLevel,
    String? skillCategory,
    String? skillName,
    String? description,
    String? priority,
    List<String>? practiceActivities,
  }) {
    return TransitionSkillModel(
      id: id,
      userId: userId,
      skillCategory: skillCategory ?? this.skillCategory,
      skillName: skillName ?? this.skillName,
      description: description ?? this.description,
      currentLevel: currentLevel ?? this.currentLevel,
      targetLevel: targetLevel ?? this.targetLevel,
      priority: priority ?? this.priority,
      practiceActivities: practiceActivities ?? this.practiceActivities,
      milestones: milestones,
      lastPracticed: lastPracticed,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        skillCategory,
        skillName,
        description,
        currentLevel,
        targetLevel,
        priority,
        practiceActivities,
        milestones,
        lastPracticed,
        createdAt,
        updatedAt,
      ];
}

int _asInt(Object? value, {int fallback = 0}) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse('$value') ?? fallback;
}

String _asString(Object? value, {String fallback = ''}) =>
    value is String && value.trim().isNotEmpty ? value : fallback;

String? _asNullableString(Object? value) =>
    value is String && value.trim().isNotEmpty ? value : null;

List<String> _asStringList(Object? value) {
  if (value is! List) return const [];
  return value.whereType<String>().toList(growable: false);
}

List<Object?> _asDynamicList(Object? value) {
  if (value is! List) return const [];
  return value.cast<Object?>().toList(growable: false);
}

DateTime? _asDate(Object? value) {
  if (value is DateTime) return value.toLocal();
  if (value is String && value.trim().isNotEmpty) {
    return DateTime.tryParse(value)?.toLocal();
  }
  return null;
}

String? _nullableText(String? value) =>
    value == null || value.trim().isEmpty ? null : value.trim();