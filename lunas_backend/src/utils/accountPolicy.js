const USER_ROLES = Object.freeze([
  'citizen', 'repair_personnel', 'barangay_official', 'city_engineer', 'utility_provider', 'admin'
]);
const AUTHORIZED_ROLES = Object.freeze(USER_ROLES.filter(role => role !== 'citizen'));
const ACCOUNT_STATUSES = Object.freeze(['pending_activation', 'active', 'suspended', 'deactivated']);

// Older documents keep their existing flags until their next lifecycle change.
const accountStatus = user => user.isArchived ? 'deactivated'
  : user.accountStatus || (user.isActive ? 'active' : 'deactivated');
const canSignIn = user => Boolean(user && user.isActive && !user.isArchived
  && !user.requiresActivation && accountStatus(user) === 'active');
const canManageAdministrators = actor => actor?.role === 'admin'
  && (process.env.AUTHORIZED_ADMIN_PROVISIONER_IDS || '').split(',')
    .map(id => id.trim()).filter(Boolean).includes(String(actor._id));

module.exports = { USER_ROLES, AUTHORIZED_ROLES, ACCOUNT_STATUSES, accountStatus, canSignIn, canManageAdministrators };
