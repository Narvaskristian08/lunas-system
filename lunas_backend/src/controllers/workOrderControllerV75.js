const mongoose = require('mongoose');
const WorkOrder = require('../models/WorkOrder');
const Incident = require('../models/Incident');
const User = require('../models/User');
const { createAuditLog } = require('../utils/auditLogger');
const { createNotification, notificationTemplates } = require('../services/notificationService');
const { processAndUploadRepairEvidence, cleanupEvidence } = require('../services/evidenceService');
const { getEvidenceUrl } = require('../services/storageService');
const asyncHandler = require('../middleware/asyncHandler');
const {
  ACTIVE_WORK_ORDER_STATUSES,
  REPAIR_PERSONNEL_ROLE,
  buildWorkOrderScope,
  canAccessWorkOrder,
  canManageWorkOrder,
  getSlaProjection,
  isEligibleRepairPersonnel,
  sameId,
  transitionMessage,
  validateProgressUpdate,
  workOrderHistoryEntry
} = require('../services/workOrderService');
const { normalizeText } = require('../services/jurisdictionService');

const MAX_PAGE_SIZE = 100;
const SAFE_USER_FIELDS = 'firstName lastName role repairTeam availability';
const SAFE_INCIDENT_FIELDS = [
  'reportNumber',
  'category',
  'description',
  'location',
  'images',
  'priority',
  'status',
  'routing',
  'jurisdiction',
  'sla',
  'workOrder',
  'statusHistory'
].join(' ');

const getId = (value) => (value && (value._id || value) ? (value._id || value).toString() : undefined);
const toPlain = (value) => (value && value.toObject ? value.toObject() : value);
const pageNumber = (value) => Math.max(1, Number.parseInt(value, 10) || 1);
const pageSize = (value) => Math.min(MAX_PAGE_SIZE, Math.max(1, Number.parseInt(value, 10) || 20));
const fail = (res, status, message) => res.status(status).json({ success: false, message });
const activeWorkOrder = (workOrder) => ACTIVE_WORK_ORDER_STATUSES.includes(workOrder.status);
const duplicateKey = (error) => Boolean(error && error.code === 11000);

const populateWorkOrder = (query, includeIncident = true) => {
  if (includeIncident) query.populate('incident', SAFE_INCIDENT_FIELDS);
  return query
    .populate('assignedTo', SAFE_USER_FIELDS)
    .populate('assignedBy', SAFE_USER_FIELDS)
    .populate('createdBy', SAFE_USER_FIELDS)
    .populate('assignments.assignee', SAFE_USER_FIELDS)
    .populate('assignments.assignedBy', SAFE_USER_FIELDS);
};

const safePerson = (person) => {
  if (!person) return null;
  const source = toPlain(person);
  return {
    id: getId(source),
    firstName: source.firstName,
    lastName: source.lastName,
    role: source.role,
    team: source.repairTeam,
    availability: source.availability
  };
};

const safeEvidence = async (entry) => {
  const source = toPlain(entry);
  let url = source.url || null;
  if (source.key) {
    try {
      url = await getEvidenceUrl(source.key, source.url);
    } catch (_error) {
      // A local deployment may not have private storage configured. Never
      // reveal object keys or fabricate a signed URL in that situation.
      url = source.url || null;
    }
  }
  return {
    id: getId(source),
    url,
    mimeType: source.mimeType,
    size: source.size,
    checksum: source.checksum,
    width: source.width,
    height: source.height,
    uploadedAt: source.uploadedAt,
    caption: source.caption,
    progressUpdateId: getId(source.progressUpdate)
  };
};

const safeAssignment = (assignment) => {
  const source = toPlain(assignment);
  return {
    id: getId(source),
    assignee: safePerson(source.assignee),
    assignedBy: safePerson(source.assignedBy),
    assignedAt: source.assignedAt,
    status: source.status,
    acceptedAt: source.acceptedAt,
    declinedAt: source.declinedAt,
    declineReason: source.declineReason,
    declineNotes: source.declineNotes,
    endedAt: source.endedAt,
    endedReason: source.endedReason,
    active: source.active
  };
};

const safeIncident = async (incident) => {
  if (!incident) return null;
  const source = toPlain(incident);
  return {
    id: getId(source),
    reportNumber: source.reportNumber,
    category: source.category,
    description: source.description,
    location: source.location,
    priority: source.priority,
    status: source.status,
    images: await Promise.all((source.images || []).map(safeEvidence))
  };
};

