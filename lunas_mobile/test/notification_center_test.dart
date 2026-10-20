import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:lunas_mobile/core/routes/app_router.dart';
import 'package:lunas_mobile/features/notifications/data/models/notification_data.dart';
import 'package:lunas_mobile/features/notifications/data/services/notification_service.dart';
import 'package:lunas_mobile/features/notifications/presentation/screens/notification_details_screen.dart';
import 'package:lunas_mobile/features/notifications/presentation/screens/notifications_screen.dart';

const _workOrderId = '507f191e810c19729de860a1';
const _incidentId = '507f191e810c19729de860a2';

NotificationData _item({
  String id = 'notification-1',
  String title = 'Assigned work',
  String? workOrderId = _workOrderId,
  String? incidentId,
  bool isRead = false,
}) => NotificationData(
  id: id,
  title: title,
  message: 'Open the latest update.',
  time: 'Just now',
  icon: Icons.engineering_outlined,
  color: Colors.blue,
  kind: NotificationKind.update,
  type: 'work_order_assigned',
  workOrderId: workOrderId,
  incidentId: incidentId,
  isRead: isRead,
);

class _FakeNotifications implements NotificationRepository {
  _FakeNotifications({required this.pages, this.failuresRemaining = 0});

  final Map<int, NotificationPage> pages;
  int failuresRemaining;
  final List<int> requestedPages = [];
  final List<String> markedRead = [];
  int markAllCalls = 0;
  Completer<NotificationPage>? pendingFirstPage;

  @override
  Future<NotificationPage> getNotifications({
    int page = 1,
    int limit = 20,
    NotificationKind? kind,
  }) async {
    requestedPages.add(page);
    if (pendingFirstPage != null && page == 1) {
      return pendingFirstPage!.future;
    }
    if (failuresRemaining > 0) {
      failuresRemaining -= 1;
      throw Exception('notification service unavailable');
    }
    return pages[page] ?? NotificationPage(items: [], unreadCount: 0);
  }

  @override
  Future<void> markAllAsRead() async {
    markAllCalls += 1;
  }

  @override
  Future<NotificationData> markAsRead(String notificationId) async {
    markedRead.add(notificationId);
    return pages.values
        .expand((page) => page.items)
        .firstWhere((item) => item.id == notificationId);
  }
}

Widget _app(Widget home) => MaterialApp(home: home);

