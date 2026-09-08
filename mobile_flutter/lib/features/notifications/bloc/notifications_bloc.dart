import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../data/notifications_repository.dart';
import 'notifications_event.dart';
import 'notifications_state.dart';

class NotificationsBloc extends Bloc<NotificationsEvent, NotificationsState> {
  NotificationsBloc(this.repository) : super(const NotificationsState()) {
    on<NotificationsStarted>(_loadNotifications);
    on<RefreshNotifications>(_loadNotifications);
    on<MarkNotificationRead>(_markNotificationRead);
  }

  final NotificationsRepository repository;

  Future<void> _loadNotifications(
    NotificationsEvent event,
    Emitter<NotificationsState> emit,
  ) async {
    emit(
      state.copyWith(
        status: NotificationsStatus.loading,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );

    try {
      final notifications = await repository.getNotifications();
      emit(
        state.copyWith(
          status: NotificationsStatus.loaded,
          notifications: notifications,
          markingNotificationId: null,
          errorMessage: null,
          actionMessage: null,
        ),
      );
    } on ApiException catch (error) {
      emit(
        state.copyWith(
          status: NotificationsStatus.failure,
          markingNotificationId: null,
          errorMessage: error.message,
          sessionInvalid: error.type == ApiErrorType.unauthorized,
        ),
      );
    } catch (error) {
      emit(
        state.copyWith(
          status: NotificationsStatus.failure,
          markingNotificationId: null,
          errorMessage: _messageFor(error),
        ),
      );
    }
  }

  Future<void> _markNotificationRead(
    MarkNotificationRead event,
    Emitter<NotificationsState> emit,
  ) async {
    final notification = state.notifications
        .where((item) => item.id == event.notificationId)
        .firstOrNull;
    if (notification == null || notification.isRead) return;

    emit(
      state.copyWith(
        markingNotificationId: event.notificationId,
        errorMessage: null,
        actionMessage: null,
      ),
    );

    try {
      await repository.markAsRead(event.notificationId);
      final updatedNotifications = state.notifications
          .map(
            (item) => item.id == event.notificationId
                ? NotificationModelCopy.markRead(item)
                : item,
          )
          .toList();

      emit(
        state.copyWith(
          status: NotificationsStatus.loaded,
          notifications: updatedNotifications,
          markingNotificationId: null,
          errorMessage: null,
          actionMessage: 'Notification marked as read.',
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      emit(
        state.copyWith(
          status: state.hasNotifications
              ? NotificationsStatus.loaded
              : NotificationsStatus.failure,
          markingNotificationId: null,
          errorMessage: error.message,
          sessionInvalid: error.type == ApiErrorType.unauthorized,
        ),
      );
    } catch (error) {
      emit(
        state.copyWith(
          status: state.hasNotifications
              ? NotificationsStatus.loaded
              : NotificationsStatus.failure,
          markingNotificationId: null,
          errorMessage: _messageFor(error),
        ),
      );
    }
  }

  String _messageFor(Object error) {
    if (error is ApiException) return error.message;
    if (error is FormatException) return error.message;
    return 'Unable to load your notifications. Please try again.';
  }
}

class NotificationModelCopy {
  const NotificationModelCopy._();

  static dynamic markRead(dynamic notification) {
    return _MarkedNotification(notification);
  }
}

class _MarkedNotification {
  const _MarkedNotification(this.source);

  final dynamic source;
}