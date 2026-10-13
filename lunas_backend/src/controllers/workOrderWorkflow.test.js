jest.mock('../models/WorkOrder', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  countDocuments: jest.fn().mockResolvedValue(0),
  create: jest.fn()
}));
jest.mock('../models/Incident', () => ({
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findByIdAndUpdate: jest.fn()
}));
jest.mock('../models/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn()
}));
jest.mock('../utils/auditLogger', () => ({ createAuditLog: jest.fn().mockResolvedValue(null) }));
jest.mock('../services/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue(null),
  notificationTemplates: {
    workOrderAssigned: jest.fn(() => ({ type: 'work_order_assigned' })),
    workOrderReassigned: jest.fn(() => ({ type: 'work_order_reassigned' })),
    workOrderDeclined: jest.fn(() => ({ type: 'work_order_declined' }))
  }
}));
jest.mock('../services/evidenceService', () => ({
  processAndUploadRepairEvidence: jest.fn(),
  cleanupEvidence: jest.fn().mockResolvedValue(null)
}));
jest.mock('../services/storageService', () => ({ getEvidenceUrl: jest.fn() }));

const WorkOrder = require('../models/WorkOrder');
const Incident = require('../models/Incident');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const {
  assignWorkOrder,
  createWorkOrder,
  declineWorkOrder,
  getWorkOrder,
  reassignWorkOrder,
  uploadRepairEvidence,
  updateProgress
} = require('./workOrderController');
const { processAndUploadRepairEvidence } = require('../services/evidenceService');

const utilityProvider = {
  _id: '507f191e810c19729de860a3',
  role: 'utility_provider',
  utilityCompany: 'Dagupan Water District'
};
const assignedWorker = { _id: '507f191e810c19729de860a2', role: 'repair_personnel', repairOrganization: 'Dagupan Water District' };

const response = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mongoose queries are awaitable and populate() returns the same query. This
// small test double preserves both behaviours without a database connection.
const scopedQuery = (result) => {
  const query = {
    populate: jest.fn(),
    select: jest.fn(),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  };
  query.populate.mockReturnValue(query);
  query.select.mockReturnValue(query);
  return query;
};

const pendingWorkOrder = (overrides = {}) => ({
  _id: '507f191e810c19729de860d1',
  orderNumber: 'WO-202608-000001',
  incident: '507f191e810c19729de860b1',
  responsibleOrganization: 'Dagupan Water District',
  responsibleRole: 'utility_provider',
  jurisdiction: { barangay: 'Poblacion Oeste', city: 'Dagupan City' },
  priority: 'high',
  status: 'pending',
  assignmentState: 'unassigned',
  assignments: [],
  progressPercent: 0,
  progressStage: 'assigned',
  version: 3,
  sla: {},
  ...overrides
});

