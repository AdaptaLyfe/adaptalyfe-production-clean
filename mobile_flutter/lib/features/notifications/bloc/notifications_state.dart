import 'package:equatable/equatable.dart';

import '../models/notification_model.dart';

enum NotificationsStatus {
  initial,
  loading,
  loaded,
  failure,
}

class NotificationsState extends Equatable {
  const NotificationsState({
    this.status = NotificationsStatus.initial,
    this.notifications = const [],
    this.markingNotificationId,
    this.errorMessage,
    this.actionMessage,
    this.sessionInvalid = false,
  });

  final NotificationsStatus status;
  final List<NotificationModel> notifications;
  final int? markingNotificationId;
  final String? errorMessage;
  final String? actionMessage;
  final bool sessionInvalid;

  bool get isLoading => status == NotificationsStatus.loading;
  bool get hasNotifications => notifications.isNotEmpty;
  int get unreadCount =>
      notifications.where((notification) => !notification.isRead).length;

  NotificationsState copyWith({
    NotificationsStatus? status,
    List<NotificationModel>? notifications,
    Object? markingNotificationId = _notSet,
    Object? errorMessage = _notSet,
    Object? actionMessage = _notSet,
    bool? sessionInvalid,
  }) {
    return NotificationsState(
      status: status ?? this.status,
      notifications: notifications ?? this.notifications,
      markingNotificationId: identical(markingNotificationId, _notSet)
          ? this.markingNotificationId
          : markingNotificationId as int?,
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
        notifications,
        markingNotificationId,
        errorMessage,
        actionMessage,
        sessionInvalid,
      ];
}

const _notSet = Object();