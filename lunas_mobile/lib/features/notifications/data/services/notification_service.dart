import 'package:lunas_mobile/core/network/api_client.dart';
import 'package:lunas_mobile/features/notifications/data/models/notification_data.dart';

class NotificationPage {
  NotificationPage({
    required this.items,
    required this.unreadCount,
    this.page = 1,
    this.limit = 20,
    int? total,
    int? pages,
  }) : total = total ?? items.length,
       pages = pages ?? 1;

  final List<NotificationData> items;
  final int unreadCount;
  final int page;
  final int limit;
  final int total;
  final int pages;

  bool get hasNextPage => page < pages;
}

abstract interface class NotificationRepository {
  Future<NotificationPage> getNotifications({
    int page = 1,
    int limit = 20,
    NotificationKind? kind,
  });
  Future<NotificationData> markAsRead(String notificationId);
  Future<void> markAllAsRead();
}

class NotificationService implements NotificationRepository {
  const NotificationService({required ApiClient apiClient})
    : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<NotificationPage> getNotifications({
    int page = 1,
    int limit = 20,
    NotificationKind? kind,
  }) async {
    final payload = await _apiClient.get(
      '/notifications',
      queryParameters: {
        'page': '$page',
        'limit': '$limit',
        if (kind != null) 'kind': kind.name,
      },
    );
    final rawItems = payload['data'];
    final items = rawItems is List
        ? rawItems
              .whereType<Map>()
              .map(
                (value) =>
                    NotificationData.fromJson(Map<String, dynamic>.from(value)),
              )
              .toList(growable: false)
        : const <NotificationData>[];
    final rawPagination = payload['pagination'];
    final pagination = rawPagination is Map
        ? Map<String, dynamic>.from(rawPagination)
        : const <String, dynamic>{};
    int number(Object? value, int fallback) =>
        int.tryParse((value ?? '').toString()) ?? fallback;
    return NotificationPage(
      items: items,
      unreadCount:
          int.tryParse((payload['unreadCount'] ?? '').toString()) ??
          items.where((item) => !item.isRead).length,
      page: number(pagination['page'], page),
      limit: number(pagination['limit'], limit),
      total: number(pagination['total'], items.length),
      pages: number(pagination['pages'], 1),
    );
  }

  @override
  Future<NotificationData> markAsRead(String notificationId) async {
    final payload = await _apiClient.put('/notifications/$notificationId/read');
    final data = payload['data'];
    return NotificationData.fromJson(
      data is Map<String, dynamic>
          ? data
          : Map<String, dynamic>.from(data as Map),
    );
  }

  @override
  Future<void> markAllAsRead() async {
    await _apiClient.put('/notifications/read-all');
  }
}
