import 'package:lunas_mobile/core/network/api_client.dart';
import 'package:lunas_mobile/features/notifications/data/models/notification_data.dart';

class NotificationPage {
  const NotificationPage({required this.items, required this.unreadCount});

  final List<NotificationData> items;
  final int unreadCount;
}

class NotificationService {
  const NotificationService({required ApiClient apiClient})
    : _apiClient = apiClient;

  final ApiClient _apiClient;

  Future<NotificationPage> getNotifications({int limit = 50}) async {
    final payload = await _apiClient.get(
      '/notifications',
      queryParameters: {'page': '1', 'limit': '$limit'},
    );
    final rawItems = payload['data'];
    final items = rawItems is List
        ? rawItems
              .whereType<Map>()
              .map(
                (value) => NotificationData.fromJson(
                  Map<String, dynamic>.from(value),
                ),
              )
              .toList(growable: false)
        : const <NotificationData>[];
    return NotificationPage(
      items: items,
      unreadCount: int.tryParse((payload['unreadCount'] ?? '').toString()) ??
          items.where((item) => !item.isRead).length,
    );
  }

  Future<NotificationData> markAsRead(String notificationId) async {
    final payload = await _apiClient.put('/notifications/$notificationId/read');
    final data = payload['data'];
    return NotificationData.fromJson(
      data is Map<String, dynamic>
          ? data
          : Map<String, dynamic>.from(data as Map),
    );
  }

  Future<void> markAllAsRead() async {
    await _apiClient.put('/notifications/read-all');
  }
}
