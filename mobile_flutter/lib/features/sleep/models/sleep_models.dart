import 'package:equatable/equatable.dart';

class SleepSessionModel extends Equatable {
  const SleepSessionModel({
    required this.id,
    required this.userId,
    required this.sleepDate,
    required this.bedtime,
    required this.sleepTime,
    required this.wakeTime,
    required this.totalSleepDuration,
    required this.deepSleepDuration,
    required this.lightSleepDuration,
    required this.remSleepDuration,
    required this.awakeDuration,
    required this.sleepEfficiency,
    required this.sleepScore,
    required this.quality,
    required this.notes,
    required this.heartRateVariability,
    required this.restingHeartRate,
  });

  factory SleepSessionModel.fromJson(Map<String, dynamic> json) {
    return SleepSessionModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      sleepDate: _asString(json['sleepDate']),
      bedtime: _asDate(json['bedtime']),
      sleepTime: _asDate(json['sleepTime']),
      wakeTime: _asDate(json['wakeTime']),
      totalSleepDuration: _asNullableInt(json['totalSleepDuration']),
      deepSleepDuration: _asNullableInt(json['deepSleepDuration']),
      lightSleepDuration: _asNullableInt(json['lightSleepDuration']),
      remSleepDuration: _asNullableInt(json['remSleepDuration']),
      awakeDuration: _asNullableInt(json['awakeDuration']),
      sleepEfficiency: _asNullableDouble(json['sleepEfficiency']),
      sleepScore: _asNullableInt(json['sleepScore']),
      quality: _asNullableString(json['quality']),
      notes: _asNullableString(json['notes']),
      heartRateVariability: _asNullableInt(json['heartRateVariability']),
      restingHeartRate: _asNullableInt(json['restingHeartRate']),
    );
  }

  final int id;
  final int userId;
  final String sleepDate;
  final DateTime? bedtime;
  final DateTime? sleepTime;
  final DateTime? wakeTime;
  final int? totalSleepDuration;
  final int? deepSleepDuration;
  final int? lightSleepDuration;
  final int? remSleepDuration;
  final int? awakeDuration;
  final double? sleepEfficiency;
  final int? sleepScore;
  final String? quality;
  final String? notes;
  final int? heartRateVariability;
  final int? restingHeartRate;

  @override
  List<Object?> get props => [
        id,
        userId,
        sleepDate,
        bedtime,
        sleepTime,
        wakeTime,
        totalSleepDuration,
        deepSleepDuration,
        lightSleepDuration,
        remSleepDuration,
        awakeDuration,
        sleepEfficiency,
        sleepScore,
        quality,
        notes,
        heartRateVariability,
        restingHeartRate,
      ];
}

class SleepSessionInput extends Equatable {
  const SleepSessionInput({
    required this.sleepDate,
    this.bedtime,
    this.sleepTime,
    this.wakeTime,
    this.quality,
    this.notes,
  });

  final String sleepDate;
  final DateTime? bedtime;
  final DateTime? sleepTime;
  final DateTime? wakeTime;
  final String? quality;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'sleepDate': sleepDate,
        'bedtime': _utcIso8601(bedtime),
        'sleepTime': _utcIso8601(sleepTime),
        'wakeTime': _utcIso8601(wakeTime),
        'quality': _nullableText(quality),
        'notes': _nullableText(notes),
      };

  @override
  List<Object?> get props => [
        sleepDate,
        bedtime,
        sleepTime,
        wakeTime,
        quality,
        notes,
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

double? _asNullableDouble(Object? value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  return double.tryParse('$value');
}

String _asString(Object? value) => value is String ? value : '';

String? _asNullableString(Object? value) {
  if (value is String && value.trim().isNotEmpty) return value;
  return null;
}

String? _nullableText(String? value) =>
    value == null || value.trim().isEmpty ? null : value.trim();

String? _utcIso8601(DateTime? value) => value?.toUtc().toIso8601String();