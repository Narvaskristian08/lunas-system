const { createHash } = require('crypto');
const User = require('../models/User');
const Enrollment = require('../models/PushEnrollment');
const asyncHandler = require('../middleware/asyncHandler');
const { uuid } = require('../services/notificationDeliveryService');
const hash = token => createHash('sha256').update(token).digest('hex');

exports.enroll = asyncHandler(async (req, res) => {
  const { token, platform } = req.body;
  if (!uuid(token) || !['android', 'ios'].includes(platform) || Object.keys(req.body).some(key => !['token', 'platform'].includes(key))) return res.status(400).json({ success: false, message: 'Provide an Android/iOS OneSignal subscription ID' });
  if (await User.exists({ _id: { $ne: req.user._id }, 'deviceTokens.token': token })) return res.status(409).json({ success: false, message: 'Subscription is unavailable; unenroll its previous account first' });
  try {
    await Enrollment.findOneAndUpdate({ _id: hash(token), account: req.user._id }, { $setOnInsert: { account: req.user._id } }, { upsert: true, new: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    return res.status(409).json({ success: false, message: 'Subscription is unavailable' });
  }
  const updated = await User.updateOne({ _id: req.user._id, isActive: true, isArchived: { $ne: true },
    $or: [{ 'deviceTokens.token': token }, { 'deviceTokens.9': { $exists: false } }] },
  [{ $set: { deviceTokens: { $concatArrays: [{ $filter: { input: { $ifNull: ['$deviceTokens', []] }, as: 'device', cond: { $ne: ['$$device.token', token] } } },
    { $literal: [{ token, platform, addedAt: new Date() }] }] } } }]);
  if (!updated.matchedCount) return res.status(409).json({ success: false, message: 'Device limit or account state requires review' });
  res.json({ success: true, data: { enrolled: true } });
});
exports.unenroll = asyncHandler(async (req, res) => {
  const token = req.body.token;
  if (!uuid(token)) return res.status(400).json({ success: false, message: 'Valid subscription ID required' });
  await User.updateOne({ _id: req.user._id }, { $pull: { deviceTokens: { token } } });
  await Enrollment.deleteOne({ _id: hash(token), account: req.user._id });
  res.json({ success: true, data: { enrolled: false } });
});
