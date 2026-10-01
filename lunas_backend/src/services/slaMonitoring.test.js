jest.mock('node-cron', () => ({ schedule: jest.fn(() => ({ stop: jest.fn() })) }));
jest.mock('../models/Incident', () => ({ find: jest.fn(), findOneAndUpdate: jest.fn(), updateOne: jest.fn() }));
jest.mock('../models/WorkOrder', () => ({ find: jest.fn(), findOneAndUpdate: jest.fn(), updateMany: jest.fn() }));
jest.mock('../models/User', () => ({ find: jest.fn() }));
jest.mock('../utils/logger', () => ({ info: jest.fn(), error: jest.fn() }));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn() }));
jest.mock('./notificationService', () => ({
  createNotification: jest.fn(),
  notificationTemplates: {
    slaReminder: (number, hours) => ({ type: 'sla_reminder', title: 'Reminder', message: `${number} within ${hours} hours` }),
    slaEscalation: () => ({ type: 'sla_escalation', title: 'Overdue', message: 'Overdue' }),
    workOrderSlaApproaching: () => ({ type: 'sla_approaching', title: 'Approaching', message: 'Approaching' }),
    workOrderSlaOverdue: () => ({ type: 'sla_overdue', title: 'Overdue', message: 'Overdue' })
  }
}));

const cron = require('node-cron');
const Incident = require('../models/Incident');
const WorkOrder = require('../models/WorkOrder');
const User = require('../models/User');
const { createNotification } = require('./notificationService');
const { getSlaProjection, getClosedSlaFields } = require('./workOrderService');
const { runIncidentSlaCheck, runWorkOrderSlaCheck, normalizeTerminalSla,
  checkSLAStatus, startSLAMonitor, stopSLAMonitor, getPollingMinutes } = require('./slaService');

const now = new Date('2026-10-02T00:00:00Z');
const incidentAt = (hours, status = 'provider_review') => ({
  _id: 'incident', reportNumber: 'LUNAS-001', assignedUtility: 'provider', status,
  sla: { deadline: new Date(now.getTime() + hours * 3600000), state: 'active', escalationLevel: 0 }
});

beforeEach(() => {
  jest.resetAllMocks();
  process.env.SLA_AUTOMATION_ENABLED = 'false';
  delete process.env.SLA_POLL_INTERVAL_MINUTES;
  process.env.SLA_APPROACHING_THRESHOLD_HOURS = '24';
  Incident.find.mockResolvedValue([]);
  Incident.updateOne.mockResolvedValue({ modifiedCount: 1 });
  WorkOrder.find.mockResolvedValue([]);
  WorkOrder.updateMany.mockResolvedValue({ modifiedCount: 1 });
  User.find.mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: 'engineer' }]) });
  createNotification.mockResolvedValue({});
  cron.schedule.mockImplementation(() => ({ stop: jest.fn() }));
});
afterEach(() => stopSLAMonitor());

test.each([24, 12, 6, 2])('incident reminder threshold %i is acknowledged independently', async (hours) => {
  const incident = incidentAt(hours);
  incident.sla.reminderThresholdsSent = [24, 12, 6, 2].filter((value) => value > hours);
  Incident.find.mockResolvedValue([incident]);
  Incident.findOneAndUpdate.mockResolvedValue(incident);
  await runIncidentSlaCheck(now);
  expect(createNotification).toHaveBeenCalledTimes(1);
  expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
    recipient: 'provider', idempotencyKey: expect.stringContaining(`reminder:${hours}`)
  }));
  expect(Incident.updateOne).toHaveBeenCalledWith(expect.objectContaining({
    'sla.reminderThresholdsSent': { $ne: hours }
  }), expect.objectContaining({ $addToSet: { 'sla.reminderThresholdsSent': hours } }));
});

