jest.mock('../models/Incident', () => ({ findOne: jest.fn() }));
jest.mock('../models/WorkOrder', () => ({ findOne: jest.fn() }));
jest.mock('../models/Inspection', () => ({ findOne: jest.fn() }));
jest.mock('./fieldIncidentAccess', () => ({ buildReadableIncidentScope: jest.fn(async user => ({ owner: user._id })) }));
jest.mock('./workOrderService', () => ({ buildWorkOrderScope: jest.fn(user => ({ assignee: user._id })) }));
const Incident = require('../models/Incident');
const WorkOrder = require('../models/WorkOrder');
const Inspection = require('../models/Inspection');
const { notificationResource } = require('./notificationAccessService');
const id = '507f191e810c19729de860a1';
beforeEach(() => {
  jest.clearAllMocks(); Incident.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: id, reportNumber: 'REF', initialInspection: id }) });
  WorkOrder.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: id, incident: id }) });
  Inspection.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: id }) });
});
test.each([['citizen', `/reports/${id}`], ['barangay_official', `/validation-routing/${id}`], ['utility_provider', `/work-orders/intake/${id}`]])('%s incident reference uses authorized destination', async (role, destination) => {
  const result = await notificationResource({ _id: 'current', role }, { incidentId: id, url: 'https://attacker.test' });
  expect(result.destination).toBe(destination);
  expect(Incident.findOne.mock.calls[0][0].$and).toEqual([{ owner: 'current' }]);
});
test('revoked incident yields no reference or destination', async () => {
  Incident.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  expect(await notificationResource({ role: 'citizen' }, { incidentId: id })).toBeNull();
});
test('repair task checks current work order and incident scopes', async () => {
  expect((await notificationResource({ _id: 'worker', role: 'repair_personnel' }, { workOrderId: id })).destination).toBe(`/repair/work-orders/${id}`);
  expect(WorkOrder.findOne.mock.calls[0][0]).toMatchObject({ assignee: 'worker' });
});
test('Tanod navigation requires current assigned inspection', async () => {
  Inspection.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  expect(await notificationResource({ _id: 'tanod', role: 'barangay_tanod', barangay: 'Pantal' }, { incidentId: id })).toBeNull();
  expect(Inspection.findOne.mock.calls[0][0]).toMatchObject({ tanod: 'tanod', barangay: 'Pantal' });
});
test('administrator notification does not confer incident access', async () => {
  expect(await notificationResource({ role: 'admin' }, { incidentId: id })).toBeNull(); expect(Incident.findOne).not.toHaveBeenCalled();
});
