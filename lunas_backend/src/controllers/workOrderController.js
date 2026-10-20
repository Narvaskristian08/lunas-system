const mongoose = require('mongoose');
const WorkOrder = require('../models/WorkOrder');
const Incident = require('../models/Incident');
const User = require('../models/User');
const { createAuditLog } = require('../utils/auditLogger');
const { createNotification, notificationTemplates } = require('../services/notificationService');
const { processAndUploadRepairEvidence, cleanupEvidence } = require('../services/evidenceService');
const { getEvidenceUrl } = require('../services/storageService');
const logger = require('../utils/logger');
const asyncHandler = require('../middleware/asyncHandler');
const { withInspectionMutation } = require('../services/inspectionMutation');
const {
  ACTIVE_WORK_ORDER_STATUSES,
  REPAIR_PERSONNEL_ROLE,
  buildWorkOrderScope,
  canAccessWorkOrder,
  canManageWorkOrder,
  getSlaProjection,
  getClosedSlaFields,
  getApproachingThresholdHours,
  isEligibleRepairPersonnel,
  repairPersonnelIneligibility,
  sameId,
  transitionMessage,
  validateProgressUpdate,
  workOrderHistoryEntry
} = require('../services/workOrderService');
const { normalizeText } = require('../services/jurisdictionService');
const { canTransitionIncident } = require('../services/incidentTransitionService');

const MAX_PAGE_SIZE = 100;
const SAFE_USER_FIELDS = 'firstName lastName role repairTeam repairAccountType availability';
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

