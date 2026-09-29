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

const notifyWorkOrderSla = async (workOrder, template) => {
  for (const recipient of workOrderRecipients(workOrder)) {
    await createNotification({
      recipient,
      ...template,
      data: {
        incidentId: workOrder.incident,
        workOrderId: workOrder._id,
        link: '/work-orders/' + workOrder._id
      }
    });
  }
};

/**
 * Invokable work-order SLA checker. It uses the same backend deadline
 * policy used by the API and records exactly one approaching and one overdue
 * alert per work order. Deployments may call it from their scheduler even when
 * the optional in-process cron monitor is disabled.
 */
const runWorkOrderSlaCheck = async (now = new Date()) => {
  const thresholdHours = Number.parseInt(process.env.SLA_APPROACHING_THRESHOLD_HOURS, 10) || 24;
  const horizon = new Date(now.getTime() + thresholdHours * 60 * 60 * 1000);
  const candidates = await WorkOrder.find({
    status: { $in: ACTIVE_WORK_ORDER_STATUSES },
    'sla.deadline': { $lte: horizon }
  });
  let approaching = 0;
  let overdue = 0;

  for (const workOrder of candidates) {
    const projection = getSlaProjection(workOrder.sla, now);
    if (projection.isOverdue && !workOrder.sla?.overdueNotifiedAt) {
      const updated = await WorkOrder.findOneAndUpdate(
        {
          _id: workOrder._id,
          status: { $in: ACTIVE_WORK_ORDER_STATUSES },
          $or: [
            { 'sla.overdueNotifiedAt': { $exists: false } },
            { 'sla.overdueNotifiedAt': null }
          ]
        },
        {
          $set: {
            'sla.state': 'overdue',
            'sla.isOverdue': true,
            'sla.overdueNotifiedAt': now
          },
          $push: {
            history: workOrderHistoryEntry({
              type: 'sla_overdue',
              actor: workOrder.createdBy,
              status: workOrder.status,
              progressPercent: workOrder.progressPercent,
              stage: workOrder.progressStage,
              notes: 'SLA deadline passed before repair was ready for completion',
              metadata: { systemEvent: true },
              now
            })
          },
          $inc: { version: 1 }
        },
        { new: true }
      );
      if (updated) {
        overdue += 1;
        await notifyWorkOrderSla(updated, notificationTemplates.workOrderSlaOverdue(updated.orderNumber));
        await createAuditLog({
          action: 'sla_overdue',
          performedBy: updated.createdBy,
          resourceType: 'WorkOrder',
          resourceId: updated._id,
          details: { systemEvent: true, deadline: updated.sla.deadline }
        });
      }
      continue;
    }

    if (projection.isApproaching && !workOrder.sla?.approachingNotifiedAt) {
      const updated = await WorkOrder.findOneAndUpdate(
        {
          _id: workOrder._id,
          status: { $in: ACTIVE_WORK_ORDER_STATUSES },
          $or: [
            { 'sla.approachingNotifiedAt': { $exists: false } },
            { 'sla.approachingNotifiedAt': null }
          ]
        },
        {
          $set: {
            'sla.state': 'approaching',
            'sla.isOverdue': false,
            'sla.approachingNotifiedAt': now
          },
          $push: {
            history: workOrderHistoryEntry({
              type: 'sla_approaching',
              actor: workOrder.createdBy,
              status: workOrder.status,
              progressPercent: workOrder.progressPercent,
              stage: workOrder.progressStage,
              notes: 'Work-order SLA deadline is approaching',
              metadata: { systemEvent: true, thresholdHours },
              now
            })
          },
          $inc: { version: 1 }
        },
        { new: true }
      );
      if (updated) {
        approaching += 1;
        await notifyWorkOrderSla(updated, notificationTemplates.workOrderSlaApproaching(updated.orderNumber));
        await createAuditLog({
          action: 'sla_approaching',
          performedBy: updated.createdBy,
          resourceType: 'WorkOrder',
          resourceId: updated._id,
          details: { systemEvent: true, deadline: updated.sla.deadline, thresholdHours }
        });
      }
    }
  }
  return { approaching, overdue };
};

/**
 * Check and update SLA status for incidents and work orders
 */