const serializeWorkOrder = async (workOrder, detail = true) => {
  const source = toPlain(workOrder);
  const projection = getSlaProjection(source.sla);
  const activeAssignment = (source.assignments || []).find(
    (assignment) => getId(assignment._id) === getId(source.currentAssignment)
  );
  const result = {
    id: getId(source),
    reference: source.orderNumber,
    priority: source.priority,
    status: source.status,
    assignmentState: source.assignmentState,
    responsibleOrganization: source.responsibleOrganization,
    responsibleRole: source.responsibleRole,
    jurisdiction: source.jurisdiction,
    instructions: source.instructions,
    progressPercent: source.progressPercent,
    progressStage: source.progressStage,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    acceptedAt: source.acceptedAt,
    startedAt: source.startedAt,
    readyForCompletionAt: source.readyForCompletionAt,
    version: source.version,
    assignee: safePerson(source.assignedTo),
    assignedBy: safePerson(source.assignedBy),
    currentAssignment: activeAssignment ? safeAssignment(activeAssignment) : null,
    sla: {
      targetResolutionTime: source.sla && source.sla.targetResolutionTime,
      startedAt: source.sla && source.sla.startedAt,
      deadline: projection.deadline,
      state: source.status === 'completed' ? 'met' : projection.state,
      isOverdue: source.status !== 'completed' && projection.isOverdue,
      isApproaching: source.status !== 'completed' && projection.isApproaching,
      remainingMilliseconds: projection.remainingMilliseconds
    },
    incident: await safeIncident(source.incident)
  };
  if (!detail) return result;
  result.assignments = (source.assignments || []).map(safeAssignment);
  result.evidence = await Promise.all((source.repairEvidence || []).map(safeEvidence));
  result.progressUpdates = (source.progressUpdates || []).map((entry) => {
    const update = toPlain(entry);
    return {
      id: getId(update),
      previousPercent: update.previousPercent,
      progressPercent: update.progressPercent,
      stage: update.stage,
      notes: update.notes,
      evidence: (update.evidence || []).map(getId),
      location: update.location,
      updatedAt: update.updatedAt
    };
  });
  result.history = (source.history || []).map((entry) => {
    const history = toPlain(entry);
    return {
      id: getId(history),
      type: history.type,
      status: history.status,
      progressPercent: history.progressPercent,
      stage: history.stage,
      notes: history.notes,
      actorRole: history.actorRole,
      createdAt: history.createdAt
    };
  });
  return result;
};

const incidentCanCreateWorkOrder = (incident, user) => {
  if (!incident || incident.status !== 'validated') return false;
  if (!incident.routing || !incident.routing.responsibleOrganization || !incident.routing.responsibleRole) return false;
  if (user.role === 'admin' || user.role === 'city_engineer') return true;
  if (user.role === 'barangay_official') {
    const barangay = normalizeText((incident.jurisdiction && incident.jurisdiction.barangay)
      || (incident.location && incident.location.address && incident.location.address.barangay));
    return barangay === normalizeText(user.barangay);
  }
  return user.role === 'utility_provider'
    && normalizeText(incident.routing.responsibleOrganization) === normalizeText(user.utilityCompany);
};

const updateIncidentForWorkOrder = async ({ incidentId, status, actor, notes, metadata }) => {
  await Incident.findByIdAndUpdate(incidentId, {
    $set: { status },
    $push: {
      statusHistory: {
        status,
        changedBy: actor._id || actor,
        actorRole: actor.role,
        changedAt: new Date(),
        notes,
        metadata: metadata || {}
      }
    }
  });
};

const notify = async (recipient, template, workOrder) => {
  if (!recipient) return;
  await createNotification({
    recipient: recipient._id || recipient,
    ...template,
    data: {
      incidentId: workOrder.incident && workOrder.incident._id ? workOrder.incident._id : workOrder.incident,
      workOrderId: workOrder._id,
      link: '/work-orders/' + workOrder._id
    }
  });
};

const setAvailability = async (personnelId, availability) => {
  if (personnelId) await User.findByIdAndUpdate(personnelId, { availability });
};

const findScopedWorkOrder = (req, id, includeIncident = true) => {
  const scope = buildWorkOrderScope(req.user);
  return populateWorkOrder(WorkOrder.findOne({ _id: id, ...scope }), includeIncident);
};

const listFilter = async (req) => {
  const filter = { ...buildWorkOrderScope(req.user) };
  const query = req.query || {};
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.assignmentStatus) filter.assignmentState = query.assignmentStatus;
  if (query.personnel && ['admin', 'city_engineer', 'barangay_official', 'utility_provider'].includes(req.user.role)) {
    filter.assignedTo = query.personnel;
  }
  if (query.organization && ['admin', 'city_engineer'].includes(req.user.role)) {
    filter.responsibleOrganization = query.organization;
  }
  if (query.progress !== undefined) filter.progressPercent = Number(query.progress);
  if (query.search) filter.orderNumber = { $regex: String(query.search).trim(), $options: 'i' };
  if (query.category) {
    const incidents = await Incident.find({ category: query.category }).select('_id');
    filter.incident = { $in: incidents.map((incident) => incident._id) };
  }
  const now = new Date();
  const thresholdHours = Number.parseInt(process.env.SLA_APPROACHING_THRESHOLD_HOURS, 10) || 24;
  if (query.slaState === 'overdue') {
    filter['sla.deadline'] = { $lt: now };
    filter.status = { $in: ACTIVE_WORK_ORDER_STATUSES };
  } else if (query.slaState === 'approaching') {
    filter['sla.deadline'] = {
      $gte: now,
      $lte: new Date(now.getTime() + thresholdHours * 60 * 60 * 1000)
    };
    filter.status = { $in: ACTIVE_WORK_ORDER_STATUSES };
  }
  return filter;
};