test('acknowledged incident thresholds are not delivered again', async () => {
  const incident = incidentAt(1);
  incident.sla.reminderThresholdsSent = [24, 12, 6, 2];
  Incident.find.mockResolvedValue([incident]);
  Incident.findOneAndUpdate.mockResolvedValue(incident);
  await runIncidentSlaCheck(now);
  expect(createNotification).not.toHaveBeenCalled();
});

test('legacy reminder counter acknowledgments migrate without repeating old warnings', async () => {
  const incident = incidentAt(5);
  incident.sla.remindersSent = 3;
  Incident.find.mockResolvedValue([incident]);
  Incident.findOneAndUpdate.mockResolvedValue(incident);
  await runIncidentSlaCheck(now);
  expect(createNotification).not.toHaveBeenCalled();
  expect(Incident.updateOne).toHaveBeenCalledWith(expect.anything(), {
    $addToSet: { 'sla.reminderThresholdsSent': { $each: [24, 12, 6] } }
  });
});

test.each(['provider_review', 'city_verification', 'city_correction_required', 'rework_required'])(
  'incident in %s becomes overdue and escalates once without changing deadline', async (status) => {
    const incident = incidentAt(-1, status);
    Incident.find.mockResolvedValue([incident]);
    Incident.findOneAndUpdate.mockResolvedValue(incident);
    await runIncidentSlaCheck(now);
    const update = Incident.findOneAndUpdate.mock.calls[0][1];
    expect(update.$set).toEqual({ 'sla.state': 'overdue', 'sla.isOverdue': true });
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      recipient: 'provider', type: 'sla_escalation'
    }));
    incident.sla.overdueNotifiedAt = now;
    await runIncidentSlaCheck(now);
    expect(createNotification).toHaveBeenCalledTimes(1);
  }
);

test('unrouted prioritized incident warns City Engineering; existing level 2 includes engineers', async () => {
  const incident = incidentAt(-1);
  delete incident.assignedUtility;
  Incident.find.mockResolvedValue([incident]);
  Incident.findOneAndUpdate.mockResolvedValue(incident);
  await runIncidentSlaCheck(now);
  expect(createNotification.mock.calls[0][0].recipient).toBe('engineer');
  createNotification.mockClear();
  incident.assignedUtility = 'provider';
  incident.sla.escalationLevel = 2;
  await runIncidentSlaCheck(now);
  expect(createNotification.mock.calls.map(([value]) => value.recipient)).toEqual(['provider', 'engineer']);
});

test('incident delivery failure leaves SLA overdue and retries with the same recipient key', async () => {
  const incident = incidentAt(-1);
  Incident.find.mockResolvedValue([incident]);
  Incident.findOneAndUpdate.mockResolvedValue(incident);
  createNotification.mockRejectedValueOnce(new Error('temporary delivery failure'));
  await runIncidentSlaCheck(now);
  expect(Incident.updateOne.mock.calls.some(([, update]) => update.$set?.['sla.overdueNotifiedAt'])).toBe(false);
  await runIncidentSlaCheck(now);
  expect(createNotification.mock.calls[0][0].idempotencyKey).toBe(createNotification.mock.calls[1][0].idempotencyKey);
  expect(Incident.updateOne).toHaveBeenCalledWith(expect.anything(), { $set: { 'sla.overdueNotifiedAt': now } });
});

test('work-order delivery failure remains retryable without changing its deadline', async () => {
  const workOrder = { ...incidentAt(-1), _id: 'work-order', incident: 'incident', assignedTo: 'repair', createdBy: 'provider' };
  WorkOrder.find.mockResolvedValue([workOrder]);
  WorkOrder.findOneAndUpdate.mockResolvedValue(workOrder);
  createNotification.mockRejectedValueOnce(new Error('unavailable'));
  await runWorkOrderSlaCheck(now);
  expect(WorkOrder.findOneAndUpdate).toHaveBeenCalledTimes(1);
  await runWorkOrderSlaCheck(now);
  expect(createNotification.mock.calls[0][0].idempotencyKey).toBe(createNotification.mock.calls[1][0].idempotencyKey);
  expect(WorkOrder.findOneAndUpdate.mock.calls[2][1].$set).toEqual({ 'sla.overdueNotifiedAt': now });
});

