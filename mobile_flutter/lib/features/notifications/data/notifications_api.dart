import '../../../core/network/api_client.dart';
import '../models/notification_model.dart';

class NotificationsApi {
  const NotificationsApi(this.client);

  final ApiClient client;

  Future<List<NotificationModel>> getNotifications() async {
    final response = await client.get<dynamic>('/api/notifications');
    final data = response.data;

    if (data is! List) {
      throw const FormatException('Invalid notifications response');
    }

    return data
        .whereType<Map>()
        .map(
          (notification) => NotificationModel.fromJson(
            Map<String, dynamic>.from(notification),
          ),
        )
        .toList();
  }

  Future<void> markAsRead(int notificationId) async {
    await client.post<dynamic>(
      '/api/notifications/$notificationId/read',
    );
  }
}