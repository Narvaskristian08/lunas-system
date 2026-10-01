const OneSignal = require('onesignal-node');
const Notification = require('../models/Notification');
const Incident = require('../models/Incident');
const WorkOrder = require('../models/WorkOrder');
const User = require('../models/User');
const logger = require('../utils/logger');

// Initialize OneSignal client
let oneSignalClient = null;

const initializeOneSignal = () => {
  if (!oneSignalClient && process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_REST_API_KEY) {
    try {
      oneSignalClient = new OneSignal.Client(
        process.env.ONESIGNAL_APP_ID,
        process.env.ONESIGNAL_REST_API_KEY
      );
      logger.info('OneSignal initialized successfully');
    } catch (error) {
      logger.error('OneSignal initialization error:', error);
    }
  }
};

const objectIdValue = (value) => {
  if (!value) return undefined;
  return value._id || value.id || value;
};

const isMongoId = (value) => /^[a-f\d]{24}$/i.test(value?.toString() || '');

/**
 * Keep report-linked notifications resolvable across every producer. Older
 * producers may only know the incident through a work order, so normalize the
 * relationship at the notification boundary before persisting or pushing it.
 */
const normalizeNotificationData = async (data = {}) => {
  const normalized = { ...data };
  const incidentCandidate = objectIdValue(normalized.incidentId);
  let incidentId = isMongoId(incidentCandidate) ? incidentCandidate : undefined;
  if (!incidentId && normalized.reportId && !normalized.reportNumber) {
    normalized.reportNumber = normalized.reportId;
  }
  const workOrderId = objectIdValue(normalized.workOrderId);

  try {
    if (!incidentId && workOrderId) {
      const workOrder = await WorkOrder.findById(workOrderId).select('incident');
      incidentId = objectIdValue(workOrder?.incident);
    }

    if (!incidentId && normalized.reportNumber) {
      const incident = await Incident.findOne({ reportNumber: normalized.reportNumber })
        .select('_id reportNumber');
      incidentId = objectIdValue(incident);
    }

    if (incidentId) {
      const incident = await Incident.findById(incidentId).select('_id reportNumber');
      if (incident) {
        normalized.incidentId = incident._id;
        normalized.reportNumber = normalized.reportNumber || incident.reportNumber;
      }
    }
  } catch (error) {
    // Preserve the original relationship if enrichment is temporarily
    // unavailable. Notification creation must not block the workflow.
    logger.warn(`Report notification enrichment skipped: ${error.message}`);
  }

  delete normalized.reportId;
  return normalized;
};

/**
 * Create and send notification
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} Created notification
 */
exports.createNotification = async (notificationData) => {
  try {
    const data = await normalizeNotificationData(notificationData.data);
    const notification = await Notification.create({ ...notificationData, data });
    
    // Notification.recipient is normally an ObjectId, not a populated User.
    // Resolve device tokens only when push delivery is configured, while the
    // persisted in-app notification remains durable even if lookup/delivery
    // is unavailable.
    if (process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_REST_API_KEY && notification.recipient) {
      try {
        const recipient = await User.findById(notification.recipient).select('deviceTokens');
        const playerIds = (recipient?.deviceTokens || []).map((device) => device.token).filter(Boolean);
        if (playerIds.length) {
          await exports.sendPushNotification(
            playerIds,
            notification.title,
            notification.message,
            notification.data
          );
        }
      } catch (error) {
        logger.warn(`Push recipient lookup skipped: ${error.message}`);
      }
    }

    return notification;
  } catch (error) {
    if (error.code === 11000 && notificationData.idempotencyKey) {
      return Notification.findOne({ idempotencyKey: notificationData.idempotencyKey });
    }
    logger.error('Notification creation error:', error);
    throw error;
  }
};

/**
 * Send push notification via OneSignal
 * @param {Array} playerIds - OneSignal player IDs (device identifiers)
 * @param {String} title - Notification title
 * @param {String} body - Notification body
 * @param {Object} data - Additional data
 * @returns {Promise<void>}
 */
exports.sendPushNotification = async (playerIds, title, body, data = {}) => {
  if (!oneSignalClient) {
    initializeOneSignal();
  }

  if (!oneSignalClient || !playerIds || playerIds.length === 0) {
    logger.warn('Push notification skipped: OneSignal not configured or no player IDs');
    return;
  }

  try {
    const notification = {
      contents: { en: body },
      headings: { en: title },
      include_player_ids: playerIds,
      data: {
        ...data,
        type: 'lunas_notification'
      },
      android_channel_id: process.env.ONESIGNAL_ANDROID_CHANNEL_ID || 'lunas-default',
      ios_badgeType: 'Increase',
      ios_badgeCount: 1
    };

    const response = await oneSignalClient.createNotification(notification);
    logger.info(`Push notifications sent via OneSignal: ${response.body.recipients} recipients`);
    
    if (response.body.errors) {
      logger.warn('OneSignal errors:', response.body.errors);
    }
  } catch (error) {
    logger.error('Push notification error:', error);
    // Don't throw - notification service should be non-blocking
  }
};

/**
 * Send notification to multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} data - Additional data
 * @returns {Promise<Array>} Created notifications
 */
exports.sendBulkNotifications = async (userIds, type, title, message, data = {}) => {
  try {
    const notifications = await Promise.all(userIds.map(async userId => ({
      recipient: userId,
      type,
      title,
      message,
      data: await normalizeNotificationData(data)
    })));

    return await Notification.insertMany(notifications);
  } catch (error) {
    logger.error('Bulk notification error:', error);
    throw error;
  }
};