const populateWorkOrder = (query, includeIncident = true) => {
  if (includeIncident) query.populate('incident', SAFE_INCIDENT_FIELDS);
  return query
    .populate('assignedTo', SAFE_USER_FIELDS)
    .populate('assignedBy', SAFE_USER_FIELDS)
    .populate('createdBy', SAFE_USER_FIELDS)
    .populate('reviews.actor', SAFE_USER_FIELDS)
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
    repairAccountType: source.repairAccountType || 'individual',
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
    progressUpdateId: getId(source.progressUpdate),
    isPrivacyMasked: Boolean(source.isPrivacyMasked),
    privacyProcessing: source.privacyProcessing ? {
      status: source.privacyProcessing.status,
      applied: Boolean(source.privacyProcessing.applied),
      detectedRegions: Number.isFinite(Number(source.privacyProcessing.detectedRegions))
        ? Math.max(0, Math.round(Number(source.privacyProcessing.detectedRegions)))
        : 0
    } : undefined
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
    closedAt: source.closedAt ?? source.finalVerifiedAt,
    version: source.version,
    maintenanceProtocol: source.maintenanceProtocol,
    assignee: safePerson(source.assignedTo),
    assignedBy: safePerson(source.assignedBy),
    currentAssignment: activeAssignment ? safeAssignment(activeAssignment) : null,
    sla: {
      targetResolutionTime: source.sla && source.sla.targetResolutionTime,
      startedAt: source.sla && source.sla.startedAt,
      deadline: projection.deadline,
      closedAt: source.sla?.closedAt,
      state: projection.state,
      isOverdue: source.status !== 'verified' && projection.isOverdue,
      isApproaching: source.status !== 'verified' && projection.isApproaching,
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
  result.reviews = (source.reviews || []).map((entry) => {
    const review = toPlain(entry);
    return {
      id: getId(review),
      stage: review.stage,
      decision: review.decision,
      reason: review.reason,
      instructions: review.instructions,
      actor: safePerson(review.actor),
      createdAt: review.createdAt
    };
  });
  return result;
};

const updateIncidentForWorkOrder = async ({ incidentId, status, actor, notes, metadata, events, fields = {} }) => {
  const incident = await Incident.findById(incidentId);
  if (!incident) return null;
  const eventStates = events || (incident.status === status ? [status] : [status]);
  let current = incident.status;
  for (const next of eventStates) {
    if (current !== next && !canTransitionIncident(current, next)) {
      throw new Error(`Invalid incident handoff ${current} -> ${next} for work order ${incidentId}`);
    }
    current = next;
  }
  const now = new Date();
  const history = eventStates.map((eventStatus, index) => ({
    status: eventStatus,
    changedBy: actor._id || actor,
    actorRole: actor.role,
    changedAt: now,
    notes,
    metadata: { ...(metadata || {}), ...(index === eventStates.length - 1 ? {} : { handoffEvent: true }) }
  }));
  return Incident.findOneAndUpdate(
    { _id: incidentId, status: incident.status, 'inspectionMutation.token': { $exists: false } },
    { $set: { status, ...fields }, $push: { statusHistory: { $each: history } } },
    { new: true, runValidators: true }
  );
};

// Legacy maintenance remains usable, but a held incident claim or terminal /
// mismatched current owner must never be bypassed by staffing or worker actions.
const repairIncidentAvailable = async (order) => {
  const incident = await Incident.findById(order.incident);
  return Boolean(incident && !incident.inspectionMutation?.token
    && ['provider_assigned', 'repair_assigned', 'in_progress', 'rework_required', 'city_correction_required'].includes(incident.status)
    && (!incident.workOrder || sameId(incident.workOrder, order._id))
    && (!incident.routing?.responsibleOrganization || incident.routing.responsibleOrganization === order.responsibleOrganization));
};

const notify = async (recipient, template, workOrder) => {
  if (!recipient) return;
  try {
    await createNotification({
      recipient: recipient._id || recipient,
      ...template,
      idempotencyKey: `work-order:${workOrder._id}:${workOrder.version}:${template.type}:${recipient._id || recipient}`,
      data: {
        incidentId: workOrder.incident && workOrder.incident._id ? workOrder.incident._id : workOrder.incident,
        workOrderId: workOrder._id,
        link: '/work-orders/' + workOrder._id
      }
    });
  } catch (error) {
    // The guarded work-order mutation has already committed. Notification
    // delivery is best-effort and must not make the caller retry a successful
    // workflow mutation (which could create a misleading conflict).
    logger.warn(`Work-order notification skipped after committed mutation: ${error.message}`);
  }
};

const setAvailability = async (personnelId, availability) => {
  if (!personnelId) return;
  if (availability === 'available') {
    const remaining = await WorkOrder.countDocuments({ assignedTo: personnelId, assignmentState: { $in: ['pending', 'accepted'] }, status: { $in: ['pending', 'accepted', 'in_progress', 'rework_required'] } });
    if (remaining > 0) availability = 'assigned';
  }
  await User.findByIdAndUpdate(personnelId, { availability });
};

const findScopedWorkOrder = (req, id, includeIncident = true) => {
  const scope = buildWorkOrderScope(req.user);
  return populateWorkOrder(WorkOrder.findOne({ _id: id, ...scope }), includeIncident);
};

const listFilter = async (req) => {
  const filter = { ...buildWorkOrderScope(req.user) };
  const query = req.query || {};
  if (query.status === 'awaiting_review') filter.status = { $in: ['completed', 'provider_accepted'] };
  else if (query.status === 'needs_correction') filter.status = { $in: ['rework_required', 'city_correction_required'] };
  else if (query.status) filter.status = query.status;
  else if (req.user.role === 'utility_provider') filter.status = { $ne: 'verified' };
  if (req.user.role === 'repair_personnel' && query.status === 'in_progress') {
    filter.assignmentState = 'accepted';
  }
  if (query.priority) filter.priority = query.priority;
  if (query.assignmentStatus) filter.assignmentState = query.assignmentStatus;
  if (req.user.role === "utility_provider" && query.assignmentStatus === "unassigned") {
    filter.$and = [...(filter.$and || []), { status: "pending" }];
  }
  if (req.user.role === 'repair_personnel' && query.repairView) {
    const repairViews = {
      assigned: { status: { $in: ['pending', 'accepted'] } },
      awaiting_acceptance: { status: { $ne: 'verified' }, assignmentState: 'pending' },
      active: { status: 'in_progress', assignmentState: 'accepted' },
      review: { status: { $in: ['completed', 'provider_accepted'] } },
      correction: { status: { $in: ['rework_required', 'city_correction_required'] } }
    };
    Object.assign(filter, repairViews[query.repairView] || {});
  }
  if (query.personnel && ['admin', 'city_engineer', 'barangay_official', 'utility_provider'].includes(req.user.role)) {
    filter.assignedTo = query.personnel;
  }
  if (query.organization && ['admin', 'city_engineer'].includes(req.user.role)) {
    filter.responsibleOrganization = query.organization;
  }
  if (query.progress !== undefined) filter.progressPercent = Number(query.progress);
  if (query.search) {
    const text = String(query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = { $regex: text, $options: 'i' };
    const incidents = await Incident.find({ reportNumber: regex }).select('_id');
    filter.$or = [{ orderNumber: regex }, { incident: { $in: incidents.map(incident => incident._id) } }];
  }
  if (query.category) {
    const incidents = await Incident.find({ category: query.category }).select('_id');
    filter.incident = { $in: incidents.map((incident) => incident._id) };
  }
  const now = new Date();
  const thresholdHours = getApproachingThresholdHours();
  if (query.slaState === 'overdue') {
    filter['sla.state'] = { $nin: ['met', 'breached', 'cancelled'] };
    filter['sla.deadline'] = { $lt: now };
    if (query.status || (req.user.role === 'repair_personnel' && query.repairView)) {
      filter.$and = [...(filter.$and || []), { status: { $in: ACTIVE_WORK_ORDER_STATUSES } }];
    } else filter.status = { $in: ACTIVE_WORK_ORDER_STATUSES };
  } else if (query.slaState === 'approaching') {
    filter['sla.state'] = { $nin: ['met', 'breached', 'cancelled'] };
    filter['sla.deadline'] = {
      $gte: now,
      $lte: new Date(now.getTime() + thresholdHours * 60 * 60 * 1000)
    };
    if (query.status || (req.user.role === 'repair_personnel' && query.repairView)) {
      filter.$and = [...(filter.$and || []), { status: { $in: ACTIVE_WORK_ORDER_STATUSES } }];
    } else filter.status = { $in: ACTIVE_WORK_ORDER_STATUSES };
  }
  return filter;
};

exports.createWorkOrder = asyncHandler(async (req, res) => {
  return res.status(409).json({ success: false, code: 'WORKFLOW_POLICY_REQUIRED', message: 'Use the current inspection workflow. Maintenance authorization and closure policy are not established for this legacy action.' });
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

// Paginate both sources in MongoDB; only hydrate records on the requested page.
exports.getAwaitingAssignmentQueue = asyncHandler(async (req, res) => {
  const page = pageNumber(req.query.page);
  const limit = pageSize(req.query.limit);
  const filter = await listFilter(req);
  const incidentFilter = {
    'routing.responsibleOrganization': normalizeText(req.user.utilityCompany) || '__unassigned__',
    status: 'provider_assigned', workOrder: null
  };
  if (req.query.priority) incidentFilter.priority = req.query.priority;
  if (req.query.category) incidentFilter.category = req.query.category;
  if (req.query.search) {
    const text = String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = { $regex: text, $options: 'i' };
    incidentFilter.$or = ['reportNumber', 'description', 'location.address.formattedAddress',
      'location.address.street', 'location.address.barangay'].map(field => ({ [field]: regex }));
  }
  const includeIntake = !req.query.status && !req.query.slaState && !req.query.personnel
    && req.query.progress === undefined && (!req.query.assignmentStatus || req.query.assignmentStatus === 'unassigned');
  const projection = { _id: 1, priority: 1, createdAt: 1, updatedAt: 1, 'sla.deadline': 1,
    progressPercent: 1, source: { $literal: 'order' } };
  const pipeline = [{ $match: filter }, { $project: projection }];
  if (includeIntake) pipeline.push({ $unionWith: {
    coll: Incident.collection.name,
    pipeline: [{ $match: incidentFilter }, { $project: {
      ...projection, updatedAt: { $ifNull: ['$routing.routedAt', '$createdAt'] },
      progressPercent: { $literal: 0 }, source: { $literal: 'incident' }
    } }]
  } });
  pipeline.push({ $addFields: { priorityRank: { $indexOfArray: [['low', 'medium', 'high', 'critical'], '$priority'] } } });
  const sorts = { newest: { updatedAt: -1 }, oldest: { createdAt: 1 },
    deadline: { 'sla.deadline': 1 }, '-deadline': { 'sla.deadline': -1 },
    priority: { priorityRank: 1, updatedAt: -1 }, '-priority': { priorityRank: -1, updatedAt: -1 },
    progress: { progressPercent: 1 }, '-progress': { progressPercent: -1 } };
  pipeline.push({ $facet: {
    rows: [{ $sort: { ...(sorts[req.query.sortBy] || sorts.newest), _id: 1, source: 1 } },
      { $skip: (page - 1) * limit }, { $limit: limit }],
    totals: [{ $count: 'total' }]
  } });
  const [result] = await WorkOrder.aggregate(pipeline);
  const rows = result.rows;
  const orderIds = rows.filter(row => row.source === 'order').map(row => row._id);
  const incidentIds = rows.filter(row => row.source === 'incident').map(row => row._id);
  const [orders, incidents] = await Promise.all([
    orderIds.length ? populateWorkOrder(WorkOrder.find({ ...buildWorkOrderScope(req.user), _id: { $in: orderIds } }), true) : [],
    incidentIds.length ? Incident.find({ ...incidentFilter, _id: { $in: incidentIds } }).select(`${SAFE_INCIDENT_FIELDS} createdAt updatedAt`) : []
  ]);
  const data = await Promise.all(rows.map(async row => {
    if (row.source === 'order') {
      const order = orders.find(item => sameId(item._id, row._id));
      return order ? serializeWorkOrder(order, false) : null;
    }
    const incident = incidents.find(item => sameId(item._id, row._id));
    if (!incident) return null;
    return { ...await serializeWorkOrder({ _id: incident._id, orderNumber: incident.reportNumber,
      status: 'pending', assignmentState: 'unassigned', incident, priority: incident.priority,
      responsibleOrganization: req.user.utilityCompany, responsibleRole: 'utility_provider',
      createdAt: incident.createdAt, updatedAt: row.updatedAt, sla: incident.sla }, false),
      intakeIncidentId: getId(incident) };
  }));
  const total = result.totals[0]?.total || 0;
  return res.status(200).json({ success: true, data: data.filter(Boolean),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
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
  const organization = normalizeText(workOrder.responsibleOrganization);
  const personnel = await User.find({ role: REPAIR_PERSONNEL_ROLE, repairOrganization: organization, isActive: true, isArchived: { $ne: true }, requiresActivation: { $ne: true }, accountStatus: { $nin: ['pending_activation', 'suspended', 'deactivated'] } })
    .select('firstName lastName role isActive isArchived requiresActivation accountStatus repairOrganization repairTeam repairAccountType availability barangay expertise');
  return res.status(200).json({
    success: true,
    data: personnel.filter((person) => organization && isEligibleRepairPersonnel(person, workOrder)).map((person) => ({
      id: getId(person),
      firstName: person.firstName,
      lastName: person.lastName,
      role: person.role,
      organization: person.repairOrganization,
      team: person.repairTeam,
      repairAccountType: person.repairAccountType || 'individual',
      availability: person.availability,
      expertise: person.expertise || []
    }))
  });
});

const assign = async (req, res, reassign) => {
  const workOrder = await findScopedWorkOrder(req, req.params.id, false);
  if (workOrder && req.body?.version !== undefined && Number(req.body.version) !== workOrder.version) return fail(res, 409, 'Work order changed; refresh before continuing');
  if (workOrder?.maintenanceProtocol === 9) return fail(res, 409, 'New maintenance requires approved work-authorization policy; preparation alone cannot activate work');
  if (!workOrder || !canManageWorkOrder(req.user, workOrder)) return fail(res, 404, 'Work order not found');
  if (!['pending', 'accepted', 'in_progress', 'rework_required'].includes(workOrder.status)
    || (['pending', 'accepted'].includes(workOrder.status) && (workOrder.startedAt || workOrder.actualStartTime))
    || (!reassign && (workOrder.startedAt || workOrder.actualStartTime || workOrder.status === 'in_progress'))) {
    return fail(res, 409, 'Repair work has started or is under review and cannot be reassigned');
  }
  if (!activeWorkOrder(workOrder)) return fail(res, 409, transitionMessage(workOrder.status, 'assign'));

  const activeAssignment = (workOrder.assignments || []).find(
    (assignment) => getId(assignment._id) === getId(workOrder.currentAssignment) && assignment.active
  );
  const previousAssignment = activeAssignment || [...(workOrder.assignments || [])]
    .reverse()
    .find((assignment) => assignment.status === 'declined');
  const reassignAfterDecline = reassign && !activeAssignment
    && workOrder.status === 'in_progress' && workOrder.assignmentState === 'declined';
  if (reassign && !activeAssignment && !reassignAfterDecline) {
    return fail(res, 409, 'This work order has no active assignment to reassign');
  }
  if (!reassign && activeAssignment) return fail(res, 409, 'This work order already has an active assignment; use reassignment');

  const assignee = await User.findById(req.body.assigneeId || req.body.assignedTo);
  if (!assignee) return fail(res, 404, 'Repair personnel not found');
  if (sameId(workOrder.assignedTo, assignee._id)) return fail(res, 409, 'Select a different repair person for reassignment');
  const ineligibility = repairPersonnelIneligibility(assignee, workOrder);
  if (ineligibility) return fail(res, 400, ineligibility);
  const reason = String(req.body.reason || '').trim();
  if (reassign && !reason) return fail(res, 400, 'A reassignment reason is required');

  if (!await repairIncidentAvailable(workOrder)) return fail(res, 409, 'Incident unavailable or awaiting workflow reconciliation');
  const now = new Date();
  const assignmentId = new mongoose.Types.ObjectId();
  // Staffing creates a pending worker decision, never maintenance authority.
  const statusAfterAssignment = workOrder.status === 'accepted' && !workOrder.startedAt ? 'pending' : workOrder.status;
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
      acceptedAt: null,
      ...(!reassign && req.body.instructions !== undefined ? { instructions: String(req.body.instructions).trim() } : {})
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
          previousAssignmentId: previousAssignment && previousAssignment._id,
          previousAssigneeId: previousAssignment && previousAssignment.assignee,
          reason: reassign ? reason : undefined
        },
        now
      })
    },
    $inc: { version: 1 }
  };
  const options = { new: true };
  if (reassign && activeAssignment) {
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
    status: workOrder.status,
    ...(reassign ? {} : { startedAt: null, actualStartTime: null })
  };
  if (reassign) {
    if (activeAssignment) {
      condition.assignmentState = workOrder.assignmentState;
      condition.currentAssignment = activeAssignment._id;
      condition.assignments = { $elemMatch: { _id: activeAssignment._id, active: true } };
    } else {
      condition.currentAssignment = null;
      condition.assignmentState = 'declined';
      condition.assignments = { $not: { $elemMatch: { active: true } } };
    }
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
    status: updated.status === 'in_progress'
      ? 'in_progress'
      : updated.status === 'rework_required' ? 'rework_required' : 'repair_assigned',
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
    details: {
      assignmentId,
      assigneeId: assignee._id,
      previousAssignmentId: previousAssignment && previousAssignment._id,
      previousAssigneeId: previousAssignment && previousAssignment.assignee,
      reason: reassign ? reason : undefined
    },
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
  if (workOrder && req.body?.version !== undefined && Number(req.body.version) !== workOrder.version) return fail(res, 409, 'Work order changed; refresh before continuing');
  if (workOrder?.maintenanceProtocol === 9) return fail(res, 409, 'New maintenance requires approved work-authorization policy; preparation alone cannot activate work');
  if (!workOrder || !sameId(workOrder.assignedTo, req.user._id)) return fail(res, 404, 'Work order not found');
  if (workOrder.assignmentState !== 'pending'
    || !['pending', 'in_progress', 'rework_required'].includes(workOrder.status)) {
    return fail(res, 409, transitionMessage(workOrder.status, 'accept'));
  }
  const assignment = (workOrder.assignments || []).find(
    (entry) => getId(entry._id) === getId(workOrder.currentAssignment)
      && entry.active && sameId(entry.assignee, req.user._id)
  );
  if (!assignment) return fail(res, 403, 'You do not have an active assignment for this work order');
  if (!await repairIncidentAvailable(workOrder)) return fail(res, 409, 'Incident unavailable or awaiting workflow reconciliation');
  const now = new Date();
  // A replacement who accepts an in-progress handoff resumes the same repair;
  // startedAt, progress, evidence, history, and SLA remain untouched.
  const nextStatus = workOrder.status === 'pending' ? 'accepted' : workOrder.status;
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
  if (workOrder && req.body?.version !== undefined && Number(req.body.version) !== workOrder.version) return fail(res, 409, 'Work order changed; refresh before continuing');
  if (!workOrder || !sameId(workOrder.assignedTo, req.user._id)) return fail(res, 404, 'Work order not found');
  if (!['pending', 'in_progress', 'rework_required'].includes(workOrder.status)
    || workOrder.assignmentState !== 'pending') {
    return fail(res, 409, 'Only a pending assignment can be declined');
  }
  const assignment = (workOrder.assignments || []).find(
    (entry) => getId(entry._id) === getId(workOrder.currentAssignment)
      && entry.active && sameId(entry.assignee, req.user._id)
  );
  if (!assignment) return fail(res, 403, 'You do not have an active assignment for this work order');
  if (!await repairIncidentAvailable(workOrder)) return fail(res, 409, 'Incident unavailable or awaiting workflow reconciliation');
  const now = new Date();
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
          status: workOrder.status,
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
    status: workOrder.status === 'in_progress'
      ? 'in_progress'
      : workOrder.status === 'rework_required' ? 'rework_required' : 'provider_assigned',
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
  if (workOrder && req.body?.version !== undefined && Number(req.body.version) !== workOrder.version) return fail(res, 409, 'Work order changed; refresh before continuing');
  if (workOrder?.maintenanceProtocol === 9) return fail(res, 409, 'New maintenance requires approved work-authorization policy; preparation alone cannot activate work');
  if (!workOrder || !sameId(workOrder.assignedTo, req.user._id)) return fail(res, 404, 'Work order not found');
  if (!['accepted', 'rework_required'].includes(workOrder.status) || workOrder.assignmentState !== 'accepted') {
    return fail(res, 409, transitionMessage(workOrder.status, 'start'));
  }
  const assignment = (workOrder.assignments || []).find(
    (entry) => getId(entry._id) === getId(workOrder.currentAssignment)
      && entry.active && sameId(entry.assignee, req.user._id)
  );
  if (!assignment) return fail(res, 403, 'You do not have an active assignment for this work order');
  if (!await repairIncidentAvailable(workOrder)) return fail(res, 409, 'Incident unavailable or awaiting workflow reconciliation');
  const now = new Date();
  const updated = await WorkOrder.findOneAndUpdate(
    {
      _id: workOrder._id,
      version: workOrder.version,
      assignedTo: req.user._id,
      currentAssignment: assignment._id,
      assignmentState: workOrder.assignmentState,
      status: workOrder.status
    },
    {
      $set: { status: 'in_progress', startedAt: workOrder.startedAt || now,
        actualStartTime: workOrder.actualStartTime || now, assignmentState: 'accepted',
        acceptedAt: workOrder.acceptedAt || now,
        'assignments.$[active].status': 'accepted',
        'assignments.$[active].acceptedAt': assignment.acceptedAt || now },
      $push: {
        history: workOrderHistoryEntry({
          type: workOrder.status === 'rework_required' ? 'correction_started' : 'started',
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
    { new: true, arrayFilters: [{ 'active._id': assignment._id }] }
  );
  if (!updated) return fail(res, 409, 'The work order changed. Refresh and try again.');
  await updateIncidentForWorkOrder({
    incidentId: updated.incident,
    status: 'in_progress',
    actor: req.user,
    notes: workOrder.status === 'rework_required' ? 'Corrective repair work started' : 'Repair work started',
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
  if (files.length > 1) {
    const error = new Error('Upload one repair photo at a time');
    error.statusCode = 400;
    throw error;
  }
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
  if (workOrder && req.body?.version !== undefined && Number(req.body.version) !== workOrder.version) return fail(res, 409, 'Work order changed; refresh before continuing');
  if (workOrder?.maintenanceProtocol === 9) return fail(res, 409, 'New maintenance requires approved work-authorization policy; preparation alone cannot activate work');
  if (!workOrder || !sameId(workOrder.assignedTo, req.user._id)) return fail(res, 404, 'Work order not found');
  if (!await repairIncidentAvailable(workOrder)) return fail(res, 409, 'Incident unavailable or awaiting workflow reconciliation');
  if (workOrder.status !== 'in_progress' || workOrder.assignmentState !== 'accepted') {
    return fail(res, 409, transitionMessage(workOrder.status, 'progress'));
  }
  const assignment = (workOrder.assignments || []).find(
    (entry) => getId(entry._id) === getId(workOrder.currentAssignment)
      && entry.active && sameId(entry.assignee, req.user._id)
  );
  if (!assignment) return fail(res, 403, 'You do not have an active assignment for this work order');
  const notes = String(req.body.notes || '').trim();
  const noteOnly = req.body.updateType === 'note';
  const isCorrectiveCycle = workOrder.history?.some((event) => event.type === 'provider_correction_requested' || event.type === 'city_returned');
  const progress = validateProgressUpdate({
    currentProgress: !noteOnly && isCorrectiveCycle && workOrder.progressPercent === 100 ? 75 : workOrder.progressPercent,
    nextProgress: req.body.progressPercent,
    stage: String(req.body.stage || '').trim(),
    updateType: req.body.updateType,
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
    const completed = !noteOnly && progress.progressPercent === 100;
    if (completed && !evidence.length) {
      await cleanupEvidence(uploads);
      return fail(res, 400, 'Final post-maintenance evidence is required before submitting completion');
    }
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
          ...(completed ? { readyForCompletionAt: now, actualCompletionTime: now } : {})
        },
        $push: {
          ...(evidence.length ? { repairEvidence: { $each: evidence } } : {}),
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
    uploads = [];
    if (completed) await setAvailability(req.user._id, 'available');
    await updateIncidentForWorkOrder({
      incidentId: updated.incident,
      status: completed ? 'provider_review' : 'in_progress',
      ...(completed ? { events: ['repair_completed', 'provider_review'] } : {}),
      actor: req.user,
      notes: completed
        ? 'Repair Personnel submitted completion and evidence; awaiting Utility Provider review'
        : noteOnly ? 'Repair field update recorded' : 'Repair progress updated to ' + progress.progressPercent + '%',
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
        : noteOnly ? { type: 'work_order_progress', title: 'Repair Update Added', message: `A field update was added to work order ${updated.orderNumber}.` } : notificationTemplates.workOrderProgress(updated.orderNumber, progress.progressPercent),
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
        ? 'Repair marked complete and sent to the Utility Provider for review'
        : 'Repair progress updated',
      data: await serializeWorkOrder(updated)
    });
  } catch (error) {
    if (error.name === 'ValidationError' || error.code === 11000) await cleanupEvidence(uploads);
    else if (uploads.length) logger.error('Repair evidence retained after ambiguous persistence failure; reconciliation required', { workOrderId: workOrder._id });
    throw error;
  }
});

exports.uploadRepairEvidence = asyncHandler(async (req, res) => {
  const workOrder = await findScopedWorkOrder(req, req.params.id, false);
  if (workOrder && req.body?.version !== undefined && Number(req.body.version) !== workOrder.version) return fail(res, 409, 'Work order changed; refresh before continuing');
  if (workOrder?.maintenanceProtocol === 9) return fail(res, 409, 'New maintenance requires approved work-authorization policy; preparation alone cannot activate work');
  if (!workOrder || !sameId(workOrder.assignedTo, req.user._id)) return fail(res, 404, 'Work order not found');
  if (!await repairIncidentAvailable(workOrder)) return fail(res, 409, 'Incident unavailable or awaiting workflow reconciliation');
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
    if (!sameId(progressUpdate.updatedBy, req.user._id)) return fail(res, 403, 'Evidence may be attached only to your own attributed progress event');
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
      // Append to this worker's event; earlier evidence remains attributable.
      options.arrayFilters = [{ 'progress._id': progressUpdate._id }];
      push['progressUpdates.$[progress].evidence'] = { $each: evidence.map(entry => entry._id) };
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
    uploads = [];
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
    if (error.name === 'ValidationError' || error.code === 11000) await cleanupEvidence(uploads);
    else if (uploads.length) logger.error('Repair evidence retained after ambiguous persistence failure; reconciliation required', { workOrderId: workOrder._id });
    throw error;
  }
});

const addWorkOrderReview = async ({ workOrder, req, stage, decision, reason, instructions, nextStatus, historyType, now = new Date() }) => {
  return WorkOrder.findOneAndUpdate(
    { _id: workOrder._id, version: workOrder.version, status: workOrder.status },
    {
      $set: {
        status: nextStatus,
        ...(decision === 'verified' ? getClosedSlaFields(workOrder.sla, now) : {})
      },
      $push: {
        reviews: { stage, decision, reason, instructions, actor: req.user._id, createdAt: now },
        history: workOrderHistoryEntry({
          type: historyType,
          actor: req.user,
          status: nextStatus,
          progressPercent: workOrder.progressPercent,
          stage: workOrder.progressStage,
          notes: reason || instructions,
          metadata: { reviewStage: stage, decision, instructions },
          now
        })
      },
      $inc: { version: 1 }
    },
    { new: true }
  );
};

const notifyRepairPersonnel = async (workOrder, title, message) => {
  if (!workOrder.assignedTo) return;
  await notify(workOrder.assignedTo, {
    type: 'status_update',
    title,
    message,
    priority: 'high'
  }, workOrder);
};

exports.reviewCompletedWork = asyncHandler(async (req, res) => {
  if (req.user.role !== 'utility_provider') return fail(res, 403, 'Only the assigned Utility Provider may review repair completion');
  const workOrder = await findScopedWorkOrder(req, req.params.id);
  if (!workOrder || !canManageWorkOrder(req.user, workOrder)) return fail(res, 404, 'Work order not found');
  if (workOrder.status !== 'completed') return fail(res, 409, 'Only repair-completed work can be reviewed by the Utility Provider');
  const decision = String(req.body.decision || '').trim();
  const reason = String(req.body.reason || '').trim();
  const instructions = String(req.body.instructions || '').trim();
  if (decision === 'request_correction' && !reason) return fail(res, 400, 'A correction reason is required');
  if (!['accepted', 'request_correction'].includes(decision)) return fail(res, 400, 'Choose accepted or request_correction');
  if (!workOrder.assignedTo) return fail(res, 409, 'Assign Repair Personnel before reviewing completion');
  if (decision === 'accepted') return fail(res, 409, 'Provider review cannot close an incident while final closure authority is unresolved');
  return withInspectionMutation(req, res, async () => {
    const currentIncident = await Incident.findOne({ _id: getId(workOrder.incident), workOrder: workOrder._id, 'routing.responsibleOrganization': req.user.utilityCompany, status: { $in: ['repair_completed', 'provider_review'] } });
    if (!currentIncident) return fail(res, 409, 'Work order is no longer the current review task');
    const updated = await addWorkOrderReview({
      workOrder, req, stage: 'utility_provider', decision: 'correction_required', reason,
      instructions: instructions || reason, nextStatus: 'rework_required', historyType: 'provider_correction_requested'
    });
    if (!updated) return fail(res, 409, 'The work-order review changed. Refresh and try again.');
    const incident = await updateIncidentForWorkOrder({
      incidentId: updated.incident, status: 'rework_required', actor: req.user,
      events: ['rework_required'], notes: instructions || reason,
      metadata: { workOrderId: updated._id, decision }
    });
    if (!incident) throw new Error('Work-order correction requires incident reconciliation');
    await setAvailability(updated.assignedTo, 'assigned');
    await notifyRepairPersonnel(updated, 'Corrective work requested', instructions || reason);
    await createAuditLog({
      action: 'provider_correction_requested', performedBy: req.user._id,
      resourceType: 'WorkOrder', resourceId: updated._id, details: { reason, instructions },
      ipAddress: req.ip, userAgent: req.headers['user-agent']
    });
    return res.status(200).json({ success: true, message: 'Corrective work sent to Repair Personnel', data: await serializeWorkOrder(updated) });
  }, getId(workOrder.incident));
});

exports.coordinateCityCorrection = asyncHandler(async (req, res) => {
  if (req.user.role !== 'utility_provider') return fail(res, 403, 'Only the assigned Utility Provider may coordinate corrective work');
  const workOrder = await findScopedWorkOrder(req, req.params.id);
  if (!workOrder || !canManageWorkOrder(req.user, workOrder)) return fail(res, 404, 'Work order not found');
  if (workOrder.status !== 'city_correction_required') return fail(res, 409, 'City Engineering has not returned this work order for correction');
  const instructions = String(req.body.instructions || '').trim();
  if (!instructions) return fail(res, 400, 'Corrective instructions are required');
  if (!workOrder.assignedTo) return fail(res, 409, 'Assign Repair Personnel before coordinating corrective work');
  const updated = await WorkOrder.findOneAndUpdate(
    { _id: workOrder._id, version: workOrder.version, status: 'city_correction_required' },
    {
      $set: { status: 'rework_required' },
      $push: { history: workOrderHistoryEntry({
        type: 'provider_correction_requested', actor: req.user, status: 'rework_required',
        progressPercent: workOrder.progressPercent, stage: workOrder.progressStage,
        notes: instructions, metadata: { source: 'city_engineering' }
      }) },
      $inc: { version: 1 }
    },
    { new: true }
  );
  if (!updated) return fail(res, 409, 'The work-order state changed. Refresh and try again.');
  await updateIncidentForWorkOrder({
    incidentId: updated.incident, status: 'rework_required', actor: req.user,
    notes: instructions, metadata: { workOrderId: updated._id, source: 'city_engineering' }
  });
  await setAvailability(updated.assignedTo, 'assigned');
  await notifyRepairPersonnel(updated, 'City Engineering requested corrective work', instructions);
  await createAuditLog({
    action: 'provider_coordinated_city_correction', performedBy: req.user._id,
    resourceType: 'WorkOrder', resourceId: updated._id, details: { instructions },
    ipAddress: req.ip, userAgent: req.headers['user-agent']
  });
  return res.status(200).json({ success: true, message: 'Corrective work sent to Repair Personnel', data: await serializeWorkOrder(updated) });
});

exports.finalReviewWorkOrder = asyncHandler(async (req, res) => {
  return res.status(409).json({ success: false, code: 'WORKFLOW_POLICY_REQUIRED', message: 'Use the current inspection workflow. Maintenance authorization and closure policy are not established for this legacy action.' });
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
      closedAt: workOrder.sla?.closedAt,
      state: projection.state,
      isApproaching: workOrder.status !== 'verified' && projection.isApproaching,
      isOverdue: workOrder.status !== 'verified' && projection.isOverdue,
      remainingMilliseconds: projection.remainingMilliseconds
    }
  });
});

exports.getWorkOrderSummary = asyncHandler(async (req, res) => {
  const scope = buildWorkOrderScope(req.user);
  const now = new Date();
  const thresholdHours = getApproachingThresholdHours();
  const deadline = new Date(now.getTime() + thresholdHours * 60 * 60 * 1000);
  const count = (filter) => WorkOrder.countDocuments({ ...scope, ...filter });
  const result = await Promise.all([
    count({ assignmentState: 'unassigned', status: 'pending' }),
    count({ assignmentState: 'pending', status: { $ne: 'verified' } }),
    count({ status: 'accepted' }),
    count(req.user.role === REPAIR_PERSONNEL_ROLE
      ? { status: 'in_progress', assignmentState: 'accepted' }
      : { status: 'in_progress' }),
    count({ status: 'completed' }),
    count({ status: { $in: ACTIVE_WORK_ORDER_STATUSES }, 'sla.state': { $nin: ['met', 'breached', 'cancelled'] }, 'sla.deadline': { $gte: now, $lte: deadline } }),
    count({ status: { $in: ACTIVE_WORK_ORDER_STATUSES }, 'sla.state': { $nin: ['met', 'breached', 'cancelled'] }, 'sla.deadline': { $lt: now } }),
    count({ status: 'provider_accepted' }),
    count({ status: 'city_correction_required' }),
    count({ status: 'rework_required' }),
    count({ status: 'verified' }),
    count({ status: { $in: ['pending', 'accepted'] } })
  ]);
  return res.status(200).json({
    success: true,
    data: {
      assignedRepairs: result[11],
      unassigned: result[0],
      pendingAcceptance: result[1],
      accepted: result[2],
      activeRepairs: result[3],
      readyForCompletion: result[4],
      approaching: result[5],
      overdue: result[6],
      awaitingFinalVerification: result[7],
      cityCorrections: result[8],
      correctiveRepairs: result[9],
      closed: result[10]
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
