import 'package:equatable/equatable.dart';

class AppointmentModel extends Equatable {
  const AppointmentModel({
    required this.id,
    required this.title,
    required this.description,
    required this.appointmentDate,
    required this.location,
    required this.provider,
    required this.isCompleted,
    required this.reminderSet,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      id: _asInt(json['id']),
      title: _asString(json['title']),
      description: _asNullableString(json['description']),
      appointmentDate: _asDate(json['appointmentDate']) ??
          DateTime.fromMillisecondsSinceEpoch(0),
      location: _asNullableString(json['location']),
      provider: _asNullableString(json['provider']),
      isCompleted: json['isCompleted'] == true,
      reminderSet: json['reminderSet'] == true,
    );
  }

  final int id;
  final String title;
  final String? description;
  final DateTime appointmentDate;
  final String? location;
  final String? provider;
  final bool isCompleted;
  final bool reminderSet;

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        appointmentDate,
        location,
        provider,
        isCompleted,
        reminderSet,
      ];
}

class AppointmentInput extends Equatable {
  const AppointmentInput({
    required this.title,
    required this.appointmentDate,
    this.description,
    this.location,
    this.provider,
    this.isCompleted = false,
    this.reminderSet = false,
  });

  final String title;
  final DateTime appointmentDate;
  final String? description;
  final String? location;
  final String? provider;
  final bool isCompleted;
  final bool reminderSet;

  Map<String, dynamic> toJson() => {
        'title': title.trim(),
        'appointmentDate': appointmentDate.toIso8601String(),
        if (_hasText(description)) 'description': description!.trim(),
        if (_hasText(location)) 'location': location!.trim(),
        if (_hasText(provider)) 'provider': provider!.trim(),
        'isCompleted': isCompleted,
        'reminderSet': reminderSet,
      };

  @override
  List<Object?> get props => [
        title,
        appointmentDate,
        description,
        location,
        provider,
        isCompleted,
        reminderSet,
      ];
}

class CalendarEventModel extends Equatable {
  const CalendarEventModel({
    required this.id,
    required this.title,
    required this.description,
    required this.startDate,
    required this.endDate,
    required this.allDay,
    required this.category,
    required this.color,
    required this.location,
    required this.isCompleted,
    required this.reminderMinutes,
  });

  factory CalendarEventModel.fromJson(Map<String, dynamic> json) {
    return CalendarEventModel(
      id: _asInt(json['id']),
      title: _asString(json['title']),
      description: _asNullableString(json['description']),
      startDate: _asDate(json['startDate']) ??
          DateTime.fromMillisecondsSinceEpoch(0),
      endDate: _asDate(json['endDate']),
      allDay: json['allDay'] == true,
      category: _asString(json['category'], fallback: 'personal'),
      color: _asString(json['color'], fallback: '#3b82f6'),
      location: _asNullableString(json['location']),
      isCompleted: json['isCompleted'] == true,
      reminderMinutes: _asNullableInt(json['reminderMinutes']),
    );
  }

  final int id;
  final String title;
  final String? description;
  final DateTime startDate;
  final DateTime? endDate;
  final bool allDay;
  final String category;
  final String color;
  final String? location;
  final bool isCompleted;
  final int? reminderMinutes;

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        startDate,
        endDate,
        allDay,
        category,
        color,
        location,
        isCompleted,
        reminderMinutes,
      ];
}

class CalendarEventInput extends Equatable {
  const CalendarEventInput({
    required this.title,
    required this.startDate,
    required this.allDay,
    required this.category,
    this.description,
    this.endDate,
    this.color = '#3b82f6',
    this.location,
    this.reminderMinutes = 15,
  });

  final String title;
  final String? description;
  final DateTime startDate;
  final DateTime? endDate;
  final bool allDay;
  final String category;
  final String color;
  final String? location;
  final int? reminderMinutes;

  Map<String, dynamic> toJson() => {
        'title': title.trim(),
        if (_hasText(description)) 'description': description!.trim(),
        'startDate': startDate.toIso8601String(),
        if (endDate != null) 'endDate': endDate!.toIso8601String(),
        'allDay': allDay,
        'category': category,
        'color': color,
        if (_hasText(location)) 'location': location!.trim(),
        if (reminderMinutes != null) 'reminderMinutes': reminderMinutes,
      };

  @override
  List<Object?> get props => [
        title,
        description,
        startDate,
        endDate,
        allDay,
        category,
        color,
        location,
        reminderMinutes,
      ];
}

DateTime? _asDate(Object? value) {
  if (value is DateTime) return value.toLocal();
  if (value is String && value.trim().isNotEmpty) {
    return DateTime.tryParse(value)?.toLocal();
  }
  return null;
}

int _asInt(Object? value) {
  if (value is int) return value;
  return int.tryParse('$value') ?? 0;
}

int? _asNullableInt(Object? value) {
  if (value == null) return null;
  if (value is int) return value;
  return int.tryParse('$value');
}

String _asString(Object? value, {String fallback = ''}) {
  if (value is String && value.trim().isNotEmpty) return value;
  return fallback;
}

String? _asNullableString(Object? value) {
  if (value is String && value.trim().isNotEmpty) return value;
  return null;
}

bool _hasText(String? value) => value != null && value.trim().isNotEmpty;