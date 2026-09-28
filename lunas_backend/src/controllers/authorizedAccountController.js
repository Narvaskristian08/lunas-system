const bcrypt = require('bcryptjs');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { createAuditLog } = require('../utils/auditLogger');
const { BARANGAYS } = require('../utils/validators');
const { AUTHORIZED_ROLES, accountStatus, canManageAdministrators } = require('../utils/accountPolicy');
const { createActivation, deliverActivation, hashActivationToken } = require('../services/accountActivationService');

const serializeAccount = user => ({
  ...user.toPublicJSON(),
  approval: user.approval,
  requiresActivation: Boolean(user.requiresActivation),
  activatedAt: user.activatedAt,
  version: user.__v || 0
});
const audit = (req, user, action, before, after, details = {}) => createAuditLog({
  action, performedBy: req.user?._id || user._id, affectedUser: user._id,
  resourceType: 'User', resourceId: user._id, changes: { before, after }, details,
  ipAddress: req.ip, userAgent: req.headers['user-agent']
});
const denied = (res, message, status = 403) => res.status(status).json({ success: false, message });
const conflict = res => denied(res, 'Account changed. Refresh and try again.', 409);
const checkActor = (req, res, target, role = target?.role) => {
  if (req.user?.role !== 'admin') {
    denied(res, 'Administrator access is required');
    return false;
  }
  if (target && String(target._id) === String(req.user._id)) {
    denied(res, 'Use My profile for personal details. Administrators cannot change their own access.');
    return false;
  }
  if ((target?.role === 'admin' || role === 'admin') && !canManageAdministrators(req.user)) {
    denied(res, 'This administrator is not authorized to provision or manage administrator accounts');
    return false;
  }
  return true;
};
const targetAccount = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || !AUTHORIZED_ROLES.includes(user.role)) {
    denied(res, 'Authorized account not found', 404);
    return null;
  }
  return user;
};
const approvedFields = (input, actor) => ({
  firstName: input.firstName, lastName: input.lastName, phone: input.phone,
  personnelId: input.personnelId || '', position: input.position, organization: input.organization,
  role: input.role,
  barangay: ['barangay_official', 'repair_personnel'].includes(input.role) ? input.barangay || undefined : undefined,
  utilityCompany: input.role === 'utility_provider' ? input.utilityCompany : undefined,
  repairOrganization: input.role === 'repair_personnel' ? input.repairOrganization : undefined,
  repairTeam: input.role === 'repair_personnel' ? input.repairTeam || '' : undefined,
  approval: {
    authority: input.approvalAuthority, reference: input.approvalReference,
    recordedBy: actor._id, recordedAt: new Date()
  }
});
const assignment = user => ({
  role: user.role, barangay: user.barangay || null, organization: user.organization || null,
  utilityCompany: user.utilityCompany || null, repairOrganization: user.repairOrganization || null
});
const revisionFilter = user => ({
  _id: user._id,
  // Legacy documents can predate Mongoose's version field.
  ...(user.__v === undefined ? { __v: { $exists: false } } : { __v: user.__v })
});
const revokedFields = { refreshTokens: [], deviceTokens: [] };
const unsetSecrets = { passwordResetToken: 1, passwordResetExpires: 1, activationTokenHash: 1, activationExpiresAt: 1 };

exports.getAuthorizedAccounts = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return denied(res, 'Administrator access is required');
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const filter = { role: req.query.role || { $in: AUTHORIZED_ROLES } };
  if (req.query.search) {
    const search = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = ['firstName', 'lastName', 'email', 'organization'].map(field => ({ [field]: { $regex: search, $options: 'i' } }));
  }
  if (req.query.status) {
    const status = req.query.status;
    filter.$and = [{ $or: [
      { accountStatus: status, ...(status !== 'deactivated' ? { isArchived: { $ne: true } } : {}) },
      ...(status === 'active' ? [{ accountStatus: { $exists: false }, isActive: true, isArchived: { $ne: true } }] : []),
      ...(status === 'deactivated' ? [{ isArchived: true }, { accountStatus: { $exists: false }, isActive: false }] : [])
    ] }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter)
  ]);
  res.json({ success: true, data: {
    accounts: users.map(serializeAccount), pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    roles: AUTHORIZED_ROLES, barangays: BARANGAYS, canManageAdministrators: canManageAdministrators(req.user)
  } });
});

exports.getAuthorizedAccount = asyncHandler(async (req, res) => {
  const user = await targetAccount(req, res);
  if (user) res.json({ success: true, data: serializeAccount(user) });
});

exports.createAuthorizedAccount = asyncHandler(async (req, res) => {
  if (!checkActor(req, res, null, req.body.role)) return;
  if (await User.exists({ email: req.body.email })) return denied(res, 'An account already uses this email', 409);
  const activation = createActivation();
  const user = await User.create({
    ...approvedFields(req.body, req.user), email: req.body.email,
    accountStatus: 'pending_activation', requiresActivation: true, isActive: false, isVerified: false,
    activationTokenHash: activation.tokenHash, activationExpiresAt: activation.expiresAt, activationSentAt: new Date()
  });
  await audit(req, user, 'authorized_account_created', null, {
    ...assignment(user), accountStatus: 'pending_activation', approval: user.approval
  });
  const delivery = await deliverActivation(user, activation);
  await audit(req, user, 'account_activation_sent', undefined, undefined, delivery);
  res.status(201).json({ success: true, data: { account: serializeAccount(user), delivery },
    message: delivery.delivered ? 'Account created. Activation email sent.' : 'Account created. Activation email was not delivered; configure delivery and resend.' });
});

