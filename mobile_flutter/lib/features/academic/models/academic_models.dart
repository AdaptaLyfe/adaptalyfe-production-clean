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
      estimatedHours: _asNullableDouble(json['estimatedHours']),
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
  final double? estimatedHours;
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
    this.classId,
  });

  final int? classId;
  final String title;
  final String description;
  final String type;
  final DateTime dueDate;
  final String priority;
  final double estimatedHours;

  Map<String, dynamic> toJson() => {
        'classId': classId,
        'title': title.trim(),
        'description': description.trim(),
        'type': type,
        'dueDate': dueDate.toUtc().toIso8601String(),
        'priority': priority,
        'estimatedHours': _validatedEstimatedHours(estimatedHours),
      };

  @override
  List<Object?> get props => [
        classId,
        title,
        description,
        type,
        dueDate,
        priority,
        estimatedHours,
      ];
}

class StudySessionModel extends Equatable {
  const StudySessionModel({
    required this.id,
    required this.userId,
    required this.classId,
    required this.subject,
    required this.duration,
    required this.technique,
    required this.location,
    required this.effectiveness,
    required this.notes,
    required this.startedAt,
    required this.completedAt,
  });

  factory StudySessionModel.fromJson(Map<String, dynamic> json) {
    return StudySessionModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      classId: _asNullableInt(json['classId']),
      subject: _asString(json['subject']),
      duration: _asInt(json['duration']),
      technique: _asNullableString(json['technique']),
      location: _asNullableString(json['location']),
      effectiveness: _asNullableInt(json['effectiveness']),
      notes: _asNullableString(json['notes']),
      startedAt: _asDateTime(json['startedAt']),
      completedAt: _asDateTime(json['completedAt']),
    );
  }

  final int id;
  final int userId;
  final int? classId;
  final String subject;
  final int duration;
  final String? technique;
  final String? location;
  final int? effectiveness;
  final String? notes;
  final DateTime? startedAt;
  final DateTime? completedAt;

  bool get isCompleted => completedAt != null;

  @override
  List<Object?> get props => [
        id,
        userId,
        classId,
        subject,
        duration,
        technique,
        location,
        effectiveness,
        notes,
        startedAt,
        completedAt,
      ];
}

class StudySessionInput extends Equatable {
  const StudySessionInput({
    required this.subject,
    required this.duration,
    this.classId,
    this.topic,
    this.technique,
    this.location,
    this.notes,
  });

  final int? classId;
  final String subject;
  final int duration;
  final String? topic;
  final String? technique;
  final String? location;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'classId': classId,
        'subject': subject.trim(),
        'duration': duration,
        // The web form collects topic, while the existing API schema does
        // not have a topic column. Keep it in notes without changing the API.
        'technique': _nullableText(technique),
        'location': _nullableText(location),
        'notes': _joinNotes(topic, notes),
        'startedAt': DateTime.now().toUtc().toIso8601String(),
        'completedAt': null,
        'effectiveness': null,
      };

  @override
  List<Object?> get props => [
        classId,
        subject,
        duration,
        topic,
        technique,
        location,
        notes,
      ];
}

class CampusLocationModel extends Equatable {
  const CampusLocationModel({
    required this.id,
    required this.userId,
    required this.name,
    required this.building,
    required this.floor,
    required this.description,
    required this.category,
    required this.createdAt,
  });

  factory CampusLocationModel.fromJson(Map<String, dynamic> json) {
    return CampusLocationModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      name: _asString(json['name']),
      building: _asNullableString(json['building']),
      floor: _asNullableString(json['floor']),
      description: _asNullableString(json['description']),
      category: _asString(json['category'], fallback: 'academic'),
      createdAt: _asDateTime(json['createdAt']),
    );
  }

  final int id;
  final int userId;
  final String name;
  final String? building;
  final String? floor;
  final String? description;
  final String category;
  final DateTime? createdAt;

  @override
  List<Object?> get props => [
        id,
        userId,
        name,
        building,
        floor,
        description,
        category,
        createdAt,
      ];
}

class CampusLocationInput extends Equatable {
  const CampusLocationInput({
    required this.name,
    required this.building,
    this.floor,
    this.description,
    this.category = 'academic',
  });

  final String name;
  final String building;
  final String? floor;
  final String? description;
  final String category;

  Map<String, dynamic> toJson() => {
        'name': name.trim(),
        'building': building.trim(),
        'floor': _nullableText(floor),
        'description': _nullableText(description),
        'category': category,
      };

  @override
  List<Object?> get props => [name, building, floor, description, category];
}

class CampusTransportModel extends Equatable {
  const CampusTransportModel({
    required this.id,
    required this.userId,
    required this.routeName,
    required this.fromStop,
    required this.toStop,
    required this.departureTime,
    required this.estimatedDuration,
    required this.createdAt,
  });