exports.createWorkOrder = asyncHandler(async (req, res) => {
  const incidentId = (req.params && (req.params.incidentId || req.params.id)) || req.body.incident;
  const incident = await Incident.findById(incidentId);
  if (!incident) return fail(res, 404, 'Incident not found');
  if (!incidentCanCreateWorkOrder(incident, req.user)) {
    return fail(
      res,
      incident.status === 'validated' ? 403 : 409,
      incident.status === 'validated'
        ? 'Not authorized to create a work order for this incident'
        : 'Only a validated, routed incident can create a work order'
    );
  }
  const existing = await WorkOrder.findOne({ incident: incident._id });
  if (existing) return fail(res, 409, 'A primary work order already exists for this incident');

  const now = new Date();
  let workOrder;
  try {
    workOrder = await WorkOrder.create({
      incident: incident._id,
      responsibleOrganization: incident.routing.responsibleOrganization,
      responsibleRole: incident.routing.responsibleRole,
      jurisdiction: {
        barangay: (incident.jurisdiction && incident.jurisdiction.barangay)
          || (incident.location && incident.location.address && incident.location.address.barangay),
        city: (incident.jurisdiction && incident.jurisdiction.city)
          || (incident.location && incident.location.address && incident.location.address.city)
          || 'Dagupan City'
      },
      priority: incident.priority,
      createdBy: req.user._id,
      instructions: req.body.instructions,
      status: 'pending',
      assignmentState: 'unassigned',
      progressPercent: 0,
      progressStage: 'assigned',
      sla: {
        targetResolutionTime: incident.sla && incident.sla.targetResolutionTime,
        startedAt: incident.sla && incident.sla.startedAt,
        deadline: incident.sla && incident.sla.deadline,
        state: incident.sla && incident.sla.deadline ? 'active' : 'not_started',
        isOverdue: false
      },
      history: [workOrderHistoryEntry({
        type: 'created',
        actor: req.user,
        status: 'pending',
        progressPercent: 0,
        stage: 'assigned',
        notes: 'Work order created from validated incident',
        now
      })]
    });
  } catch (error) {
    if (duplicateKey(error)) return fail(res, 409, 'A primary work order already exists for this incident');
    throw error;
  }

  // Claim the incident with a conditional update. If the write itself fails,
  // remove the just-created work order so a transient storage/database error
  // cannot leave an orphan blocking a later legitimate create attempt.
  let claimed;
  try {
    claimed = await Incident.findOneAndUpdate(
      {
        _id: incident._id,
        status: 'validated',
        $or: [{ workOrder: null }, { workOrder: { $exists: false } }]
      },
      {
        $set: { workOrder: workOrder._id },
        $push: {
          statusHistory: {
            status: 'validated',
            changedBy: req.user._id,
            actorRole: req.user.role,
            changedAt: now,
            notes: 'Work order ' + workOrder.orderNumber + ' created and awaiting assignment',
            metadata: { workOrderId: workOrder._id, event: 'work_order_created' }
          }
        }
      },
      { new: true }
    );
  } catch (error) {
    await workOrder.deleteOne();
    throw error;
  }
  if (!claimed) {
    await workOrder.deleteOne();
    return fail(res, 409, 'This incident changed before the work order could be created');
  }
  await createAuditLog({
    action: 'work_order_created',
    performedBy: req.user._id,
    resourceType: 'WorkOrder',
    resourceId: workOrder._id,
    details: { orderNumber: workOrder.orderNumber, incidentId: incident._id },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  return res.status(201).json({
    success: true,
    message: 'Work order created and ready for assignment',
    data: await serializeWorkOrder(workOrder)
  });
});

exports.getWorkOrders = asyncHandler(async (req, res) => {
  const page = pageNumber(req.query.page);
  const limit = pageSize(req.query.limit);
  const filter = await listFilter(req);
  const sorts = {
    newest: '-updatedAt',
    oldest: 'createdAt',
    deadline: 'sla.deadline',
    '-deadline': '-sla.deadline',
    priority: 'priority',
    '-priority': '-priority',
    progress: 'progressPercent',
    '-progress': '-progressPercent'
  };
  const sort = sorts[req.query.sortBy] || '-updatedAt';
  const result = await Promise.all([
    populateWorkOrder(WorkOrder.find(filter), true).sort(sort).limit(limit).skip((page - 1) * limit),
    WorkOrder.countDocuments(filter)
  ]);
  const workOrders = result[0];
  const total = result[1];
  return res.status(200).json({
    success: true,
    data: await Promise.all(workOrders.map((workOrder) => serializeWorkOrder(workOrder, false))),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

exports.getMyWorkOrders = exports.getWorkOrders;

exports.getWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await findScopedWorkOrder(req, req.params.id);
  if (!workOrder || !canAccessWorkOrder(req.user, workOrder)) return fail(res, 404, 'Work order not found');
  return res.status(200).json({ success: true, data: await serializeWorkOrder(workOrder) });
});

exports.getAssignments = asyncHandler(async (req, res) => {
  const workOrder = await findScopedWorkOrder(req, req.params.id, false);
  if (!workOrder || !canManageWorkOrder(req.user, workOrder)) return fail(res, 404, 'Work order not found');
  return res.status(200).json({ success: true, data: (workOrder.assignments || []).map(safeAssignment) });
});

exports.getEligiblePersonnel = asyncHandler(async (req, res) => {
  const workOrder = await findScopedWorkOrder(req, req.params.id, false);
  if (!workOrder || !canManageWorkOrder(req.user, workOrder)) return fail(res, 404, 'Work order not found');
  const filter = {
    role: REPAIR_PERSONNEL_ROLE,
    isActive: true,
    availability: 'available'
  };
  if (workOrder.jurisdiction && workOrder.jurisdiction.barangay) {
    filter.$or = [
      { barangay: workOrder.jurisdiction.barangay },
      { barangay: { $exists: false } },
      { barangay: null }
    ];
  }
  // Organization comparison is normalized in isEligibleRepairPersonnel. Do
  // not make this preliminary query case-sensitive and accidentally hide an
  // otherwise compatible worker; only the post-check filtered set is sent.
  const personnel = await User.find(filter)
    .select('firstName lastName role repairOrganization repairTeam availability barangay expertise');
  return res.status(200).json({
    success: true,
    data: personnel.filter((person) => isEligibleRepairPersonnel(person, workOrder)).map((person) => ({
      id: getId(person),
      firstName: person.firstName,
      lastName: person.lastName,
      role: person.role,
      organization: person.repairOrganization,
      team: person.repairTeam,
      availability: person.availability,
      expertise: person.expertise || []
    }))
  });
});

const assign = async (req, res, reassign) => {
  const workOrder = await findScopedWorkOrder(req, req.params.id, false);
  if (!workOrder || !canManageWorkOrder(req.user, workOrder)) return fail(res, 404, 'Work order not found');
  if (!activeWorkOrder(workOrder)) return fail(res, 409, transitionMessage(workOrder.status, 'assign'));

  const activeAssignment = (workOrder.assignments || []).find(
    (assignment) => getId(assignment._id) === getId(workOrder.currentAssignment) && assignment.active
  );
  if (reassign && !activeAssignment) return fail(res, 409, 'This work order has no active assignment to reassign');
  if (!reassign && activeAssignment) return fail(res, 409, 'This work order already has an active assignment; use reassignment');

  const assignee = await User.findById(req.body.assigneeId || req.body.assignedTo);
  if (!assignee) return fail(res, 404, 'Repair personnel not found');
  if (!isEligibleRepairPersonnel(assignee, workOrder)) {
    return fail(res, 400, 'The selected repair personnel is not eligible for this work order');
  }
  const reason = String(req.body.reason || '').trim();
  if (reassign && !reason) return fail(res, 400, 'A reassignment reason is required');

  const now = new Date();
  const assignmentId = new mongoose.Types.ObjectId();
  // A not-yet-started accepted order returns to pending acceptance for the
  // new worker. An in-progress handoff stays in progress, but still requires
  // the new current assignment to accept before it can submit progress.
  const statusAfterAssignment = reassign && workOrder.status === 'accepted'
    ? 'pending'
    : workOrder.status;
  const assignment = {
    _id: assignmentId,
    assignee: assignee._id,
    assignedBy: req.user._id,
    assignedAt: now,
    status: 'pending',
    active: true
  };
  const update = {
    $set: {
      assignedTo: assignee._id,
      assignedBy: req.user._id,
      assignedAt: now,
      currentAssignment: assignmentId,
      assignmentState: 'pending',
      status: statusAfterAssignment,
      ...(reassign && workOrder.status === 'accepted' ? { acceptedAt: null } : {})
    },
    $push: {
      assignments: assignment,
      history: workOrderHistoryEntry({
        type: reassign ? 'reassigned' : 'assigned',
        actor: req.user,
        status: statusAfterAssignment,
        progressPercent: workOrder.progressPercent,
        stage: workOrder.progressStage,
        notes: reassign ? reason : 'Repair personnel assigned',
        assignment: assignmentId,
        metadata: {
          assigneeId: assignee._id,
          previousAssignmentId: activeAssignment && activeAssignment._id
        },
        now
      })
    },
    $inc: { version: 1 }
  };
  const options = { new: true };
  if (reassign) {
    // MongoDB cannot safely combine a positional update and a push against
    // the same array in one document update. Replace the historical array
    // atomically under the optimistic version predicate instead.
    const assignments = (workOrder.assignments || []).map((entry) => {
      const current = toPlain(entry);
      if (getId(current._id) !== getId(activeAssignment._id)) return current;
      return {
        ...current,
        active: false,
        status: 'reassigned',
        endedAt: now,
        endedReason: reason
      };
    });
    assignments.push(assignment);
    update.$set.assignments = assignments;
    delete update.$push.assignments;
  }
  const condition = {
    _id: workOrder._id,
    version: workOrder.version,
    status: { $in: ACTIVE_WORK_ORDER_STATUSES }
  };
  if (reassign) {
    condition.currentAssignment = activeAssignment._id;
    condition['assignments._id'] = activeAssignment._id;
    condition['assignments.active'] = true;
  } else {
    // A declined assignment intentionally leaves the work order pending and
    // available for a new normal assignment.
    condition.assignmentState = { $in: ['unassigned', 'declined'] };
  }
  const updated = await WorkOrder.findOneAndUpdate(condition, update, options);
  if (!updated) return fail(res, 409, 'The work-order assignment changed. Refresh and try again.');

  await setAvailability(assignee._id, 'assigned');
  if (reassign && activeAssignment && activeAssignment.assignee) {
    await setAvailability(activeAssignment.assignee, 'available');
  }
  await notify(assignee._id, notificationTemplates.workOrderAssigned(updated.orderNumber), updated);
  if (reassign && activeAssignment && activeAssignment.assignee) {
    await notify(activeAssignment.assignee, notificationTemplates.workOrderReassigned(updated.orderNumber), updated);
  }
  await updateIncidentForWorkOrder({
    incidentId: updated.incident,
    status: updated.status === 'in_progress' ? 'in_progress' : 'assigned',
    actor: req.user,
    notes: reassign ? 'Repair assignment reassigned' : 'Repair personnel assigned',
    metadata: { workOrderId: updated._id, assigneeId: assignee._id }
  });
  await createAuditLog({
    action: reassign ? 'work_order_reassigned' : 'work_order_assigned',
    performedBy: req.user._id,
    affectedUser: assignee._id,
    resourceType: 'WorkOrder',
    resourceId: updated._id,
    details: { assignmentId, assigneeId: assignee._id, reason: reassign ? reason : undefined },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  return res.status(200).json({
    success: true,
    message: reassign ? 'Work order reassigned' : 'Work order assigned',
    data: await serializeWorkOrder(updated)
  });
};

exports.assignWorkOrder = asyncHandler(async (req, res) => assign(req, res, false));
exports.reassignWorkOrder = asyncHandler(async (req, res) => assign(req, res, true));

exports.acceptWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await findScopedWorkOrder(req, req.params.id, false);
  if (!workOrder || !sameId(workOrder.assignedTo, req.user._id)) return fail(res, 404, 'Work order not found');
  if (workOrder.assignmentState !== 'pending' || !['pending', 'in_progress'].includes(workOrder.status)) {
    return fail(res, 409, transitionMessage(workOrder.status, 'accept'));
  }
  const assignment = (workOrder.assignments || []).find(
    (entry) => getId(entry._id) === getId(workOrder.currentAssignment)
      && entry.active && sameId(entry.assignee, req.user._id)
  );
  if (!assignment) return fail(res, 403, 'You do not have an active assignment for this work order');
  const now = new Date();
  const nextStatus = workOrder.status === 'pending' ? 'accepted' : 'in_progress';
  const updated = await WorkOrder.findOneAndUpdate(
    {
      _id: workOrder._id,
      version: workOrder.version,
      assignedTo: req.user._id,
      currentAssignment: assignment._id,
      assignmentState: 'pending',
      status: workOrder.status
    },
    {
      $set: {
        status: nextStatus,
        assignmentState: 'accepted',
        acceptedAt: now,
        'assignments.$[active].status': 'accepted',
        'assignments.$[active].acceptedAt': now
      },
      $push: {
        history: workOrderHistoryEntry({
          type: 'accepted',
          actor: req.user,
          status: nextStatus,
          progressPercent: workOrder.progressPercent,
          stage: workOrder.progressStage,
          assignment: assignment._id,
          now
        })
      },
      $inc: { version: 1 }
    },
    { new: true, arrayFilters: [{ 'active._id': assignment._id, 'active.active': true }] }
  );
  if (!updated) return fail(res, 409, 'The assignment changed. Refresh and try again.');
  await notify(assignment.assignedBy, notificationTemplates.workOrderAccepted(updated.orderNumber), updated);
  await createAuditLog({
    action: 'work_order_accepted',
    performedBy: req.user._id,
    resourceType: 'WorkOrder',
    resourceId: updated._id,
    details: { assignmentId: assignment._id },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  return res.status(200).json({
    success: true,
    message: 'Work order accepted',
    data: await serializeWorkOrder(updated)
  });
});

exports.declineWorkOrder = asyncHandler(async (req, res) => {
  const reason = String(req.body.reason || '').trim();
  const notes = String(req.body.notes || '').trim();
  if (reason.length < 2) return fail(res, 400, 'A decline reason is required');
  const workOrder = await findScopedWorkOrder(req, req.params.id, false);
  if (!workOrder || !sameId(workOrder.assignedTo, req.user._id)) return fail(res, 404, 'Work order not found');
  if (workOrder.status !== 'pending' || workOrder.assignmentState !== 'pending') {
    return fail(res, 409, 'Only a pending assignment can be declined');
  }
  const assignment = (workOrder.assignments || []).find(
    (entry) => getId(entry._id) === getId(workOrder.currentAssignment)
      && entry.active && sameId(entry.assignee, req.user._id)
  );
  if (!assignment) return fail(res, 403, 'You do not have an active assignment for this work order');
  const now = new Date();
  const updated = await WorkOrder.findOneAndUpdate(
    {
      _id: workOrder._id,
      version: workOrder.version,
      assignedTo: req.user._id,
      currentAssignment: assignment._id,
      assignmentState: 'pending',
      status: 'pending'
    },
    {
      $set: {
        assignedTo: null,
        assignedBy: null,
        currentAssignment: null,
        assignmentState: 'declined',
        'assignments.$[active].active': false,
        'assignments.$[active].status': 'declined',
        'assignments.$[active].declinedAt': now,
        'assignments.$[active].declineReason': reason,
        'assignments.$[active].declineNotes': notes || undefined,
        'assignments.$[active].endedAt': now,
        'assignments.$[active].endedReason': 'declined'
      },
      $push: {
        history: workOrderHistoryEntry({
          type: 'declined',
          actor: req.user,
          status: 'pending',
          progressPercent: workOrder.progressPercent,
          stage: workOrder.progressStage,
          notes: reason,
          assignment: assignment._id,
          metadata: { notes: notes || undefined },
          now
        })
      },
      $inc: { version: 1 }
    },
    { new: true, arrayFilters: [{ 'active._id': assignment._id, 'active.active': true }] }
  );
  if (!updated) return fail(res, 409, 'The assignment changed. Refresh and try again.');
  await setAvailability(req.user._id, 'available');
  await updateIncidentForWorkOrder({
    incidentId: updated.incident,
    status: 'validated',
    actor: req.user,
    notes: 'Repair assignment declined; awaiting reassignment',
    metadata: { workOrderId: updated._id }
  });
  await notify(assignment.assignedBy, notificationTemplates.workOrderDeclined(updated.orderNumber), updated);
  await createAuditLog({
    action: 'work_order_declined',
    performedBy: req.user._id,
    resourceType: 'WorkOrder',
    resourceId: updated._id,
    details: { assignmentId: assignment._id, reason },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  return res.status(200).json({
    success: true,
    message: 'Assignment declined; the work order is available for reassignment',
    data: await serializeWorkOrder(updated)
  });
});

exports.startWorkOrder = asyncHandler(async (req, res) => {
  const workOrder = await findScopedWorkOrder(req, req.params.id, false);
  if (!workOrder || !sameId(workOrder.assignedTo, req.user._id)) return fail(res, 404, 'Work order not found');
  if (workOrder.status !== 'accepted' || workOrder.assignmentState !== 'accepted') {
    return fail(res, 409, transitionMessage(workOrder.status, 'start'));
  }
  const assignment = (workOrder.assignments || []).find(
    (entry) => getId(entry._id) === getId(workOrder.currentAssignment)
      && entry.active && sameId(entry.assignee, req.user._id)
  );
  if (!assignment) return fail(res, 403, 'You do not have an active assignment for this work order');
  const now = new Date();
  const updated = await WorkOrder.findOneAndUpdate(
    {
      _id: workOrder._id,
      version: workOrder.version,
      assignedTo: req.user._id,
      currentAssignment: assignment._id,
      assignmentState: 'accepted',
      status: 'accepted'
    },
    {
      $set: { status: 'in_progress', startedAt: now, actualStartTime: now },
      $push: {
        history: workOrderHistoryEntry({
          type: 'started',
          actor: req.user,
          status: 'in_progress',
          progressPercent: workOrder.progressPercent,
          stage: workOrder.progressStage,
          assignment: assignment._id,
          now
        })
      },
      $inc: { version: 1 }
    },
    { new: true }
  );
  if (!updated) return fail(res, 409, 'The work order changed. Refresh and try again.');
  await updateIncidentForWorkOrder({
    incidentId: updated.incident,
    status: 'in_progress',
    actor: req.user,
    notes: 'Repair work started',
    metadata: { workOrderId: updated._id }
  });
  await notify(assignment.assignedBy, notificationTemplates.workOrderStarted(updated.orderNumber), updated);
  await createAuditLog({
    action: 'work_order_started',
    performedBy: req.user._id,
    resourceType: 'WorkOrder',
    resourceId: updated._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  return res.status(200).json({
    success: true,
    message: 'Repair work started',
    data: await serializeWorkOrder(updated)
  });
});

const parseObject = (value) => {
  if (!value || typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
};

const repairFiles = async (req, workOrderId) => {
  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length) return [];
  return processAndUploadRepairEvidence(files, { workOrderId, uploaderId: req.user._id });
};

const validLocation = (location) => {
  if (!location || !location.coordinates) return true;
  if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) return false;
  const longitude = Number(location.coordinates[0]);
  const latitude = Number(location.coordinates[1]);
  return Number.isFinite(longitude) && Number.isFinite(latitude)
    && longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90;
};

exports.updateProgress = asyncHandler(async (req, res) => {
  const workOrder = await findScopedWorkOrder(req, req.params.id, false);
  if (!workOrder || !sameId(workOrder.assignedTo, req.user._id)) return fail(res, 404, 'Work order not found');
  if (workOrder.status !== 'in_progress' || workOrder.assignmentState !== 'accepted') {
    return fail(res, 409, transitionMessage(workOrder.status, 'progress'));
  }
  const assignment = (workOrder.assignments || []).find(
    (entry) => getId(entry._id) === getId(workOrder.currentAssignment)
      && entry.active && sameId(entry.assignee, req.user._id)
  );
  if (!assignment) return fail(res, 403, 'You do not have an active assignment for this work order');
  const notes = String(req.body.notes || '').trim();
  const progress = validateProgressUpdate({
    currentProgress: workOrder.progressPercent,
    nextProgress: req.body.progressPercent,
    stage: String(req.body.stage || '').trim(),
    notes
  });
  if (!progress.valid) return fail(res, 400, progress.message);
  const location = parseObject(req.body.location);
  if (!validLocation(location)) return fail(res, 400, 'Repair location must contain valid longitude and latitude');

  let uploads = [];
  try {
    uploads = await repairFiles(req, workOrder._id);
    const now = new Date();
    const progressUpdateId = new mongoose.Types.ObjectId();
    const evidence = uploads.map((entry) => ({
      ...entry,
      _id: new mongoose.Types.ObjectId(),
      progressUpdate: progressUpdateId
    }));
    const completed = progress.progressPercent === 100;
    const nextStatus = completed ? 'completed' : 'in_progress';
    const updated = await WorkOrder.findOneAndUpdate(
      {
        _id: workOrder._id,
        version: workOrder.version,
        assignedTo: req.user._id,
        currentAssignment: assignment._id,
        assignmentState: 'accepted',
        status: 'in_progress',
        progressPercent: workOrder.progressPercent
      },
      {
        $set: {
          status: nextStatus,
          progressPercent: progress.progressPercent,
          progressStage: progress.stage,
          ...(completed ? {
            readyForCompletionAt: now,
            actualCompletionTime: now,
            'sla.state': 'met',
            'sla.isOverdue': false
          } : {})
        },
        $push: {
          progressUpdates: {
            _id: progressUpdateId,
            previousPercent: workOrder.progressPercent,
            progressPercent: progress.progressPercent,
            stage: progress.stage,
            notes,
            evidence: evidence.map((entry) => entry._id),
            location: location && location.coordinates ? {
              type: 'Point',
              coordinates: location.coordinates.map(Number)
            } : undefined,
            updatedBy: req.user._id,
            updatedAt: now
          },
          repairEvidence: { $each: evidence },
          history: workOrderHistoryEntry({
            type: completed ? 'ready_for_completion' : 'progress',
            actor: req.user,
            status: nextStatus,
            progressPercent: progress.progressPercent,
            stage: progress.stage,
            notes,
            assignment: assignment._id,
            metadata: { evidenceCount: evidence.length },
            now
          })
        },
        $inc: { version: 1 }
      },
      { new: true }
    );
    if (!updated) {
      await cleanupEvidence(uploads);
      return fail(res, 409, 'The repair progress changed. Refresh and try again.');
    }
    if (completed) await setAvailability(req.user._id, 'available');
    await updateIncidentForWorkOrder({
      incidentId: updated.incident,
      status: completed ? 'completed' : 'in_progress',
      actor: req.user,
      notes: completed
        ? 'Repair reached 100% and is awaiting formal completion verification'
        : 'Repair progress updated to ' + progress.progressPercent + '%',
      metadata: {
        workOrderId: updated._id,
        progressPercent: progress.progressPercent,
        stage: progress.stage
      }
    });
    await notify(
      assignment.assignedBy,
      completed
        ? notificationTemplates.workOrderCompleted(updated.orderNumber)
        : notificationTemplates.workOrderProgress(updated.orderNumber, progress.progressPercent),
      updated
    );
    await createAuditLog({
      action: 'work_order_progress_updated',
      performedBy: req.user._id,
      resourceType: 'WorkOrder',
      resourceId: updated._id,
      details: {
        progressPercent: progress.progressPercent,
        stage: progress.stage,
        evidenceCount: evidence.length
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    if (evidence.length) {
      await createAuditLog({
        action: 'repair_evidence_uploaded',
        performedBy: req.user._id,
        resourceType: 'WorkOrder',
        resourceId: updated._id,
        details: { evidenceCount: evidence.length, progressUpdateId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }
    return res.status(200).json({
      success: true,
      message: completed
        ? 'Repair reached 100% and is ready for completion verification'
        : 'Repair progress updated',
      data: await serializeWorkOrder(updated)
    });
  } catch (error) {
    await cleanupEvidence(uploads);
    throw error;
  }
});

exports.uploadRepairEvidence = asyncHandler(async (req, res) => {
  const workOrder = await findScopedWorkOrder(req, req.params.id, false);
  if (!workOrder || !sameId(workOrder.assignedTo, req.user._id)) return fail(res, 404, 'Work order not found');
  if (workOrder.status !== 'in_progress' || workOrder.assignmentState !== 'accepted') {
    return fail(res, 409, transitionMessage(workOrder.status, 'progress'));
  }
  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length) return fail(res, 400, 'At least one repair evidence image is required');
  const requestedProgressUpdateId = String(req.body.progressUpdateId || '').trim();
  let progressUpdate = null;
  if (requestedProgressUpdateId) {
    if (!mongoose.isValidObjectId(requestedProgressUpdateId)) {
      return fail(res, 400, 'Progress update reference is invalid');
    }
    progressUpdate = (workOrder.progressUpdates || []).find(
      (entry) => getId(entry._id) === requestedProgressUpdateId
    );
    if (!progressUpdate) return fail(res, 404, 'Progress update not found for this work order');
  }

  let uploads = [];
  try {
    uploads = await repairFiles(req, workOrder._id);
    const now = new Date();
    const evidence = uploads.map((entry) => ({
      ...entry,
      _id: new mongoose.Types.ObjectId(),
      ...(progressUpdate ? { progressUpdate: progressUpdate._id } : {})
    }));
    const push = {
      repairEvidence: { $each: evidence },
      history: workOrderHistoryEntry({
        type: 'evidence_uploaded',
        actor: req.user,
        status: workOrder.status,
        progressPercent: workOrder.progressPercent,
        stage: workOrder.progressStage,
        notes: String(req.body.caption || '').trim() || undefined,
        metadata: {
          evidenceCount: evidence.length,
          ...(progressUpdate ? { progressUpdateId: progressUpdate._id } : {})
        },
        now
      })
    };
    const options = { new: true };
    if (progressUpdate) {
      // Keep the durable evidence record and the append-only progress event
      // connected in the same guarded write.
      push['progressUpdates.$[progress].evidence'] = { $each: evidence.map((entry) => entry._id) };
      options.arrayFilters = [{ 'progress._id': progressUpdate._id }];
    }
    const updated = await WorkOrder.findOneAndUpdate(
      {
        _id: workOrder._id,
        version: workOrder.version,
        assignedTo: req.user._id,
        currentAssignment: workOrder.currentAssignment,
        assignmentState: 'accepted',
        status: 'in_progress'
      },
      { $push: push, $inc: { version: 1 } },
      options
    );
    if (!updated) {
      await cleanupEvidence(uploads);
      return fail(res, 409, 'The work order changed. Refresh and retry the upload.');
    }
    await createAuditLog({
      action: 'repair_evidence_uploaded',
      performedBy: req.user._id,
      resourceType: 'WorkOrder',
      resourceId: updated._id,
      details: {
        evidenceCount: evidence.length,
        ...(progressUpdate ? { progressUpdateId: progressUpdate._id } : {})
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    return res.status(201).json({
      success: true,
      message: 'Repair evidence uploaded',
      data: await Promise.all(evidence.map(safeEvidence))
    });
  } catch (error) {
    await cleanupEvidence(uploads);
    throw error;
  }
});

exports.getProgress = asyncHandler(async (req, res) => {
  const workOrder = await findScopedWorkOrder(req, req.params.id, false);
  if (!workOrder || !canAccessWorkOrder(req.user, workOrder)) return fail(res, 404, 'Work order not found');
  return res.status(200).json({
    success: true,
    data: (workOrder.progressUpdates || []).map((entry) => {
      const update = toPlain(entry);
      return {
        id: getId(update),
        previousPercent: update.previousPercent,
        progressPercent: update.progressPercent,
        stage: update.stage,
        notes: update.notes,
        location: update.location,
        updatedAt: update.updatedAt
      };
    })
  });
});

exports.getWorkOrderSLA = asyncHandler(async (req, res) => {
  const workOrder = await findScopedWorkOrder(req, req.params.id, false);
  if (!workOrder || !canAccessWorkOrder(req.user, workOrder)) return fail(res, 404, 'Work order not found');
  const projection = getSlaProjection(workOrder.sla);
  return res.status(200).json({
    success: true,
    data: {
      priority: workOrder.priority,
      deadline: projection.deadline,
      state: workOrder.status === 'completed' ? 'met' : projection.state,
      isApproaching: workOrder.status !== 'completed' && projection.isApproaching,
      isOverdue: workOrder.status !== 'completed' && projection.isOverdue,
      remainingMilliseconds: projection.remainingMilliseconds
    }
  });
});

exports.getWorkOrderSummary = asyncHandler(async (req, res) => {
  const scope = buildWorkOrderScope(req.user);
  const now = new Date();
  const thresholdHours = Number.parseInt(process.env.SLA_APPROACHING_THRESHOLD_HOURS, 10) || 24;
  const deadline = new Date(now.getTime() + thresholdHours * 60 * 60 * 1000);
  const count = (filter) => WorkOrder.countDocuments({ ...scope, ...filter });
  const result = await Promise.all([
    count({ assignmentState: { $in: ['unassigned', 'declined'] }, status: 'pending' }),
    count({ assignmentState: 'pending', status: { $in: ['pending', 'in_progress'] } }),
    count({ status: 'accepted' }),
    count({ status: 'in_progress' }),
    count({ status: 'completed', progressPercent: 100 }),
    count({ status: { $in: ACTIVE_WORK_ORDER_STATUSES }, 'sla.deadline': { $gte: now, $lte: deadline } }),
    count({ status: { $in: ACTIVE_WORK_ORDER_STATUSES }, 'sla.deadline': { $lt: now } })
  ]);
  return res.status(200).json({
    success: true,
    data: {
      unassigned: result[0],
      pendingAcceptance: result[1],
      accepted: result[2],
      activeRepairs: result[3],
      readyForCompletion: result[4],
      approaching: result[5],
      overdue: result[6]
    }
  });
});

exports.getApproachingDeadlineWorkOrders = asyncHandler(async (req, res) => {
  req.query.slaState = 'approaching';
  return exports.getWorkOrders(req, res);
});

exports.getOverdueWorkOrders = asyncHandler(async (req, res) => {
  req.query.slaState = 'overdue';
  return exports.getWorkOrders(req, res);
});
