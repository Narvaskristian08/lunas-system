const cron = require('node-cron');
const Incident = require('../models/Incident');
const WorkOrder = require('../models/WorkOrder');
const User = require('../models/User');
const { createNotification, notificationTemplates } = require('./notificationService');
const logger = require('../utils/logger');

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
      status: { $nin: ['completed', 'verified', 'closed', 'rejected'] }
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

    // Check work orders
    const overdueWorkOrders = await WorkOrder.find({
      'sla.deadline': { $lt: new Date() },
      'sla.isOverdue': false,
      status: { $nin: ['completed', 'verified', 'rejected'] }
    });

    for (const workOrder of overdueWorkOrders) {
      workOrder.sla.isOverdue = true;
      await workOrder.save();

      logger.warn(`Work order ${workOrder.orderNumber} is now overdue`);
    }

    logger.info(`SLA check complete: ${overdueIncidents.length} incidents, ${overdueWorkOrders.length} work orders marked as overdue`);
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
        status: { $nin: ['completed', 'verified', 'closed', 'rejected'] },
        'sla.remindersSent': { $lt: reminderThresholds.indexOf(threshold) + 1 }
      }).populate('assignedTo');

      for (const incident of incidents) {
        if (incident.assignedTo) {
          const template = notificationTemplates.slaReminder(
            incident.reportNumber,
            threshold.hours
          );

          await createNotification({
            recipient: incident.assignedTo._id,
            ...template,
            data: {
              incidentId: incident._id,
              link: `/incidents/${incident._id}`
            }
          });

          incident.sla.remindersSent = reminderThresholds.indexOf(threshold) + 1;
          await incident.save();

          logger.info(`SLA reminder sent for incident ${incident.reportNumber}`);
        }
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

    // Notify assigned personnel
    if (incident.assignedTo) {
      await createNotification({
        recipient: incident.assignedTo,
        ...template,
        data: {
          incidentId: incident._id,
          link: `/incidents/${incident._id}`
        }
      });
    }

    // Notify barangay officials
    const barangayOfficials = await User.find({
      role: 'barangay_official',
      barangay: incident.location.address.barangay,
      isActive: true
    });

    for (const official of barangayOfficials) {
      await createNotification({
        recipient: official._id,
        ...template,
        data: {
          incidentId: incident._id,
          link: `/incidents/${incident._id}`
        }
      });
    }

    // If escalation level is high, notify city engineers
    if (incident.sla.escalationLevel >= 2) {
      const cityEngineers = await User.find({
        role: 'city_engineer',
        isActive: true
      });

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

/**
 * Start SLA monitoring cron jobs
 */
exports.startSLAMonitor = () => {
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
exports.calculateSLADeadline = (priority) => {
  const slaHours = {
    critical: parseInt(process.env.SLA_CRITICAL) || 48,
    high: parseInt(process.env.SLA_HIGH) || 72,
    medium: parseInt(process.env.SLA_MEDIUM) || 168,
    low: parseInt(process.env.SLA_LOW) || 336
  };

  const hours = slaHours[priority] || slaHours.medium;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};