  factory CampusTransportModel.fromJson(Map<String, dynamic> json) {
    return CampusTransportModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      routeName: _asString(json['routeName']),
      fromStop: _asString(json['fromStop']),
      toStop: _asNullableString(json['toStop']),
      departureTime: _asNullableString(json['departureTime']),
      estimatedDuration: _asNullableInt(json['estimatedDuration']),
      createdAt: _asDateTime(json['createdAt']),
    );
  }

  final int id;
  final int userId;
  final String routeName;
  final String fromStop;
  final String? toStop;
  final String? departureTime;
  final int? estimatedDuration;
  final DateTime? createdAt;

  @override
  List<Object?> get props => [
        id,
        userId,
        routeName,
        fromStop,
        toStop,
        departureTime,
        estimatedDuration,
        createdAt,
      ];
}

class CampusTransportInput extends Equatable {
  const CampusTransportInput({
    required this.routeName,
    required this.fromStop,
    this.toStop,
    this.departureTime,
    this.estimatedDuration = 15,
  });

  final String routeName;
  final String fromStop;
  final String? toStop;
  final String? departureTime;
  final int estimatedDuration;

  Map<String, dynamic> toJson() => {
        'routeName': routeName.trim(),
        'fromStop': fromStop.trim(),
        'toStop': _nullableText(toStop),
        'departureTime': _nullableText(departureTime),
        'estimatedDuration': estimatedDuration,
      };

  @override
  List<Object?> get props => [
        routeName,
        fromStop,
        toStop,
        departureTime,
        estimatedDuration,
      ];
}

class StudyGroupModel extends Equatable {
  const StudyGroupModel({
    required this.id,
    required this.userId,
    required this.classId,
    required this.groupName,
    required this.meetingTime,
    required this.location,
    required this.members,
    required this.topics,
    required this.isRecurring,
    required this.recurringPattern,
    required this.notes,
    required this.createdAt,
  });

  factory StudyGroupModel.fromJson(Map<String, dynamic> json) {
    return StudyGroupModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      classId: _asNullableInt(json['classId']),
      groupName: _asString(json['groupName']),
      meetingTime: _asDateTime(json['meetingTime']),
      location: _asNullableString(json['location']),
      members: _asStringList(json['members']),
      topics: _asStringList(json['topics']),
      isRecurring: json['isRecurring'] == true,
      recurringPattern: _asNullableString(json['recurringPattern']),
      notes: _asNullableString(json['notes']),
      createdAt: _asDateTime(json['createdAt']),
    );
  }

  final int id;
  final int userId;
  final int? classId;
  final String groupName;
  final DateTime? meetingTime;
  final String? location;
  final List<String> members;
  final List<String> topics;
  final bool isRecurring;
  final String? recurringPattern;
  final String? notes;
  final DateTime? createdAt;

  @override
  List<Object?> get props => [
        id,
        userId,
        classId,
        groupName,
        meetingTime,
        location,
        members,
        topics,
        isRecurring,
        recurringPattern,
        notes,
        createdAt,
      ];
}

class StudyGroupInput extends Equatable {
  const StudyGroupInput({
    required this.groupName,
    this.classId,
    this.meetingTime,
    this.location,
    this.members = const [],
    this.topics = const [],
    this.isRecurring = false,
    this.recurringPattern,
    this.notes,
  });

  final String groupName;
  final int? classId;
  final DateTime? meetingTime;
  final String? location;
  final List<String> members;
  final List<String> topics;
  final bool isRecurring;
  final String? recurringPattern;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'groupName': groupName.trim(),
        'classId': classId,
        'meetingTime': meetingTime?.toUtc().toIso8601String(),
        'location': _nullableText(location),
        'members': members,
        'topics': topics,
        'isRecurring': isRecurring,
        'recurringPattern': _nullableText(recurringPattern),
        'notes': _nullableText(notes),
      };

  @override
  List<Object?> get props => [
        groupName,
        classId,
        meetingTime,
        location,
        members,
        topics,
        isRecurring,
        recurringPattern,
        notes,
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

double? _asNullableDouble(Object? value) {
  if (value == null) return null;
  final parsed = value is num ? value.toDouble() : double.tryParse('$value');
  return parsed?.isFinite == true ? parsed : null;
}

double _validatedEstimatedHours(double value) {
  if (!value.isFinite || value <= 0 || value > 100) {
    throw ArgumentError.value(
      value,
      'estimatedHours',
      'Estimated hours must be greater than 0 and at most 100.',
    );
  }
  return value;
}

String _asString(Object? value, {String fallback = ''}) =>
    value is String ? value : fallback;

String? _asNullableString(Object? value) {
  if (value is! String || value.trim().isEmpty) return null;
  return value;
}

List<String> _asStringList(Object? value) =>
    value is List ? value.whereType<String>().toList(growable: false) : const [];

DateTime? _asDateTime(Object? value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is! String || value.isEmpty) return null;
  return DateTime.tryParse(value);
}

bool _hasText(String? value) => value != null && value.trim().isNotEmpty;

String? _nullableText(String? value) =>
    _hasText(value) ? value!.trim() : null;

String? _joinNotes(String? topic, String? notes) {
  final values = [
    if (_hasText(topic)) 'Topic: ${topic!.trim()}',
    if (_hasText(notes)) notes!.trim(),
  ];
  return values.isEmpty ? null : values.join('\n');
}