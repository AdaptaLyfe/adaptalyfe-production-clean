import 'package:equatable/equatable.dart';

class AcademicClassModel extends Equatable {
  const AcademicClassModel({
    required this.id,
    required this.userId,
    required this.className,
    required this.instructor,
    required this.room,
    required this.building,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    required this.semester,
    required this.credits,
    required this.isActive,
    required this.notes,
  });

  factory AcademicClassModel.fromJson(Map<String, dynamic> json) {
    return AcademicClassModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      className: _asString(json['className']),
      instructor: _asNullableString(json['instructor']),
      room: _asNullableString(json['room']),
      building: _asNullableString(json['building']),
      dayOfWeek: _asInt(json['dayOfWeek']),
      startTime: _asString(json['startTime']),
      endTime: _asString(json['endTime']),
      semester: _asString(json['semester']),
      credits: _asNullableInt(json['credits']),
      isActive: json['isActive'] != false,
      notes: _asNullableString(json['notes']),
    );
  }

  final int id;
  final int userId;
  final String className;
  final String? instructor;
  final String? room;
  final String? building;
  final int dayOfWeek;
  final String startTime;
  final String endTime;
  final String semester;
  final int? credits;
  final bool isActive;
  final String? notes;

  @override
  List<Object?> get props => [
        id,
        userId,
        className,
        instructor,
        room,
        building,
        dayOfWeek,
        startTime,
        endTime,
        semester,
        credits,
        isActive,
        notes,
      ];
}

class AcademicClassInput extends Equatable {
  const AcademicClassInput({
    required this.className,
    required this.instructor,
    required this.building,
    required this.room,
    required this.startTime,
    required this.endTime,
    required this.dayOfWeek,
    required this.credits,
    required this.semester,
    this.isActive = true,
    this.notes,
  });

  final String className;
  final String instructor;
  final String building;
  final String room;
  final String startTime;
  final String endTime;
  final int dayOfWeek;
  final int credits;
  final String semester;
  final bool isActive;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'className': className.trim(),
        'instructor': instructor.trim(),
        'building': building.trim(),
        'room': room.trim(),
        'startTime': startTime,
        'endTime': endTime,
        'dayOfWeek': dayOfWeek,
        'credits': credits,
        'semester': semester,
        'isActive': isActive,
        if (_hasText(notes)) 'notes': notes!.trim(),
      };

  @override
  List<Object?> get props => [
        className,
        instructor,
        building,
        room,
        startTime,
        endTime,
        dayOfWeek,
        credits,
        semester,
        isActive,
        notes,
      ];
}

class AssignmentModel extends Equatable {
  const AssignmentModel({
    required this.id,
    required this.userId,
    required this.classId,
    required this.title,
    required this.description,
    required this.type,
    required this.dueDate,
    required this.estimatedHours,
    required this.priority,
    required this.status,
    required this.grade,
    required this.submittedAt,
    required this.createdAt,
  });

  factory AssignmentModel.fromJson(Map<String, dynamic> json) {
    return AssignmentModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      classId: _asNullableInt(json['classId']),
      title: _asString(json['title']),
      description: _asNullableString(json['description']),
      type: _asString(json['type']),
      dueDate: _asDateTime(json['dueDate']) ??
          DateTime.fromMillisecondsSinceEpoch(0),
      estimatedHours: _asNullableInt(json['estimatedHours']),
      priority: _asString(json['priority'], fallback: 'medium'),
      status: _asString(json['status'], fallback: 'not_started'),
      grade: _asNullableString(json['grade']),
      submittedAt: _asDateTime(json['submittedAt']),
      createdAt: _asDateTime(json['createdAt']),
    );
  }

  final int id;
  final int userId;
  final int? classId;
  final String title;
  final String? description;
  final String type;
  final DateTime dueDate;
  final int? estimatedHours;
  final String priority;
  final String status;
  final String? grade;
  final DateTime? submittedAt;
  final DateTime? createdAt;

  bool get isCompleted => status == 'completed' || status == 'submitted';

  @override
  List<Object?> get props => [
        id,
        userId,
        classId,
        title,
        description,
        type,
        dueDate,
        estimatedHours,
        priority,
        status,
        grade,
        submittedAt,
        createdAt,
      ];
}

class AssignmentInput extends Equatable {
  const AssignmentInput({
    required this.title,
    required this.description,
    required this.type,
    required this.dueDate,
    required this.priority,
    required this.estimatedHours,
  });

  final String title;
  final String description;
  final String type;
  final DateTime dueDate;
  final String priority;
  final int estimatedHours;

  Map<String, dynamic> toJson() => {
        'title': title.trim(),
        'description': description.trim(),
        'type': type,
        'dueDate': dueDate.toUtc().toIso8601String(),
        'priority': priority,
        'estimatedHours': estimatedHours,
      };

  @override
  List<Object?> get props => [
        title,
        description,
        type,
        dueDate,
        priority,
        estimatedHours,
      ];
}

int _asInt(Object? value) =>
    value is int ? value : value is num ? value.toInt() : int.tryParse('$value') ?? 0;

int? _asNullableInt(Object? value) {
  if (value == null) return null;
  return value is int
      ? value
      : value is num
          ? value.toInt()
          : int.tryParse('$value');
}

String _asString(Object? value, {String fallback = ''}) =>
    value is String ? value : fallback;

String? _asNullableString(Object? value) {
  if (value is! String || value.trim().isEmpty) return null;
  return value;
}

DateTime? _asDateTime(Object? value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is! String || value.isEmpty) return null;
  return DateTime.tryParse(value);
}

bool _hasText(String? value) => value != null && value.trim().isNotEmpty;