const checkSLAStatus = async () => {
  try {
    logger.info('Running SLA status check...');

    // Find incidents that are overdue but not marked as such
    const overdueIncidents = await Incident.find({
      'sla.deadline': { $lt: new Date() },
      'sla.isOverdue': false,
      status: { $nin: ['verified', 'resolved', 'closed', 'rejected', 'duplicate'] },
      'sla.state': 'active'
    });

    // Mark incidents as overdue
    for (const incident of overdueIncidents) {
      incident.sla.isOverdue = true;
      incident.sla.escalationLevel += 1;
      incident.sla.lastEscalatedAt = new Date();
      await incident.save();

      logger.warn(`Incident ${incident.reportNumber} is now overdue`);

      // Notify relevant personnel
      await notifyOverdueIncident(incident);
    }

    const workOrderResult = await runWorkOrderSlaCheck();
    logger.info(
      'SLA check complete: ' + overdueIncidents.length
      + ' incidents, ' + workOrderResult.approaching
      + ' approaching work orders, ' + workOrderResult.overdue
      + ' overdue work orders'
    );
  } catch (error) {
    logger.error('SLA status check error:', error);
  }
};

/**
 * Send SLA reminders before deadline
 */
const sendSLAReminders = async () => {
  try {
    logger.info('Sending SLA reminders...');

    const now = new Date();
    const reminderThresholds = [
      { hours: 24, sent: 'reminder_24h' },
      { hours: 12, sent: 'reminder_12h' },
      { hours: 6, sent: 'reminder_6h' },
      { hours: 2, sent: 'reminder_2h' }
    ];

    for (const threshold of reminderThresholds) {
      const deadlineTime = new Date(now.getTime() + threshold.hours * 60 * 60 * 1000);
      
      const incidents = await Incident.find({
        'sla.deadline': { 
          $gte: now,
          $lte: deadlineTime
        },
        'sla.isOverdue': false,
        status: { $nin: ['verified', 'resolved', 'closed', 'rejected', 'duplicate'] },
        'sla.state': 'active',
        'sla.remindersSent': { $lt: reminderThresholds.indexOf(threshold) + 1 }
      });

      for (const incident of incidents) {
        const recipients = await incidentSlaRecipients(incident);
        if (!recipients.length) continue;
        const template = notificationTemplates.slaReminder(incident.reportNumber, threshold.hours);
        await Promise.all(recipients.map((recipient) => createNotification({
          recipient,
          ...template,
          data: { incidentId: incident._id, link: `/incidents/${incident._id}` }
        })));
        incident.sla.remindersSent = reminderThresholds.indexOf(threshold) + 1;
        await incident.save();
        logger.info(`SLA reminder sent for incident ${incident.reportNumber}`);
      }
    }

    logger.info('SLA reminders sent');
  } catch (error) {
    logger.error('SLA reminder error:', error);
  }
};

/**
 * Notify relevant personnel about overdue incident
 */
const notifyOverdueIncident = async (incident) => {
  try {
    const template = notificationTemplates.slaEscalation(incident.reportNumber);

    const recipients = await incidentSlaRecipients(incident);
    await Promise.all(recipients.map((recipient) => createNotification({
      recipient,
      ...template,
      data: { incidentId: incident._id, link: `/incidents/${incident._id}` }
    })));

    // If escalation level is high, notify city engineers
    if (incident.sla.escalationLevel >= 2) {
      const cityEngineers = await User.find({
        role: 'city_engineer', isActive: true, isArchived: { $ne: true }
      }).select('_id');

      for (const engineer of cityEngineers) {
        await createNotification({
          recipient: engineer._id,
          type: 'sla_escalation',
          title: 'Critical SLA Escalation',
          message: `Incident ${incident.reportNumber} has been escalated to level ${incident.sla.escalationLevel}. Immediate action required.`,
          priority: 'urgent',
          data: {
            incidentId: incident._id,
            link: `/incidents/${incident._id}`
          }
        });
      }
    }
  } catch (error) {
    logger.error('Overdue notification error:', error);
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

/**
 * Start SLA monitoring cron jobs
 */
exports.startSLAMonitor = () => {
  // Deadline calculation is available independently. Do not silently enable
  // scheduled reminders/escalations; deployments must opt in explicitly.
  if (!isSlaAutomationEnabled()) {
    logger.info('Work-order SLA checks are available by invocation; in-process cron monitoring is disabled');
    return;
  }

  // Check SLA status every hour
  cron.schedule('0 * * * *', () => {
    checkSLAStatus();
  });

  // Send reminders every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    sendSLAReminders();
  });

  logger.info('SLA monitoring cron jobs started');
  
  // Run initial check
  checkSLAStatus();
  sendSLAReminders();
};

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