void main() {
  test('parses resource IDs and derives only role-safe destinations', () {
    final item = NotificationData.fromJson({
      '_id': 'notification-1',
      'title': 'Update',
      'message': 'Message',
      'data': {
        'workOrderId': _workOrderId,
        'incidentId': _incidentId,
        'link': '/admin/users',
      },
    });

    expect(item.workOrderId, _workOrderId);
    expect(
      notificationDestination(item, repairWorkspace: true),
      '/repair/work-orders/$_workOrderId',
    );
    expect(
      notificationDestination(item, repairWorkspace: false),
      '/reports/$_incidentId',
    );
  });

  test(
    'citizen and repair notification routes stay in separate workspaces',
    () {
      expect(isRepairWorkspaceLocation('/repair/notifications'), isTrue);
      expect(
        isRepairWorkspaceLocation('/repair/notifications/details'),
        isTrue,
      );
      expect(isRepairWorkspaceLocation('/notifications'), isFalse);
      expect(isCitizenWorkspaceLocation('/notifications/details'), isTrue);
      expect(isCitizenWorkspaceLocation('/repair/notifications'), isFalse);
    },
  );

  testWidgets('shows loading, error with retry, and empty states', (
    tester,
  ) async {
    final pending = _FakeNotifications(pages: const {})
      ..pendingFirstPage = Completer<NotificationPage>();
    await tester.pumpWidget(_app(NotificationsScreen(repository: pending)));
    expect(find.text('Loading notifications'), findsOneWidget);
    pending.pendingFirstPage!.complete(
      NotificationPage(items: [], unreadCount: 0),
    );
    await tester.pumpAndSettle();
    expect(find.text('No notifications yet'), findsOneWidget);

    final retry = _FakeNotifications(
      pages: {1: NotificationPage(items: [], unreadCount: 0)},
      failuresRemaining: 1,
    );
    await tester.pumpWidget(
      _app(
        NotificationsScreen(
          key: const ValueKey('retry-notifications'),
          repository: retry,
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Could not load notifications'), findsOneWidget);
    await tester.tap(find.text('Try Again'));
    await tester.pumpAndSettle();
    expect(find.text('No notifications yet'), findsOneWidget);
    expect(retry.requestedPages, [1, 1]);
  });

  testWidgets('all four empty filters keep the same centered message', (
    tester,
  ) async {
    final repository = _FakeNotifications(pages: const {});
    await tester.pumpWidget(_app(NotificationsScreen(repository: repository)));
    await tester.pumpAndSettle();
    final originalPosition = tester.getCenter(
      find.text('No notifications yet'),
    );
    for (final label in ['All', 'Updates', 'Activity', 'Alerts']) {
      await tester.tap(find.widgetWithText(OutlinedButton, label));
      await tester.pumpAndSettle();
      expect(find.text('No notifications yet'), findsOneWidget);
      expect(
        tester.getCenter(find.text('No notifications yet')),
        originalPosition,
      );
      expect(tester.takeException(), isNull);
    }
  });

  testWidgets('loads another page and marks every notification read', (
    tester,
  ) async {
    final first = _item();
    final second = _item(id: 'notification-2', title: 'Correction coordinated');
    final repository = _FakeNotifications(
      pages: {
        1: NotificationPage(
          items: [first],
          unreadCount: 2,
          page: 1,
          pages: 2,
          total: 2,
        ),
        2: NotificationPage(
          items: [second],
          unreadCount: 2,
          page: 2,
          pages: 2,
          total: 2,
        ),
      },
    );
    await tester.pumpWidget(
      _app(NotificationsScreen(repairWorkspace: true, repository: repository)),
    );
    await tester.pumpAndSettle();

    expect(find.text('2 unread updates'), findsOneWidget);
    await tester.tap(find.text('Load more'));
    await tester.pumpAndSettle();
    expect(find.text('Correction coordinated'), findsOneWidget);
    expect(repository.requestedPages, [1, 2]);

    await tester.tap(find.text('Mark All as Read'));
    await tester.pumpAndSettle();
    expect(repository.markAllCalls, 1);
    expect(find.text('Stay updated on your assigned verifications.'), findsOneWidget);
  });

  testWidgets(
    'opening a repair notification marks it read and stays repair-only',
    (tester) async {
      final repository = _FakeNotifications(
        pages: {
          1: NotificationPage(items: [_item()], unreadCount: 1),
        },
      );
      final router = GoRouter(
        initialLocation: '/repair/notifications',
        routes: [
          GoRoute(
            path: '/repair/notifications',
            builder: (_, _) => NotificationsScreen(
              repairWorkspace: true,
              repository: repository,
            ),
          ),
          GoRoute(
            path: '/repair/notifications/details',
            builder: (_, _) =>
                const Scaffold(body: Text('Repair notification details route')),
          ),
        ],
      );
      await tester.pumpWidget(MaterialApp.router(routerConfig: router));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Assigned work'));
      await tester.pumpAndSettle();

      expect(repository.markedRead, ['notification-1']);
      expect(find.byType(BottomSheet), findsOneWidget);
      expect(find.text('View Work Verification'), findsOneWidget);
      expect(router.state.uri.path, '/repair/notifications');
      Navigator.of(tester.element(find.byType(BottomSheet))).pop();
      await tester.pumpAndSettle();
      expect(find.byType(BottomSheet), findsNothing);
      expect(find.text('Assigned work'), findsOneWidget);
    },
  );

  testWidgets('repair detail without a work order has no report action', (
    tester,
  ) async {
    await tester.pumpWidget(
      _app(
        NotificationDetailsScreen(
          repairWorkspace: true,
          item: _item(workOrderId: null, incidentId: _incidentId),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(
      find.text(
        'This notification is not linked to an accessible work verification.',
      ),
      findsOneWidget,
    );
    expect(find.text('View Report'), findsNothing);
    expect(find.text('View Work Verification'), findsNothing);
  });
}
