import 'package:equatable/equatable.dart';

class DailyTaskInput extends Equatable {
  const DailyTaskInput({
    required this.title,
    required this.description,
    required this.category,
    required this.frequency,
    required this.estimatedMinutes,
    required this.pointValue,
    required this.scheduledTime,
  });

  final String title;
  final String description;
  final String category;
  final String frequency;
  final int estimatedMinutes;
  final int pointValue;
  final String? scheduledTime;

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'category': category,
      'frequency': frequency,
      'estimatedMinutes': estimatedMinutes,
      'pointValue': pointValue,
      'scheduledTime': scheduledTime ?? '',
    };
  }

  @override
  List<Object?> get props => [
        title,
        description,
        category,
        frequency,
        estimatedMinutes,
        pointValue,
        scheduledTime,
      ];
}

class DailyTaskModel extends Equatable {
  const DailyTaskModel({
    required this.id,
    required this.userId,
    required this.title,
    required this.description,
    required this.category,
    required this.frequency,
    required this.estimatedMinutes,
    required this.pointValue,
    required this.scheduledTime,
    required this.isCompleted,
    required this.completedAt,
    required this.dueDate,
    required this.lastCompleted,
  });

  factory DailyTaskModel.fromJson(Map<String, dynamic> json) {
    return DailyTaskModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      title: _asString(json['title']),
      description: _asString(json['description']),
      category: _asString(json['category']),
      frequency: _asString(json['frequency'], fallback: 'daily'),
      estimatedMinutes: _asInt(json['estimatedMinutes']),
      pointValue: _asInt(json['pointValue']),
      scheduledTime: _nullableString(json['scheduledTime']),
      isCompleted: json['isCompleted'] == true,
      completedAt: _asDateTime(json['completedAt']),
      dueDate: _asDateTime(json['dueDate']),
      lastCompleted: _asDateTime(json['lastCompleted']),
    );
  }

  final int id;
  final int userId;
  final String title;
  final String description;
  final String category;
  final String frequency;
  final int estimatedMinutes;
  final int pointValue;
  final String? scheduledTime;
  final bool isCompleted;
  final DateTime? completedAt;
  final DateTime? dueDate;
  final DateTime? lastCompleted;

  @override
  List<Object?> get props => [
        id,
        userId,
        title,
        description,
        category,
        frequency,
        estimatedMinutes,
        pointValue,
        scheduledTime,
        isCompleted,
        completedAt,
        dueDate,
        lastCompleted,
      ];

  static int _asInt(Object? value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse('$value') ?? 0;
  }

  static String _asString(Object? value, {String fallback = ''}) {
    return value is String ? value : fallback;
  }

  static String? _nullableString(Object? value) {
    if (value is! String || value.isEmpty) return null;
    return value;
  }

  static DateTime? _asDateTime(Object? value) {
    if (value is! String || value.isEmpty) return null;
    return DateTime.tryParse(value);
  }
}