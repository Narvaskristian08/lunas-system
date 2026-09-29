jest.mock('../models/Incident', () => ({ find: jest.fn() }));
jest.mock('../models/WorkOrder', () => ({
  find: jest.fn(),
  findOneAndUpdate: jest.fn()
}));
jest.mock('../models/User', () => ({ find: jest.fn() }));
jest.mock('./notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue(null),
  notificationTemplates: {
    workOrderSlaApproaching: jest.fn(() => ({
      type: 'sla_approaching',
      title: 'Approaching',
      message: 'Approaching'
    })),
    workOrderSlaOverdue: jest.fn(() => ({
      type: 'sla_overdue',
      title: 'Overdue',
      message: 'Overdue'
    }))
  }
}));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn().mockResolvedValue(null) }));
jest.mock('./workOrderService', () => ({
  ACTIVE_WORK_ORDER_STATUSES: ['pending', 'accepted', 'in_progress'],
  getSlaProjection: jest.fn(),
  workOrderHistoryEntry: jest.fn((entry) => entry)
}));

const WorkOrder = require('../models/WorkOrder');
const { createNotification } = require('./notificationService');
const { getSlaProjection } = require('./workOrderService');
const { runWorkOrderSlaCheck } = require('./slaService');

describe('work-order SLA checking', () => {
  beforeEach(() => jest.clearAllMocks());

  test('records a single approaching alert and avoids duplicate notifications', async () => {
    const now = new Date('2026-08-19T00:00:00.000Z');
    const workOrder = {
      _id: '507f191e810c19729de860d1',
      orderNumber: 'WO-202608-000001',
      incident: '507f191e810c19729de860b1',
      assignedTo: '507f191e810c19729de860a2',
      assignedBy: '507f191e810c19729de860a3',
      createdBy: '507f191e810c19729de860a3',
      status: 'in_progress',
      progressPercent: 50,
      progressStage: 'main_repair',
      version: 2,
      sla: { deadline: new Date('2026-08-19T08:00:00.000Z') }
    };
    WorkOrder.find
      .mockResolvedValueOnce([workOrder])
      .mockResolvedValueOnce([{
        ...workOrder,
        sla: { ...workOrder.sla, approachingNotifiedAt: now }
      }]);
    WorkOrder.findOneAndUpdate.mockResolvedValue({
      ...workOrder,
      sla: { ...workOrder.sla, approachingNotifiedAt: now }
    });
    getSlaProjection.mockReturnValue({
      isApproaching: true,
      isOverdue: false,
      remainingMilliseconds: 8 * 60 * 60 * 1000
    });

    await expect(runWorkOrderSlaCheck(now)).resolves.toEqual({ approaching: 1, overdue: 0 });
    await expect(runWorkOrderSlaCheck(now)).resolves.toEqual({ approaching: 0, overdue: 0 });

    // Assignee and creating/assigning official are unique recipients.
    expect(createNotification).toHaveBeenCalledTimes(2);
    expect(WorkOrder.findOneAndUpdate).toHaveBeenCalledTimes(1);
  });

  test('does not notify when another SLA runner has already claimed the overdue alert', async () => {
    const now = new Date('2026-08-19T00:00:00.000Z');
    const workOrder = {
      _id: '507f191e810c19729de860d2',
      orderNumber: 'WO-202608-000002',
      incident: '507f191e810c19729de860b2',
      assignedTo: '507f191e810c19729de860a2',
      assignedBy: '507f191e810c19729de860a3',
      createdBy: '507f191e810c19729de860a3',
      status: 'in_progress',
      progressPercent: 75,
      progressStage: 'finishing',
      version: 4,
      sla: { deadline: new Date('2026-08-18T23:00:00.000Z') }
    };
    WorkOrder.find.mockResolvedValue([workOrder]);
    WorkOrder.findOneAndUpdate.mockResolvedValue(null);
    getSlaProjection.mockReturnValue({
      isApproaching: false,
      isOverdue: true,
      remainingMilliseconds: -60 * 60 * 1000
    });

    await expect(runWorkOrderSlaCheck(now)).resolves.toEqual({ approaching: 0, overdue: 0 });

    expect(WorkOrder.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(createNotification).not.toHaveBeenCalled();
  });
});