test.each(['rejected', 'duplicate', 'closed'])('terminal %s stops overdue accounting and preserves the deadline', async (status) => {
  const incident = { ...incidentAt(-1, status), closedAt: now };
  Incident.find.mockResolvedValue([incident]);
  await normalizeTerminalSla();
  const fields = Incident.updateOne.mock.calls[0][1].$set;
  expect(fields['sla.state']).toBe(status === 'closed' ? 'breached' : 'cancelled');
  expect(fields['sla.isOverdue']).toBe(false);
  expect(fields).not.toHaveProperty('sla.deadline');
  expect(WorkOrder.updateMany).toHaveBeenCalledWith({ incident: incident._id }, { $set: fields });
  expect(createNotification).not.toHaveBeenCalled();
});

test('deadline projection has exact approaching/overdue boundaries and terminal outcomes', () => {
  expect(getSlaProjection(incidentAt(25).sla, now).state).toBe('active');
  expect(getSlaProjection(incidentAt(24).sla, now).state).toBe('approaching');
  expect(getSlaProjection(incidentAt(0).sla, now).isOverdue).toBe(false);
  expect(getSlaProjection(incidentAt(-1).sla, now).state).toBe('overdue');
  for (const state of ['met', 'breached', 'cancelled']) {
    expect(getSlaProjection({ ...incidentAt(-1).sla, state }, now)).toMatchObject({ state, isOverdue: false, isApproaching: false });
  }
  expect(getClosedSlaFields(incidentAt(1).sla, now)['sla.state']).toBe('met');
  expect(getClosedSlaFields(incidentAt(-1).sla, now)['sla.state']).toBe('breached');
});

test('terminal records without a known closure timestamp are not assigned a fabricated time', async () => {
  Incident.find.mockResolvedValue([incidentAt(-1, 'closed')]);
  await normalizeTerminalSla();
  expect(Incident.updateOne).not.toHaveBeenCalled();
});

test('scheduler starts once, suppresses overlapping ticks, and recovers from database failure', async () => {
  jest.useFakeTimers().setSystemTime(now);
  process.env.SLA_AUTOMATION_ENABLED = 'true';
  let release;
  Incident.find.mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
  startSLAMonitor();
  startSLAMonitor();
  expect(cron.schedule).toHaveBeenCalledTimes(1);
  const [expression, tick] = cron.schedule.mock.calls[0];
  expect(expression).toBe('*/5 * * * *');
  await tick();
  expect(Incident.find).toHaveBeenCalledTimes(1);
  release([]);
  await jest.runAllTimersAsync();
  Incident.find.mockRejectedValueOnce(new Error('temporary database outage'));
  await tick();
  const calls = Incident.find.mock.calls.length;
  await tick();
  expect(Incident.find.mock.calls.length).toBeGreaterThan(calls);
  expect(WorkOrder.find).toHaveBeenCalled();
  jest.useRealTimers();
});

test('disabled scheduler creates no job; invalid polling configuration fails explicitly', () => {
  startSLAMonitor();
  expect(cron.schedule).not.toHaveBeenCalled();
  process.env.SLA_POLL_INTERVAL_MINUTES = '0';
  expect(getPollingMinutes).toThrow('1 to 59');
  process.env.SLA_POLL_INTERVAL_MINUTES = '1';
  expect(getPollingMinutes()).toBe(1);
});

test('database failures in one monitoring branch do not prevent subsequent checks', async () => {
  Incident.find.mockRejectedValue(new Error('database outage'));
  await checkSLAStatus(now);
  expect(WorkOrder.find).toHaveBeenCalledTimes(1);
  Incident.find.mockResolvedValue([]);
  await checkSLAStatus(now);
  expect(WorkOrder.find).toHaveBeenCalledTimes(2);
});
