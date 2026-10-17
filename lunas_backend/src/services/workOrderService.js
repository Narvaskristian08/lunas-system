const { normalizeText, getIncidentBarangay } = require('./jurisdictionService');

const OFFICIAL_WORK_ORDER_ROLES = Object.freeze([
  'utility_provider'
]);

const REPAIR_PERSONNEL_ROLE = 'repair_personnel';

const PROGRESS_STAGES = Object.freeze({
  0: 'assigned',
  25: 'site_preparation',
  50: 'main_repair',
  75: 'finishing',
  100: 'ready_for_completion'
});

const REPAIR_PROGRESS_VALUES = Object.freeze(
  Object.keys(PROGRESS_STAGES).map((value) => Number(value))
);

const ACTIVE_WORK_ORDER_STATUSES = Object.freeze([
  'pending', 'accepted', 'in_progress', 'completed', 'rework_required',
  'provider_accepted', 'city_correction_required'
]);

const objectIdString = (value) => (value?._id || value)?.toString();

const sameId = (left, right) => Boolean(left && right && objectIdString(left) === objectIdString(right));

const getWorkOrderBarangay = (workOrder) => normalizeText(
  workOrder?.jurisdiction?.barangay || getIncidentBarangay(workOrder?.incident)
);

const isOfficialWorkOrderRole = (user) => Boolean(
  user && OFFICIAL_WORK_ORDER_ROLES.includes(user.role)
);

const canManageWorkOrder = (user, workOrder) => {
  if (!isOfficialWorkOrderRole(user) || !workOrder) return false;
  return user.role === 'utility_provider'
    && normalizeText(workOrder.responsibleOrganization)
      === normalizeText(user.utilityCompany);
};

const canReviewFinalWorkOrder = (user, workOrder) => Boolean(
  canManageWorkOrder(user, workOrder)
);

/**
 * Safe query scope used for server-side list/detail access. Any caller that
 * needs to mutate an individual record also calls canManageWorkOrder after
 * querying within this scope.
 */
const buildWorkOrderScope = (user) => {
  if (!user) return { _id: null };
  if (user.role === 'utility_provider') {
    const organization = normalizeText(user.utilityCompany);
    return organization ? { responsibleOrganization: organization } : { _id: null };
  }
  if (user.role === REPAIR_PERSONNEL_ROLE) {
    const organization = normalizeText(user.repairOrganization);
    if (!organization) return { _id: null };
    return { assignedTo: user._id, assignmentState: { $in: ['pending', 'accepted'] },
      responsibleOrganization: organization,
      ...(normalizeText(user.barangay) ? { 'jurisdiction.barangay': normalizeText(user.barangay) } : {}) };
  }
  return { _id: null };
};

const canAccessWorkOrder = (user, workOrder) => {
  if (!user || !workOrder) return false;
  if (user.role === REPAIR_PERSONNEL_ROLE) {
    return sameId(workOrder.assignedTo, user._id)
      && ['pending', 'accepted'].includes(workOrder.assignmentState)
      && Boolean(normalizeText(user.repairOrganization))
      && normalizeText(user.repairOrganization) === normalizeText(workOrder.responsibleOrganization)
      && (!normalizeText(user.barangay) || normalizeText(user.barangay) === getWorkOrderBarangay(workOrder));
  }
  return canManageWorkOrder(user, workOrder) || canReviewFinalWorkOrder(user, workOrder);
};

const repairPersonnelIneligibility = (personnel, workOrder) => {
  if (!personnel || personnel.role !== REPAIR_PERSONNEL_ROLE) return 'Select a repair personnel account';
  if (!personnel.isActive || personnel.isArchived) return 'This repair personnel account is inactive';
  if (!['available', 'assigned'].includes(personnel.availability)) return 'This repair personnel is off duty or unavailable';
  const organization = normalizeText(personnel.repairOrganization);
  if (!organization || organization !== normalizeText(workOrder.responsibleOrganization)) return 'This repair personnel belongs to another Utility Provider';
  const barangay = normalizeText(personnel.barangay);
  if (barangay && barangay !== getWorkOrderBarangay(workOrder)) return 'This repair personnel cannot work in this barangay';
  return null;
};
const isEligibleRepairPersonnel = (personnel, workOrder) => !repairPersonnelIneligibility(personnel, workOrder);

const getStageForProgress = (progressPercent) => PROGRESS_STAGES[Number(progressPercent)];

