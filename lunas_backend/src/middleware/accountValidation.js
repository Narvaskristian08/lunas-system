const { body, query } = require('express-validator');
const { AUTHORIZED_ROLES, ACCOUNT_STATUSES } = require('../utils/accountPolicy');
const { isValidBarangay } = require('../utils/validators');

const PROFILE_FIELDS = ['firstName', 'lastName', 'phone', 'personnelId', 'position', 'organization', 'role',
  'barangay', 'utilityCompany', 'repairOrganization', 'repairTeam', 'approvalAuthority', 'approvalReference'];
const onlyFields = fields => body().custom(value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).some(key => !fields.includes(key))) {
    throw new Error('Request contains unsupported account fields');
  }
  return true;
});
const text = (key, max, optional = false) => {
  const rule = body(key);
  return (optional ? rule.optional() : rule).isString().bail().trim()
    .isLength({ min: optional ? 0 : 1, max }).withMessage(`${key} is required or exceeds its length limit`);
};
const profileRules = [
  text('firstName', 80), text('lastName', 80),
  body('phone').isString().bail().trim().matches(/^(\+639|09)\d{9}$/).withMessage('Valid Philippine phone number is required'),
  text('personnelId', 80, true), text('position', 120), text('organization', 160),
  body('role').isIn(AUTHORIZED_ROLES).withMessage('Choose a supported personnel role'),
  body('barangay').optional().isString().bail().trim().custom(value => !value || isValidBarangay(value))
    .withMessage('Choose a recognized Dagupan barangay'),
  text('utilityCompany', 160, true), text('repairOrganization', 160, true), text('repairTeam', 120, true),
  text('approvalAuthority', 160), text('approvalReference', 500),
  body().custom(value => {
    if (value.role === 'barangay_official' && !value.barangay) throw new Error('Barangay officials require an assigned barangay');
    if (value.role === 'repair_personnel' && !value.repairOrganization) throw new Error('Repair personnel require an assigned repair organization');
    if (value.role === 'utility_provider' && !value.utilityCompany) throw new Error('Utility providers require an assigned utility company');
    if (!['barangay_official', 'repair_personnel'].includes(value.role) && value.barangay) throw new Error('This role uses city or organization scope, not a barangay assignment');
    if (value.role !== 'utility_provider' && value.utilityCompany) throw new Error('Utility company applies only to utility providers');
    if (value.role !== 'repair_personnel' && (value.repairOrganization || value.repairTeam)) throw new Error('Repair assignment applies only to repair personnel');
    return true;
  })
];

exports.createAccountValidation = [
  onlyFields([...PROFILE_FIELDS, 'email']),
  body('email').isString().bail().isEmail().normalizeEmail(), ...profileRules
];
exports.updateAccountValidation = [onlyFields([...PROFILE_FIELDS, 'version']), ...profileRules,
  body('version').isInt({ min: 0 }).toInt()];
exports.accountStatusValidation = [onlyFields(['status', 'reason', 'version']),
  body('status').isIn(['active', 'suspended', 'deactivated']), text('reason', 500),
  body('version').isInt({ min: 0 }).toInt()];
exports.resendActivationValidation = [onlyFields(['version']), body('version').isInt({ min: 0 }).toInt()];
exports.activateAccountValidation = [onlyFields(['token', 'password']),
  body('token').isString().bail().matches(/^[a-f0-9]{64}$/).withMessage('Invalid activation link'),
  body('password').isString().bail().isLength({ min: 8, max: 128 })
    .custom(value => Buffer.byteLength(value, 'utf8') <= 72)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Use 8–72 bytes with uppercase, lowercase, and a number')];
exports.accountQueryValidation = [
  query('role').optional().isIn(AUTHORIZED_ROLES),
  query('status').optional().isIn(ACCOUNT_STATUSES),
  query('search').optional().isString().bail().trim().isLength({ max: 100 })
];
