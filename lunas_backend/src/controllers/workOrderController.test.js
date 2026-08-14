jest.mock('../models/WorkOrder', () => ({ create: jest.fn() }));
jest.mock('../models/Incident', () => ({ findById: jest.fn() }));
jest.mock('../models/User', () => ({ findById: jest.fn() }));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn() }));

const Incident = require('../models/Incident');
const User = require('../models/User');
const { createWorkOrder } = require('./workOrderController');

const response = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('future work-order boundary', () => {
  test('cannot bypass validation by creating a work order for a submitted incident', async () => {
    Incident.findById.mockResolvedValue({ status: 'submitted', workOrder: null });
    const req = {
      body: {
        incident: '507f191e810c19729de860a1',
        assignedTo: '507f191e810c19729de860a2'
      },
      user: { _id: '507f191e810c19729de860a3' }
    };
    const res = response();

    await createWorkOrder(req, res, jest.fn());

    expect(User.findById).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
  });
});