describe('work-order controller boundaries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('scopes a repair-personnel detail lookup to the caller assignment to prevent IDOR', async () => {
    const otherWorker = { _id: '507f191e810c19729de860ff', role: 'repair_personnel', repairOrganization: 'Dagupan Water District' };
    WorkOrder.findOne.mockReturnValue(scopedQuery(null));
    const res = response();

    await getWorkOrder({
      params: { id: '507f191e810c19729de860d1' },
      user: otherWorker
    }, res, jest.fn());

    expect(WorkOrder.findOne).toHaveBeenCalledWith({
      _id: '507f191e810c19729de860d1',
      assignedTo: otherWorker._id,
      responsibleOrganization: 'Dagupan Water District',
      assignmentState: { $in: ['pending', 'accepted'] }
    });
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('turns a duplicate-key primary work-order race into a conflict response', async () => {
    const incident = {
      _id: '507f191e810c19729de860b1',
      status: 'provider_assigned',
      priority: 'high',
      routing: {
        responsibleOrganization: 'Dagupan Water District',
        responsibleRole: 'utility_provider'
      },
      jurisdiction: { barangay: 'Poblacion Oeste', city: 'Dagupan City' }
    };
    Incident.findById.mockResolvedValue(incident);
    WorkOrder.findOne.mockResolvedValue(null);
    WorkOrder.create.mockRejectedValue({ code: 11000 });
    const res = response();

    await createWorkOrder({
      params: { id: incident._id },
      body: {},
      user: utilityProvider,
      headers: {}
    }, res, jest.fn());

    expect(Incident.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'A primary work order already exists for this incident'
    }));
  });

  test('rolls back a newly created work order when the incident claim loses a concurrent race', async () => {
    const incident = {
      _id: '507f191e810c19729de860b1',
      status: 'provider_assigned',
      priority: 'high',
      routing: {
        responsibleOrganization: 'Dagupan Water District',
        responsibleRole: 'utility_provider'
      },
      jurisdiction: { barangay: 'Poblacion Oeste', city: 'Dagupan City' }
    };
    const workOrder = {
      ...pendingWorkOrder({ createdBy: utilityProvider._id }),
      deleteOne: jest.fn().mockResolvedValue(null)
    };
    Incident.findById.mockResolvedValue(incident);
    WorkOrder.findOne.mockResolvedValue(null);
    WorkOrder.create.mockResolvedValue(workOrder);
    Incident.findOneAndUpdate.mockResolvedValue(null);
    const res = response();

    await createWorkOrder({
      params: { id: incident._id },
      body: {},
      user: utilityProvider,
      headers: {}
    }, res, jest.fn());

    expect(workOrder.deleteOne).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'This incident changed before the work order could be created'
    }));
  });

  test('rejects assignment of unavailable repair personnel before any work-order mutation', async () => {
    const workOrder = pendingWorkOrder();
    WorkOrder.findOne.mockReturnValue(scopedQuery(workOrder));
    User.findById.mockResolvedValue({
      _id: assignedWorker._id,
      role: 'repair_personnel',
      isActive: true,
      availability: 'off_duty',
      repairOrganization: 'Dagupan Water District',
      barangay: 'Poblacion Oeste'
    });
    const res = response();

    await assignWorkOrder({
      params: { id: workOrder._id },
      body: { assigneeId: assignedWorker._id },
      user: utilityProvider
    }, res, jest.fn());

    expect(WorkOrder.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'This repair personnel is off duty or unavailable'
    }));
  });

  test('assigns an eligible same-organization worker and hands the incident to repair', async () => {
    const workOrder = pendingWorkOrder();
    const worker = {
      ...assignedWorker,
      isActive: true,
      availability: 'available',
      barangay: 'Poblacion Oeste'
    };
    const updated = pendingWorkOrder({
      assignedTo: worker._id,
      assignedBy: utilityProvider._id,
      status: 'accepted',
      assignmentState: 'accepted',
      assignments: [{
        _id: '507f191e810c19729de860e1',
        assignee: worker._id,
        assignedBy: utilityProvider._id,
        status: 'accepted',
        active: true
      }],
      currentAssignment: '507f191e810c19729de860e1'
    });
    WorkOrder.findOne.mockReturnValue(scopedQuery(workOrder));
    User.findById.mockResolvedValue(worker);
    WorkOrder.findOneAndUpdate.mockResolvedValue(updated);
    User.findByIdAndUpdate.mockResolvedValue(null);
    Incident.findById.mockReturnValue(scopedQuery({ status: 'provider_assigned' }));
    Incident.findOneAndUpdate.mockResolvedValue({ status: 'repair_assigned' });
    const res = response();

    await assignWorkOrder({
      params: { id: workOrder._id },
      body: { assigneeId: worker._id },
      user: utilityProvider,
      headers: {},
      ip: '127.0.0.1'
    }, res, jest.fn());

    expect(WorkOrder.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: workOrder._id,
        version: workOrder.version,
        assignmentState: { $in: ['unassigned', 'declined'] }
      }),
      expect.objectContaining({
        $set: expect.objectContaining({ assignedTo: worker._id, assignmentState: 'accepted', status: 'accepted' })
      }),
      { new: true }
    );
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(worker._id, { availability: 'assigned' });
    expect(Incident.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'provider_assigned' }),
      expect.objectContaining({ $set: expect.objectContaining({ status: 'repair_assigned' }) }),
      expect.objectContaining({ new: true, runValidators: true })
    );
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      recipient: worker._id,
      type: 'work_order_assigned',
      data: expect.objectContaining({
        incidentId: workOrder.incident,
        workOrderId: workOrder._id
      })
    }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('records a worker decline only against that worker active assignment and reopens staffing', async () => {
    const assignment = {
      _id: '507f191e810c19729de860e1',
      assignee: assignedWorker._id,
      assignedBy: utilityProvider._id,
      active: true,
      status: 'pending'
    };
    const workOrder = pendingWorkOrder({
      assignedTo: assignedWorker._id,
      assignedBy: utilityProvider._id,
      currentAssignment: assignment._id,
      assignmentState: 'pending',
      assignments: [assignment]
    });
    const updated = {
      ...workOrder,
      assignedTo: null,
      assignedBy: null,
      currentAssignment: null,
      assignmentState: 'declined',
      assignments: [{ ...assignment, active: false, status: 'declined' }]
    };
    WorkOrder.findOne.mockReturnValue(scopedQuery(workOrder));
    WorkOrder.findOneAndUpdate.mockResolvedValue(updated);
    Incident.findById.mockReturnValue(scopedQuery({ status: 'repair_assigned' }));
    Incident.findOneAndUpdate.mockResolvedValue({});
    Incident.findByIdAndUpdate.mockResolvedValue(null);
    User.findByIdAndUpdate.mockResolvedValue(null);
    const res = response();

    await declineWorkOrder({
      params: { id: workOrder._id },
      body: { reason: 'Safety issue', notes: 'Needs different equipment.' },
      user: assignedWorker,
      headers: {}
    }, res, jest.fn());

    expect(WorkOrder.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: workOrder._id,
        assignedTo: assignedWorker._id,
        currentAssignment: assignment._id,
        assignmentState: 'pending',
        status: 'pending'
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          assignedTo: null,
          assignedBy: null,
          currentAssignment: null,
          assignmentState: 'declined'
        })
      }),
      expect.objectContaining({
        arrayFilters: [{ 'active._id': assignment._id, 'active.active': true }]
      })
    );
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(assignedWorker._id, { availability: 'available' });
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ recipient: utilityProvider._id }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('keeps an accepted order accepted when the provider reassigns it before work starts', async () => {
    const oldAssignment = {
      _id: '507f191e810c19729de860e1',
      assignee: assignedWorker._id,
      assignedBy: utilityProvider._id,
      active: true,
      status: 'accepted'
    };
    const replacement = {
      _id: '507f191e810c19729de860a4',
      role: 'repair_personnel',
      isActive: true,
      availability: 'available',
      repairOrganization: 'Dagupan Water District',
      barangay: 'Poblacion Oeste'
    };
    const workOrder = pendingWorkOrder({
      status: 'accepted',
      assignmentState: 'accepted',
      assignedTo: assignedWorker._id,
      assignedBy: utilityProvider._id,
      currentAssignment: oldAssignment._id,
      acceptedAt: new Date('2026-08-19T00:00:00.000Z'),
      assignments: [oldAssignment]
    });
    WorkOrder.findOne.mockReturnValue(scopedQuery(workOrder));
    User.findById.mockResolvedValue(replacement);
    WorkOrder.findOneAndUpdate.mockResolvedValue({ ...workOrder, assignedTo: replacement._id, status: 'accepted', assignmentState: 'accepted' });
    Incident.findById.mockReturnValue(scopedQuery({ status: 'repair_assigned' }));
    Incident.findOneAndUpdate.mockResolvedValue({});
    Incident.findByIdAndUpdate.mockResolvedValue(null);
    User.findByIdAndUpdate.mockResolvedValue(null);
    const res = response();

    await reassignWorkOrder({
      params: { id: workOrder._id },
      body: { assigneeId: replacement._id, reason: 'Original worker was reassigned to an emergency.' },
      user: utilityProvider,
      headers: {}
    }, res, jest.fn());

    expect(WorkOrder.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: workOrder._id,
        status: 'accepted', startedAt: null, actualStartTime: null, version: workOrder.version
      }),
      expect.objectContaining({
        $set: expect.objectContaining({ status: 'accepted', acceptedAt: expect.any(Date), assignmentState: 'accepted' })
      }),
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('rejects a mismatched progress stage before uploading evidence or mutating progress', async () => {
    const assignment = {
      _id: '507f191e810c19729de860e1',
      assignee: assignedWorker._id,
      assignedBy: utilityProvider._id,
      active: true,
      status: 'accepted'
    };
    const workOrder = pendingWorkOrder({
      assignedTo: assignedWorker._id,
      assignedBy: utilityProvider._id,
      currentAssignment: assignment._id,
      assignmentState: 'accepted',
      assignments: [assignment],
      status: 'in_progress',
      progressPercent: 25,
      progressStage: 'site_preparation'
    });
    WorkOrder.findOne.mockReturnValue(scopedQuery(workOrder));
    const res = response();

    await updateProgress({
      params: { id: workOrder._id },
      body: {
        progressPercent: 50,
        stage: 'finishing',
        notes: 'Repair team has started the main repair.'
      },
      files: [],
      user: assignedWorker
    }, res, jest.fn());

    expect(WorkOrder.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: "Repair stage must be 'main_repair' for 50% progress"
    }));
  });

  test('saves a field note at the current progress without completing or freeing the worker', async () => {
    const assignment = { _id: '507f191e810c19729de860e1', assignee: assignedWorker._id,
      assignedBy: utilityProvider._id, active: true, status: 'accepted' };
    const workOrder = pendingWorkOrder({ status: 'in_progress', assignmentState: 'accepted',
      assignedTo: assignedWorker._id, assignedBy: utilityProvider._id,
      currentAssignment: assignment._id, assignments: [assignment],
      progressPercent: 0, progressStage: 'assigned' });
    WorkOrder.findOne.mockReturnValue(scopedQuery(workOrder));
    WorkOrder.findOneAndUpdate.mockResolvedValue(workOrder);
    Incident.findById.mockReturnValue(scopedQuery({ status: 'in_progress' }));
    Incident.findOneAndUpdate.mockResolvedValue({});
    Incident.findByIdAndUpdate.mockResolvedValue(null);
    const res = response();
    await updateProgress({ params: { id: workOrder._id },
      body: { updateType: 'note', progressPercent: 0, stage: 'assigned',
        notes: 'Repair area secured.', location: { coordinates: [120.3387, 16.0433] } },
      files: [], user: assignedWorker, headers: {} }, res, jest.fn());
    expect(WorkOrder.findOneAndUpdate).toHaveBeenCalledWith(expect.any(Object),
      expect.objectContaining({ $set: expect.objectContaining({ status: 'in_progress', progressPercent: 0 }),
        $push: expect.objectContaining({ progressUpdates: expect.objectContaining({ notes: 'Repair area secured.' }) }) }),
      { new: true });
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('requires final evidence before Repair Personnel can submit 100% completion', async () => {
    const assignment = {
      _id: '507f191e810c19729de860e1',
      assignee: assignedWorker._id,
      assignedBy: utilityProvider._id,
      active: true,
      status: 'accepted'
    };
    const workOrder = pendingWorkOrder({
      status: 'in_progress',
      assignmentState: 'accepted',
      assignedTo: assignedWorker._id,
      assignedBy: utilityProvider._id,
      currentAssignment: assignment._id,
      assignments: [assignment],
      progressPercent: 75,
      progressStage: 'finishing'
    });
    WorkOrder.findOne.mockReturnValue(scopedQuery(workOrder));
    const res = response();

    await updateProgress({
      params: { id: workOrder._id },
      body: {
        progressPercent: 100,
        stage: 'ready_for_completion',
        notes: 'Repair work is complete and ready for review.',
        location: { coordinates: [120.3387, 16.0433] }
      },
      files: [],
      user: assignedWorker
    }, res, jest.fn());

    expect(WorkOrder.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Final post-maintenance evidence is required before submitting completion'
    }));
  });

  test('links later field evidence to its existing progress update atomically', async () => {
    const progressUpdate = { _id: '507f191e810c19729de860e2', evidence: [] };
    const assignment = {
      _id: '507f191e810c19729de860e1',
      assignee: assignedWorker._id,
      assignedBy: utilityProvider._id,
      active: true,
      status: 'accepted'
    };
    const workOrder = pendingWorkOrder({
      status: 'in_progress',
      assignmentState: 'accepted',
      assignedTo: assignedWorker._id,
      assignedBy: utilityProvider._id,
      currentAssignment: assignment._id,
      assignments: [assignment],
      progressPercent: 50,
      progressStage: 'main_repair',
      progressUpdates: [progressUpdate]
    });
    WorkOrder.findOne.mockReturnValue(scopedQuery(workOrder));
    processAndUploadRepairEvidence.mockResolvedValue([{
      key: 'work-orders/example/repair/example/photo.jpg',
      url: null,
      mimeType: 'image/jpeg',
      size: 123,
      checksum: 'abc',
      uploadedBy: assignedWorker._id,
      uploadedAt: new Date()
    }]);
    WorkOrder.findOneAndUpdate.mockResolvedValue(workOrder);
    const res = response();

    await uploadRepairEvidence({
      params: { id: workOrder._id },
      body: { progressUpdateId: progressUpdate._id, caption: 'Surface preparation complete.' },
      files: [{ originalname: 'photo.jpg' }],
      user: assignedWorker,
      headers: {}
    }, res, jest.fn());

    expect(WorkOrder.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ currentAssignment: assignment._id, status: 'in_progress' }),
      expect.objectContaining({
        $set: expect.objectContaining({
          repairEvidence: [expect.objectContaining({ key: 'work-orders/example/repair/example/photo.jpg' })],
          'progressUpdates.$[progress].evidence': [expect.anything()]
        })
      }),
      expect.objectContaining({ arrayFilters: [{ 'progress._id': progressUpdate._id }] })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
