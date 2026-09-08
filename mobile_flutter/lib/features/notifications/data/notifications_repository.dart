import '../models/notification_model.dart';
import 'notifications_api.dart';

class NotificationsRepository {
  const NotificationsRepository(this.api);

  final NotificationsApi api;

  Future<List<NotificationModel>> getNotifications() =>
      api.getNotifications();

  Future<void> markAsRead(int notificationId) =>
      api.markAsRead(notificationId);
}