/**
 * Send notification to all users with specific role
 * @param {String} role - User role
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} data - Additional data
 * @returns {Promise<void>}
 */
exports.sendToRole = async (role, type, title, message, data = {}) => {
  if (!oneSignalClient) {
    initializeOneSignal();
  }

  if (!oneSignalClient) {
    logger.warn('Push notification skipped: OneSignal not configured');
    return;
  }

  try {
    const notification = {
      contents: { en: message },
      headings: { en: title },
      filters: [
        { field: 'tag', key: 'role', relation: '=', value: role }
      ],
      data: {
        ...data,
        type: 'lunas_notification'
      }
    };

    const response = await oneSignalClient.createNotification(notification);
    logger.info(`Push notification sent to role '${role}': ${response.body.recipients} recipients`);
  } catch (error) {
    logger.error('Role notification error:', error);
  }
};

/**
 * Send notification to all users in a barangay
 * @param {String} barangay - Barangay name
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} data - Additional data
 * @returns {Promise<void>}
 */
exports.sendToBarangay = async (barangay, type, title, message, data = {}) => {
  if (!oneSignalClient) {
    initializeOneSignal();
  }

  if (!oneSignalClient) {
    logger.warn('Push notification skipped: OneSignal not configured');
    return;
  }

  try {
    const notification = {
      contents: { en: message },
      headings: { en: title },
      filters: [
        { field: 'tag', key: 'barangay', relation: '=', value: barangay }
      ],
      data: {
        ...data,
        type: 'lunas_notification'
      }
    };

    const response = await oneSignalClient.createNotification(notification);
    logger.info(`Push notification sent to barangay '${barangay}': ${response.body.recipients} recipients`);
  } catch (error) {
    logger.error('Barangay notification error:', error);
  }
};

/**
 * Notification templates for common events
 */
exports.notificationTemplates = {
  incidentSubmitted: (reportNumber) => ({
    type: 'incident_submitted',
    title: 'Report Submitted',
    message: `Your incident report ${reportNumber} has been submitted successfully and is pending validation.`
  }),
  
  incidentValidated: (reportNumber) => ({
    type: 'incident_validated',
    title: 'Report Validated',
    message: `Your incident report ${reportNumber} has been validated and approved.`
  }),

  incidentRejected: (reportNumber, reason) => ({
    type: 'incident_rejected',
    title: 'Report Rejected',
    message: `Your incident report ${reportNumber} was rejected: ${reason}`
  }),

  incidentDuplicate: (reportNumber, reason) => ({
    type: 'duplicate_detected',
    title: 'Report Marked as Duplicate',
    message: `Your incident report ${reportNumber} was marked as a duplicate: ${reason}`
  }),
  
  workOrderAssigned: (orderNumber) => ({
    type: 'work_order_assigned',
    title: 'New Work Order',
    message: `You have been assigned work order ${orderNumber}. Please review and accept.`
  }),

  workOrderReassigned: (orderNumber) => ({
    type: 'work_order_reassigned',
    title: 'Work Order Reassigned',
    message: `Work order ${orderNumber} has been reassigned. Please review the current assignment.`
  }),

  workOrderAccepted: (orderNumber) => ({
    type: 'work_order_accepted',
    title: 'Assignment Accepted',
    message: `Work order ${orderNumber} has been accepted by the assigned repair personnel.`
  }),

  workOrderDeclined: (orderNumber) => ({
    type: 'work_order_declined',
    title: 'Assignment Declined',
    message: `Work order ${orderNumber} needs reassignment after the assigned repair personnel declined it.`,
    priority: 'high'
  }),

  workOrderStarted: (orderNumber) => ({
    type: 'work_order_in_progress',
    title: 'Repair Started',
    message: `Repair work has started for work order ${orderNumber}.`
  }),

  workOrderProgress: (orderNumber, progressPercent) => ({
    type: 'work_order_progress',
    title: 'Repair Progress Updated',
    message: `Work order ${orderNumber} is now ${progressPercent}% complete.`
  }),

  workOrderSlaApproaching: (orderNumber) => ({
    type: 'sla_approaching',
    title: 'SLA Deadline Approaching',
    message: `Work order ${orderNumber} is approaching its SLA deadline.`,
    priority: 'high'
  }),

  workOrderSlaOverdue: (orderNumber) => ({
    type: 'sla_overdue',
    title: 'Work Order SLA Overdue',
    message: `Work order ${orderNumber} is overdue and needs attention.`,
    priority: 'urgent'
  }),
  
  workOrderCompleted: (orderNumber) => ({
    type: 'work_order_completed',
    title: 'Work Completed',
    message: `Work order ${orderNumber} has been completed and is pending verification.`
  }),
  
  repairVerified: (reportNumber) => ({
    type: 'repair_verified',
    title: 'Repair Verified',
    message: `The repair for incident ${reportNumber} has been verified and approved.`
  }),
  
  slaReminder: (reportNumber, hoursRemaining) => ({
    type: 'sla_reminder',
    title: 'SLA Reminder',
    message: `Incident ${reportNumber} is due within ${hoursRemaining} hours. Please expedite resolution.`,
    priority: 'high'
  }),
  
  slaEscalation: (reportNumber) => ({
    type: 'sla_escalation',
    title: 'SLA Overdue',
    message: `Incident ${reportNumber} has exceeded its SLA deadline and requires immediate attention.`,
    priority: 'urgent'
  })
};

// Initialize OneSignal on module load
initializeOneSignal();