exports.updateAuthorizedAccount = asyncHandler(async (req, res) => {
  const before = await targetAccount(req, res);
  if (!before || !checkActor(req, res, before, req.body.role)) return;
  if ((before.__v || 0) !== req.body.version) return conflict(res);
  const fields = approvedFields(req.body, req.user);
  const unset = { passwordResetToken: 1, passwordResetExpires: 1 };
  for (const key of Object.keys(fields)) {
    if (fields[key] === undefined) { unset[key] = 1; delete fields[key]; }
  }
  if (before.role !== req.body.role) {
    if (req.body.role === 'repair_personnel') fields.availability = 'available';
    else unset.availability = 1;
  }
  const user = await User.findOneAndUpdate(revisionFilter(before), {
    $set: { ...fields, ...revokedFields }, $unset: unset, $inc: { __v: 1, tokenVersion: 1 }
  }, { new: true, runValidators: true });
  if (!user) return conflict(res);
  await audit(req, user, 'user_updated', serializeAccount(before), serializeAccount(user));
  if (before.role !== user.role) await audit(req, user, 'role_changed', { role: before.role }, { role: user.role });
  if (JSON.stringify(assignment(before)) !== JSON.stringify(assignment(user))) {
    await audit(req, user, 'account_jurisdiction_changed', assignment(before), assignment(user));
  }
  res.json({ success: true, data: serializeAccount(user), message: 'Approved account details saved. Previous sessions revoked.' });
});

exports.changeAccountStatus = asyncHandler(async (req, res) => {
  const before = await targetAccount(req, res);
  if (!before || !checkActor(req, res, before)) return;
  if ((before.__v || 0) !== req.body.version) return conflict(res);
  const oldStatus = accountStatus(before);
  const requested = req.body.status;
  if (requested === oldStatus || (requested === 'suspended' && oldStatus !== 'active')
    || (requested === 'active' && !['suspended', 'deactivated'].includes(oldStatus))) {
    return denied(res, 'This account status transition is not allowed', 400);
  }
  const status = requested === 'active' && before.requiresActivation ? 'pending_activation' : requested;
  const user = await User.findOneAndUpdate(revisionFilter(before), {
    $set: { accountStatus: status, isActive: status === 'active', isArchived: false, ...revokedFields },
    $unset: { ...unsetSecrets, archivedAt: 1, archivedBy: 1, archiveReason: 1 },
    $inc: { __v: 1, tokenVersion: 1 }
  }, { new: true });
  if (!user) return conflict(res);
  const action = { active: 'account_reactivated', suspended: 'account_suspended', deactivated: 'account_deactivated' }[requested];
  await audit(req, user, action, { accountStatus: oldStatus }, { accountStatus: status }, { reason: req.body.reason });
  res.json({ success: true, data: serializeAccount(user), message: status === 'pending_activation'
    ? 'Account returned to Pending Activation. Send a new activation email.' : 'Account status updated. Previous sessions revoked.' });
});

exports.resendAccountActivation = asyncHandler(async (req, res) => {
  const before = await targetAccount(req, res);
  if (!before || !checkActor(req, res, before)) return;
  if ((before.__v || 0) !== req.body.version) return conflict(res);
  if (!before.requiresActivation || accountStatus(before) !== 'pending_activation') {
    return denied(res, 'Only pending accounts can receive activation links', 400);
  }
  const activation = createActivation();
  const user = await User.findOneAndUpdate({ ...revisionFilter(before),
    $or: [{ activationSentAt: { $lt: new Date(Date.now() - 60000) } }, { activationSentAt: { $exists: false } }]
  }, { $set: { activationTokenHash: activation.tokenHash, activationExpiresAt: activation.expiresAt, activationSentAt: new Date() },
    $inc: { __v: 1 } }, { new: true });
  if (!user) return denied(res, 'Wait one minute between activation emails, then refresh and try again.', 409);
  const delivery = await deliverActivation(user, activation);
  await audit(req, user, 'account_activation_sent', undefined, undefined, delivery);
  res.json({ success: true, data: { account: serializeAccount(user), delivery },
    message: delivery.delivered ? 'Activation email sent. Previous links are invalid.' : 'Activation email could not be delivered. Check delivery configuration and retry.' });
});

exports.activateAuthorizedAccount = asyncHandler(async (req, res) => {
  // The password is hashed with the same bcrypt algorithm/cost as User.save.
  // A single conditional write consumes the token and stores the password,
  // preventing replay even when two activation requests arrive together.
  const password = await bcrypt.hash(req.body.password, 10);
  const user = await User.findOneAndUpdate({
    activationTokenHash: hashActivationToken(req.body.token), activationExpiresAt: { $gt: new Date() },
    role: { $in: AUTHORIZED_ROLES }, accountStatus: 'pending_activation', requiresActivation: true,
    isActive: false, isArchived: { $ne: true }
  }, {
    $set: { password, isVerified: true, isActive: true, accountStatus: 'active', requiresActivation: false,
      activatedAt: new Date(), ...revokedFields },
    $unset: unsetSecrets, $inc: { __v: 1, tokenVersion: 1 }
  }, { new: true, runValidators: true });
  if (!user) return denied(res, 'Activation link is invalid, expired, or already used', 400);
  await audit(req, user, 'account_activation_completed', { accountStatus: 'pending_activation' }, { accountStatus: 'active' });
  res.json({ success: true, message: 'Account activated. Sign in with your new password.' });
});
