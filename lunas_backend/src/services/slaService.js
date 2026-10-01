const cron = require('node-cron');
const Incident = require('../models/Incident');
const WorkOrder = require('../models/WorkOrder');
const User = require('../models/User');
const { createNotification, notificationTemplates } = require('./notificationService');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditLogger');
const {
  ACTIVE_WORK_ORDER_STATUSES,
  getSlaProjection,
  getClosedSlaFields,
  getApproachingThresholdHours,
  workOrderHistoryEntry
} = require('./workOrderService');

// City Engineering assigns priority; this is the single configured SLA policy
// used to calculate the deadline. Deployments can tune values without changing
// the decision controller or client.
const DEFAULT_SLA_HOURS = Object.freeze({
  critical: 48,
  high: 72,
  medium: 168,
  low: 336
});

const getSLAHours = (priority) => {
  const normalizedPriority = String(priority || 'medium').toLowerCase();
  const environmentValue = process.env[`SLA_${normalizedPriority.toUpperCase()}`];
  const configured = Number.parseInt(environmentValue, 10);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : (DEFAULT_SLA_HOURS[normalizedPriority] || DEFAULT_SLA_HOURS.medium);
};

const initializeIncidentSLA = (priority, startedAt = new Date()) => {
  const targetResolutionTime = getSLAHours(priority);
  return {
    targetResolutionTime,
    startedAt,
    deadline: new Date(startedAt.getTime() + targetResolutionTime * 60 * 60 * 1000),
    state: 'active',
    isOverdue: false,
    escalationLevel: 0,
    remindersSent: 0
  };
};

const isSlaAutomationEnabled = () => process.env.SLA_AUTOMATION_ENABLED === 'true';

const workOrderRecipients = (workOrder) => {
  const ids = [workOrder.assignedTo, workOrder.assignedBy, workOrder.createdBy]
    .filter(Boolean)
    .map((value) => (value._id || value).toString());
  return [...new Set(ids)];
};

const notificationKey = (record, stage, recipient) => `sla:${record._id}:${new Date(record.sla.deadline).toISOString()}:${stage}:${recipient}`;

const notifyWorkOrderSla = async (workOrder, template) => {
  for (const recipient of workOrderRecipients(workOrder)) {
    await createNotification({
      recipient,
      idempotencyKey: notificationKey(workOrder, template.type, recipient),
      ...template,
      data: {
        incidentId: workOrder.incident,
        workOrderId: workOrder._id,
        link: '/work-orders/' + workOrder._id
      }
    });
  }
};

/** Notify first, then acknowledge delivery. Unique notification keys permit
 * overlapping runners and retries after crashes without duplicate in-app alerts. */
const runWorkOrderSlaCheck = async (now = new Date()) => {
  const candidates = await WorkOrder.find({ status: { $in: ACTIVE_WORK_ORDER_STATUSES },
    'sla.deadline': { $lte: new Date(now.getTime()
      + getApproachingThresholdHours() * 3600000) } });
  const counts = { approaching: 0, overdue: 0 };
  for (const workOrder of candidates) {
    try {
      const projection = getSlaProjection(workOrder.sla, now);
      const stage = projection.isOverdue ? 'overdue' : projection.isApproaching ? 'approaching' : null;
      if (!stage) continue;
      const marker = `sla.${stage}NotifiedAt`;
      const updated = await WorkOrder.findOneAndUpdate({
        _id: workOrder._id, status: { $in: ACTIVE_WORK_ORDER_STATUSES }
      }, { $set: { 'sla.state': projection.state || stage, 'sla.isOverdue': projection.isOverdue } }, { new: true });
      if (!updated || updated.sla?.[`${stage}NotifiedAt`]) continue;
      await notifyWorkOrderSla(updated, stage === 'overdue'
        ? notificationTemplates.workOrderSlaOverdue(updated.orderNumber)
        : notificationTemplates.workOrderSlaApproaching(updated.orderNumber));
      const acknowledged = await WorkOrder.findOneAndUpdate({ _id: updated._id,
        status: { $in: ACTIVE_WORK_ORDER_STATUSES }, [marker]: null }, {
        $set: { [marker]: now },
        $push: { history: workOrderHistoryEntry({ type: `sla_${stage}`, actor: updated.createdBy,
          status: updated.status, progressPercent: updated.progressPercent, stage: updated.progressStage,
          notes: `SLA deadline ${stage}; incident remains open until City Engineering closure`,
          metadata: { systemEvent: true }, now }) }, $inc: { version: 1 }
      }, { new: true });
      if (acknowledged) {
        counts[stage] += 1;
        await createAuditLog({ action: `sla_${stage}`, performedBy: updated.createdBy,
          resourceType: 'WorkOrder', resourceId: updated._id,
          details: { systemEvent: true, deadline: updated.sla.deadline } });
      }
    } catch (error) {
      logger.error(`Work-order SLA check failed for ${workOrder._id}; will retry`, error);
    }
  }
  return counts;
};

