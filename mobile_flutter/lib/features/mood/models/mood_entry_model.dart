import 'package:equatable/equatable.dart';

class MoodEntryModel extends Equatable {
  const MoodEntryModel({
    required this.id,
    required this.userId,
    required this.mood,
    required this.notes,
    required this.entryDate,
  });

  factory MoodEntryModel.fromJson(Map<String, dynamic> json) {
    return MoodEntryModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      mood: _asInt(json['mood']),
      notes: _asNullableString(json['notes']),
      entryDate: _asDateTime(json['entryDate']),
    );
  }

  final int id;
  final int userId;
  final int mood;
  final String? notes;
  final DateTime? entryDate;

  @override
  List<Object?> get props => [id, userId, mood, notes, entryDate];
}

class MoodEntryInput extends Equatable {
  const MoodEntryInput({
    required this.mood,
    this.notes,
  });

  final int mood;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'mood': mood,
        if (notes != null && notes!.trim().isNotEmpty) 'notes': notes!.trim(),
      };

  @override
  List<Object?> get props => [mood, notes];
}

int _asInt(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse('$value') ?? 0;
}

String? _asNullableString(Object? value) {
  if (value is! String || value.trim().isEmpty) return null;
  return value;
}

DateTime? _asDateTime(Object? value) {
  if (value is! String || value.isEmpty) return null;
  return DateTime.tryParse(value);
}