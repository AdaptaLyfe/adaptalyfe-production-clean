import 'package:equatable/equatable.dart';

class NotificationModel extends Equatable {
  const NotificationModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.message,
    required this.isRead,
    required this.priority,
    required this.scheduledFor,
    required this.sentAt,
    required this.relatedId,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      type: _asString(json['type']),
      title: _asString(json['title']),
      message: _asString(json['message']),
      isRead: json['isRead'] == true,
      priority: _asString(json['priority'], fallback: 'normal'),
      scheduledFor: _asDateTime(json['scheduledFor']),
      sentAt: _asDateTime(json['sentAt']),
      relatedId: _asNullableInt(json['relatedId']),
      createdAt: _asDateTime(json['createdAt']),
    );
  }

  final int id;
  final int userId;
  final String type;
  final String title;
  final String message;
  final bool isRead;
  final String priority;
  final DateTime? scheduledFor;
  final DateTime? sentAt;
  final int? relatedId;
  final DateTime? createdAt;

  @override
  List<Object?> get props => [
        id,
        userId,
        type,
        title,
        message,
        isRead,
        priority,
        scheduledFor,
        sentAt,
        relatedId,
        createdAt,
      ];

  static int _asInt(Object? value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse('$value') ?? 0;
  }

  static int? _asNullableInt(Object? value) {
    if (value == null) return null;
    return _asInt(value);
  }

  static String _asString(Object? value, {String fallback = ''}) {
    return value is String ? value : fallback;
  }

  static DateTime? _asDateTime(Object? value) {
    if (value is! String || value.isEmpty) return null;
    return DateTime.tryParse(value);
  }
}