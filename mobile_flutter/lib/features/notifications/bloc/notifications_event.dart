import 'package:equatable/equatable.dart';

sealed class NotificationsEvent extends Equatable {
  const NotificationsEvent();

  @override
  List<Object?> get props => [];
}

final class NotificationsStarted extends NotificationsEvent {
  const NotificationsStarted();
}

final class RefreshNotifications extends NotificationsEvent {
  const RefreshNotifications();
}

final class MarkNotificationRead extends NotificationsEvent {
  const MarkNotificationRead(this.notificationId);

  final int notificationId;

  @override
  List<Object?> get props => [notificationId];
}