const validateProgressUpdate = ({ currentProgress, nextProgress, stage, notes, updateType }) => {
  const current = Number(currentProgress || 0);
  const next = Number(nextProgress);
  if (updateType === 'note') {
    if (!String(notes || '').trim()) return { valid: false, message: 'Progress notes are required' };
    if (next !== current || stage !== getStageForProgress(current)) {
      return { valid: false, message: 'A field note must preserve the current repair progress' };
    }
    return { valid: true, progressPercent: current, stage };
  }
  if (updateType === 'completion' && next !== 100) {
    return { valid: false, message: 'Completion must submit the completed repair' };
  }
  if (!REPAIR_PROGRESS_VALUES.includes(next)) {
    return { valid: false, message: 'Repair progress must be one of 0, 25, 50, 75, or 100' };
  }
  if (next <= current) {
    return {
      valid: false,
      message: next === current
        ? 'Repair progress is already recorded at this percentage'
        : 'Repair progress cannot be lower than the current progress'
    };
  }
  const expectedStage = getStageForProgress(next);
  if (stage !== expectedStage) {
    return { valid: false, message: `Repair stage must be '${expectedStage}' for ${next}% progress` };
  }
  return { valid: true, progressPercent: next, stage: expectedStage };
};

const transitionMessage = (status, action) => {
  const messages = {
    accept: 'Only a pending work order can be accepted',
    start: 'Only an accepted work order can be started',
    progress: 'Repair progress can only be recorded after work has started',
    assign: 'Completed work orders cannot be assigned or reassigned'
  };
  return messages[action] || `Work order cannot transition from ${status}`;
};

const getApproachingThresholdHours = () => {
  const hours = Number.parseInt(process.env.SLA_APPROACHING_THRESHOLD_HOURS, 10);
  return Number.isFinite(hours) && hours > 0 ? hours : 24;
};

const getSlaProjection = (sla = {}, now = new Date()) => {
  if (sla.closedAt && sla.deadline) {
    sla = { ...sla, state: new Date(sla.deadline) < new Date(sla.closedAt) ? 'breached' : 'met' };
  }
  if (['met', 'breached', 'cancelled'].includes(sla.state)) {
    return { deadline: sla.deadline || null, state: sla.state, isOverdue: false,
      isApproaching: false, remainingMilliseconds: null };
  }
  const deadline = sla.deadline ? new Date(sla.deadline) : null;
  if (!deadline || Number.isNaN(deadline.getTime())) {
    return {
      deadline: null,
      state: 'not_started',
      isOverdue: false,
      isApproaching: false,
      remainingMilliseconds: null
    };
  }
  const remainingMilliseconds = deadline.getTime() - now.getTime();
  const thresholdMilliseconds = getApproachingThresholdHours() * 3600000;
  const isOverdue = remainingMilliseconds < 0;
  return {
    deadline,
    state: isOverdue ? 'overdue' : (remainingMilliseconds <= thresholdMilliseconds ? 'approaching' : 'active'),
    isOverdue,
    isApproaching: !isOverdue && remainingMilliseconds <= thresholdMilliseconds,
    remainingMilliseconds
  };
};

const workOrderHistoryEntry = ({ type, actor, status, progressPercent, stage, notes, assignment, metadata, now = new Date() }) => ({
  type,
  actor: actor?._id || actor,
  actorRole: actor?.role,
  status,
  progressPercent,
  stage,
  notes,
  assignment,
  metadata,
  createdAt: now
});

module.exports = {
  getApproachingThresholdHours,
  getClosedSlaFields: (sla, now = new Date()) => ({
    'sla.state': !sla?.deadline ? 'not_started'
      : (new Date(sla.deadline) < now ? 'breached' : 'met'),
    'sla.isOverdue': false,
    'sla.closedAt': now
  }),
  ACTIVE_WORK_ORDER_STATUSES,
  OFFICIAL_WORK_ORDER_ROLES,
  PROGRESS_STAGES,
  REPAIR_PERSONNEL_ROLE,
  REPAIR_PROGRESS_VALUES,
  buildWorkOrderScope,
  canAccessWorkOrder,
  canManageWorkOrder,
  canReviewFinalWorkOrder,
  getSlaProjection,
  getStageForProgress,
  isEligibleRepairPersonnel,
  repairPersonnelIneligibility,
  isOfficialWorkOrderRole,
  sameId,
  transitionMessage,
  validateProgressUpdate,
  workOrderHistoryEntry
};