const TERMINAL_INCIDENT_STATUSES = ['verified', 'resolved', 'closed', 'rejected', 'duplicate'];
const REMINDER_THRESHOLDS = [24, 12, 6, 2];
const activeIncidentFilter = {
  status: { $nin: TERMINAL_INCIDENT_STATUSES },
  'sla.deadline': { $ne: null }
};

// Persist state independently of delivery. A failed recipient is retried on the
// next poll; the notification's unique key protects recipients already served.
const notifyIncident = async (incident, stage, template) => {
  const recipients = await incidentSlaRecipients(incident);
  if (incident.sla.escalationLevel >= 2 && stage === 'escalation') {
    const engineers = await User.find({
      role: 'city_engineer', isActive: true, isArchived: { $ne: true }
    }).select('_id');
    recipients.push(...engineers.map((user) => user._id.toString()));
  }
  for (const recipient of [...new Set(recipients)]) {
    await createNotification({ recipient, ...template,
      idempotencyKey: notificationKey(incident, `${stage}:${incident.sla.escalationLevel || 0}`, recipient),
      data: { incidentId: incident._id, link: `/incidents/${incident._id}`,
        additionalInfo: { deadline: incident.sla.deadline, stage } }
    });
  }
  return recipients.length > 0;
};

const runIncidentSlaCheck = async (now = new Date()) => {
  const incidents = await Incident.find(activeIncidentFilter);
  for (const incident of incidents) {
    try {
      const projection = getSlaProjection(incident.sla, now);
      const updated = await Incident.findOneAndUpdate({
        _id: incident._id, ...activeIncidentFilter
      }, { $set: { 'sla.state': projection.state, 'sla.isOverdue': projection.isOverdue } }, { new: true });
      if (!updated) continue;
      // Revision 1-5 persisted a threshold counter. Preserve its acknowledgments
      // when the explicit threshold list has not yet been populated.
      if (!updated.sla.reminderThresholdsSent?.length && updated.sla.remindersSent > 0) {
        updated.sla.reminderThresholdsSent = REMINDER_THRESHOLDS.slice(0, updated.sla.remindersSent);
        await Incident.updateOne({ _id: updated._id, ...activeIncidentFilter }, {
          $addToSet: { 'sla.reminderThresholdsSent': { $each: updated.sla.reminderThresholdsSent } }
        });
      }
      if (projection.isOverdue) {
        // The existing policy establishes the initial overdue escalation only.
        // No second-stage timing is configured; do not invent a trigger.
        await Incident.updateOne({ _id: incident._id, ...activeIncidentFilter,
          'sla.escalationLevel': 0 }, { $set: {
          'sla.escalationLevel': 1, 'sla.lastEscalatedAt': now
        } });
        updated.sla.escalationLevel = Math.max(1, updated.sla.escalationLevel || 0);
        if (!updated.sla.overdueNotifiedAt && await notifyIncident(updated, 'escalation',
          notificationTemplates.slaEscalation(updated.reportNumber))) {
          await Incident.updateOne({ _id: updated._id, ...activeIncidentFilter }, {
            $set: { 'sla.overdueNotifiedAt': now }
          });
        }
      } else {
        for (const hours of REMINDER_THRESHOLDS) {
          if (projection.remainingMilliseconds > hours * 3600000
            || updated.sla.reminderThresholdsSent?.includes(hours)) continue;
          if (await notifyIncident(updated, `reminder:${hours}`, notificationTemplates.slaReminder(updated.reportNumber, hours))) {
            await Incident.updateOne({ _id: updated._id, ...activeIncidentFilter,
              'sla.reminderThresholdsSent': { $ne: hours } }, {
              $addToSet: { 'sla.reminderThresholdsSent': hours }, $inc: { 'sla.remindersSent': 1 }
            });
          }
        }
      }
    } catch (error) {
      logger.error(`Incident SLA monitoring failed for ${incident._id}; will retry`, error);
    }
  }
};

