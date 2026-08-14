const OneSignal = require('onesignal-node');
const Notification = require('../models/Notification');
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

/**
 * Create and send notification
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} Created notification
 */
exports.createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    
    // Send push notification if recipient has device tokens
    if (notification.recipient && notification.recipient.deviceTokens?.length > 0) {
      await exports.sendPushNotification(
        notification.recipient.deviceTokens.map(dt => dt.token),
        notification.title,
        notification.message,
        notification.data
      );
    }

    return notification;
  } catch (error) {
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
    const notifications = userIds.map(userId => ({
      recipient: userId,
      type,
      title,
      message,
      data
    }));

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
    message: `Incident ${reportNumber} is due in ${hoursRemaining} hours. Please expedite resolution.`,
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
