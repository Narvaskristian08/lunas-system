jest.mock('../models/Notification', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateMany: jest.fn(),
  countDocuments: jest.fn()
}));
jest.mock('../models/Incident', () => ({ find: jest.fn() }));

const Notification = require('../models/Notification');
const {
  getNotification,
  getNotifications,
  markAllAsRead,
  markAsRead
} = require('./notificationController');

const userId = '507f191e810c19729de860a1';
const notificationId = '507f191e810c19729de860a2';

const response = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const listQuery = (values) => {
  const query = {
    sort: jest.fn(),
    limit: jest.fn(),
    skip: jest.fn()
  };
  query.sort.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.skip.mockResolvedValue(values);
  return query;
};

describe('notification ownership and read actions', () => {
  beforeEach(() => jest.clearAllMocks());

  test('lists only the authenticated recipient with pagination and unread count', async () => {
    const values = [{ _id: notificationId, data: {}, toObject() { return this; } }];
    const query = listQuery(values);
    Notification.find.mockReturnValue(query);
    Notification.countDocuments
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);
    const req = {
      user: { _id: userId },
      query: { page: '2', limit: '2', isRead: 'false' }
    };
    const res = response();

    await getNotifications(req, res, jest.fn());

    expect(Notification.find).toHaveBeenCalledWith({
      recipient: userId, dismissedAt: { $exists: false },
      isRead: false
    });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
    expect(query.limit).toHaveBeenCalledWith(2);
    expect(query.skip).toHaveBeenCalledWith(2);
    expect(Notification.countDocuments).toHaveBeenNthCalledWith(2, {
      recipient: userId,
      isRead: false
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      unreadCount: 2,
      pagination: { page: 2, limit: 2, total: 3, pages: 2 }
    }));
  });

  test('does not return another account notification', async () => {
    Notification.findOne.mockResolvedValue(null);
    const res = response();

    await getNotification({
      user: { _id: userId },
      params: { id: notificationId }
    }, res, jest.fn());

    expect(Notification.findOne).toHaveBeenCalledWith({
      _id: notificationId,
      recipient: userId
    });
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('marks one notification read only when it belongs to the account', async () => {
    Notification.findOneAndUpdate.mockResolvedValue(null);
    const res = response();

    await markAsRead({
      user: { _id: userId },
      params: { id: notificationId }
    }, res, jest.fn());

    expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: expect.any(Number) },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('marks all unread notifications only for the authenticated account', async () => {
    Notification.updateMany.mockResolvedValue({ modifiedCount: 2 });
    const res = response();

    await markAllAsRead({ user: { _id: userId } }, res, jest.fn());

    expect(Notification.updateMany).toHaveBeenCalledWith(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: expect.any(Number) }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});


test('category filters apply before pagination and keep unread count account-wide', async () => {
  Notification.find.mockReturnValue(listQuery([]));
  Notification.countDocuments.mockResolvedValue(12);
  await getNotifications({ user: { _id: userId }, query: { kind: 'alert', page: '2', limit: '20' } }, response(), jest.fn());
  expect(Notification.find).toHaveBeenLastCalledWith(expect.objectContaining({ recipient: userId, type: { $in: expect.arrayContaining(['sla_overdue', 'incident_rejected', 'work_order_declined']) } }));
  expect(Notification.countDocuments).toHaveBeenLastCalledWith({ recipient: userId, isRead: false });
});
test('Today starts at midnight in Manila', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-10-13T10:00:00Z'));
  Notification.find.mockReturnValue(listQuery([])); Notification.countDocuments.mockResolvedValue(0);
  await getNotifications({ user: { _id: userId }, query: { dateRange: 'today' } }, response(), jest.fn());
  expect(Notification.find).toHaveBeenLastCalledWith(expect.objectContaining({ createdAt: { $gte: new Date('2026-10-12T16:00:00Z'), $lte: new Date('2026-10-13T10:00:00Z') } }));
  jest.useRealTimers();
});