const normalizeTerminalSla = async () => {
  const incidents = await Incident.find({ status: { $in: TERMINAL_INCIDENT_STATUSES } });
  for (const incident of incidents) {
    const cancelled = ['rejected', 'duplicate'].includes(incident.status);
    const closedAt = incident.closedAt || incident.finalVerifiedAt
      || incident.statusHistory?.findLast((entry) => ['closed', 'resolved', 'verified'].includes(entry.status))?.changedAt;
    if (!cancelled && !closedAt) continue; // Never fabricate historical closure time.
    const fields = cancelled ? { 'sla.state': 'cancelled', 'sla.isOverdue': false }
      : getClosedSlaFields(incident.sla, new Date(closedAt));
    await Incident.updateOne({ _id: incident._id, status: incident.status }, { $set: fields });
    await WorkOrder.updateMany({ incident: incident._id }, { $set: fields });
  }
};

const checkSLAStatus = async (now = new Date()) => {
  // Separate failures so an incident query outage does not suppress work orders.
  for (const check of [normalizeTerminalSla, runIncidentSlaCheck, runWorkOrderSlaCheck]) {
    try { await check(now); }
    catch (error) { logger.error('SLA status check failed; next poll will retry', error); }
  }
};

const incidentSlaRecipients = async (incident) => {
  if (incident.assignedUtility) {
    return [(incident.assignedUtility._id || incident.assignedUtility).toString()];
  }
  if (['submitted', 'clarification_required'].includes(incident.status)) {
    const barangay = incident.jurisdiction?.barangay || incident.location?.address?.barangay;
    if (!barangay) return [];
    const officials = await User.find({
      role: 'barangay_official', barangay, isActive: true, isArchived: { $ne: true }
    }).select('_id');
    return officials.map((official) => official._id.toString());
  }
  const engineers = await User.find({
    role: 'city_engineer', isActive: true, isArchived: { $ne: true }
  }).select('_id');
  return engineers.map((engineer) => engineer._id.toString());
};

let monitorTask = null;
let running = false;
const getPollingMinutes = () => {
  const minutes = Number(process.env.SLA_POLL_INTERVAL_MINUTES || 5);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 59) {
    throw new Error('SLA_POLL_INTERVAL_MINUTES must be an integer from 1 to 59');
  }
  return minutes;
};
const monitorTick = async () => {
  if (running) return;
  running = true;
  try { await checkSLAStatus(); }
  finally { running = false; }
};
exports.startSLAMonitor = ({ runImmediately = true } = {}) => {
  if (!isSlaAutomationEnabled() || monitorTask) return monitorTask;
  monitorTask = cron.schedule(`*/${getPollingMinutes()} * * * *`, monitorTick);
  logger.info(`SLA monitoring enabled: every ${getPollingMinutes()} minutes`);
  if (runImmediately) void monitorTick();
  return monitorTask;
};
exports.stopSLAMonitor = () => {
  if (monitorTask) monitorTask.stop();
  monitorTask = null;
};
exports.runIncidentSlaCheck = runIncidentSlaCheck;
exports.normalizeTerminalSla = normalizeTerminalSla;
exports.getPollingMinutes = getPollingMinutes;

/**
 * Calculate SLA deadline based on priority
 */
exports.DEFAULT_SLA_HOURS = DEFAULT_SLA_HOURS;
exports.getSLAHours = getSLAHours;
exports.initializeIncidentSLA = initializeIncidentSLA;
exports.isSlaAutomationEnabled = isSlaAutomationEnabled;
exports.calculateSLADeadline = (priority) => initializeIncidentSLA(priority).deadline;
exports.runWorkOrderSlaCheck = runWorkOrderSlaCheck;
exports.checkSLAStatus = checkSLAStatus;
