const Notification = require('../models/Notification');
const User = require('../models/User');
const { notificationResource } = require('./notificationAccessService');
const logger = require('../utils/logger');
const uuid = value => /^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(value || '');

async function deliverNotification(id, now = new Date()) {
  const record = await Notification.findOneAndUpdate({ _id: id, 'delivery.state': { $in: ['pending', 'retry'] },
    'delivery.attempts': { $lt: 3 }, $or: [{ 'delivery.nextAttemptAt': { $exists: false } }, { 'delivery.nextAttemptAt': { $lte: now } }] },
  { $set: { 'delivery.state': 'processing', 'delivery.attemptedAt': now }, $inc: { 'delivery.attempts': 1 } }, { new: true });
  if (!record) return null;
  let state; let failureCode;
  try {
    const user = await User.findById(record.recipient).select('role isActive isArchived requiresActivation accountStatus deviceTokens utilityCompany repairOrganization barangay');
    if (!user?.isActive || user.isArchived || user.requiresActivation || ['suspended', 'deactivated', 'pending_activation'].includes(user.accountStatus)) state = 'suppressed';
    else if ((record.data?.incidentId || record.data?.workOrderId || record.data?.reportNumber) && !await notificationResource(user, record.data)) state = 'suppressed';
    else if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) state = 'not_configured';
    else {
      const devices = [...new Set((user.deviceTokens || []).map(item => item.token).filter(uuid))];
      if (!devices.length) state = 'no_devices';
      else {
        const result = await require('./notificationService').sendPushNotification(devices, 'LUNAS update', 'Open LUNAS to view your authorized update.', { notificationId: String(record._id) });
        state = result?.state || 'retry'; failureCode = result?.failureCode;
        if (result?.invalidTokens?.length) await User.updateOne({ _id: user._id }, { $pull: { deviceTokens: { token: { $in: result.invalidTokens } } } });
      }
    }
  } catch (_) { state = 'retry'; failureCode = 'delivery_unavailable'; }
  if (state === 'retry' && record.delivery.attempts >= 3) state = 'permanent_failure';
  const fields = { 'delivery.state': state, 'delivery.failureCode': failureCode || null,
    ...(state === 'retry' ? { 'delivery.nextAttemptAt': new Date(now.getTime() + (record.delivery.attempts === 1 ? 30000 : 120000)) } : {}),
    ...(state === 'provider_accepted' ? { 'delivery.providerAcceptedAt': now } : {}) };
  await Notification.updateOne({ _id: record._id, 'delivery.state': 'processing', 'delivery.attempts': record.delivery.attempts }, { $set: fields });
  return state;
}
async function runDeliveryBatch(now = new Date()) {
  const records = await Notification.find({ 'delivery.state': { $in: ['pending', 'retry'] }, 'delivery.attempts': { $lt: 3 },
    $or: [{ 'delivery.nextAttemptAt': { $exists: false } }, { 'delivery.nextAttemptAt': { $lte: now } }] }).select('_id').limit(20);
  for (const record of records) await deliverNotification(record._id, now);
}
function startDeliveryMonitor() {
  let running = false;
  const timer = setInterval(async () => {
    if (running) return; running = true;
    try { await runDeliveryBatch(); } catch (_) { logger.error('Notification delivery batch requires reconciliation'); }
    finally { running = false; }
  }, 30000);
  timer.unref(); return timer;
}
module.exports = { deliverNotification, runDeliveryBatch, startDeliveryMonitor, uuid };
