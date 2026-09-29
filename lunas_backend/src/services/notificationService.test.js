jest.mock('onesignal-node', () => ({ Client: jest.fn() }));
jest.mock('../models/Notification', () => ({ create: jest.fn() }));
jest.mock('../models/Incident', () => ({ findById: jest.fn(), findOne: jest.fn() }));
jest.mock('../models/WorkOrder', () => ({ findById: jest.fn() }));
jest.mock('../models/User', () => ({ findById: jest.fn() }));
jest.mock('../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const Notification = require('../models/Notification');
const Incident = require('../models/Incident');
const User = require('../models/User');
const notificationService = require('./notificationService');

describe('notification delivery boundary', () => {
  const originalAppId = process.env.ONESIGNAL_APP_ID;
  const originalRestKey = process.env.ONESIGNAL_REST_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ONESIGNAL_APP_ID = 'test-app';
    process.env.ONESIGNAL_REST_API_KEY = 'test-key';
  });

  afterAll(() => {
    if (originalAppId === undefined) delete process.env.ONESIGNAL_APP_ID;
    else process.env.ONESIGNAL_APP_ID = originalAppId;
    if (originalRestKey === undefined) delete process.env.ONESIGNAL_REST_API_KEY;
    else process.env.ONESIGNAL_REST_API_KEY = originalRestKey;
  });

  test('looks up the ObjectId recipient before attempting configured push delivery', async () => {
    const notification = {
      recipient: '507f191e810c19729de860a1',
      title: 'Assigned',
      message: 'New work order',
      data: { workOrderId: '507f191e810c19729de860d1' }
    };
    Notification.create.mockResolvedValue(notification);
    const select = jest.fn().mockResolvedValue({
      deviceTokens: [{ token: 'player-one' }, { token: '' }]
    });
    User.findById.mockReturnValue({ select });
    const sendPush = jest.spyOn(notificationService, 'sendPushNotification').mockResolvedValue();

    await expect(notificationService.createNotification({ type: 'work_order_assigned' }))
      .resolves.toBe(notification);

    expect(User.findById).toHaveBeenCalledWith(notification.recipient);
    expect(select).toHaveBeenCalledWith('deviceTokens');
    expect(sendPush).toHaveBeenCalledWith(
      ['player-one'],
      notification.title,
      notification.message,
      notification.data
    );
  });

  test('keeps the in-app notification when optional push recipient lookup fails', async () => {
    const notification = {
      recipient: '507f191e810c19729de860a1',
      title: 'Progress',
      message: 'Repair progressed',
      data: {}
    };
    Notification.create.mockResolvedValue(notification);
    User.findById.mockImplementation(() => {
      throw new Error('database temporarily unavailable');
    });

    await expect(notificationService.createNotification({ type: 'work_order_progress' }))
      .resolves.toBe(notification);
  });

  test('persists the actual incident id and report number for linked notifications', async () => {
    const incidentId = '507f191e810c19729de860a1';
    const select = jest.fn().mockResolvedValue({
      _id: incidentId,
      reportNumber: 'DEMO-QA-001'
    });
    Incident.findById.mockReturnValue({ select });
    Notification.create.mockImplementation(async (value) => value);

    const result = await notificationService.createNotification({
      recipient: '507f191e810c19729de860a2',
      type: 'incident_submitted',
      title: 'Report Submitted',
      message: 'A report was submitted.',
      data: { incidentId }
    });

    expect(result.data).toEqual({
      incidentId,
      reportNumber: 'DEMO-QA-001'
    });
    expect(Incident.findById).toHaveBeenCalledWith(incidentId);
  });
});
