/*
 * Update display metadata on local seeded accounts without changing identity,
 * credentials, RBAC identifiers, assignments, or operational history.
 *
 * This script is intentionally local-only. It defaults to a dry run. Applying
 * changes requires both an explicit environment opt-in and a confirmation
 * token so a production URI cannot be used accidentally.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const CONFIRMATION = 'LUNAS-LOCAL-ROLE-TERMINOLOGY';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1', 'mongodb']);
const SEEDED_EMAIL = /^(?:dagupan\.(?:admin|citizen|barangay-[^@]+|tanod-[^@]+|provider-[^@]+)|demo\.(?:admin|citizen|barangay|utility))@lunas\.test$/i;
const OLD_TERMINOLOGY = /(?:Barangay\s+Secretary|Secretary|Barangay\s+Tanod|Tanod)/i;

function replaceRoleTerminology(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/Barangay\s+Secretary/gi, 'Barangay Infrastructure Committee')
    .replace(/Secretary/gi, 'Infrastructure Committee')
    .replace(/Barangay\s+Tanod/gi, 'Barangay Committee Staff')
    .replace(/Tanod/gi, 'Committee Staff');
}

function isSeededAccount(account) {
  return Boolean(account?.email && SEEDED_EMAIL.test(account.email));
}

function targetOfficialMetadata(account) {
  if (account.role !== 'barangay_official' || !account.barangay) return {};
  const changes = {};
  const legacyName = account.lastName === 'Official' || /(?:Barangay\s+Official|Secretary)$/i.test(account.lastName || '')
    || /^(?:Secretary|Barangay Secretary)$/i.test(account.firstName || '');
  if (legacyName) {
    changes.firstName = 'Infrastructure Committee';
    changes.lastName = account.barangay;
  }
  if (legacyName || account.position === 'Local barangay account' || OLD_TERMINOLOGY.test(account.position || '')) {
    changes.position = 'Barangay Infrastructure Committee';
  }
  return changes;
}

function buildChanges(account) {
  if (!isSeededAccount(account)) return {};
  const changes = { ...targetOfficialMetadata(account) };
  for (const field of ['firstName', 'lastName', 'position']) {
    if (field in changes) continue;
    const value = account[field];
    if (OLD_TERMINOLOGY.test(value || '')) changes[field] = replaceRoleTerminology(value);
  }
  if (account.approval?.reference && OLD_TERMINOLOGY.test(account.approval.reference)) {
    changes['approval.reference'] = replaceRoleTerminology(account.approval.reference);
  }
  return changes;
}

function assertLocalDatabase(uriString, env = process.env) {
  if (env.NODE_ENV === 'production') throw new Error('Role terminology migration is disabled in production.');
  if (env.ALLOW_ROLE_TERMINOLOGY_MIGRATION !== 'true') {
    throw new Error('Set ALLOW_ROLE_TERMINOLOGY_MIGRATION=true for a local role terminology migration.');
  }
  if (env.ROLE_TERMINOLOGY_MIGRATION_CONFIRM !== CONFIRMATION) {
    throw new Error(`Set ROLE_TERMINOLOGY_MIGRATION_CONFIRM=${CONFIRMATION} to apply local changes.`);
  }
  if (!uriString) throw new Error('MONGODB_URI is required.');
  let uri;
  try {
    uri = new URL(uriString);
  } catch {
    throw new Error('MONGODB_URI is not a valid MongoDB URI.');
  }
  if (!['mongodb:', 'mongodb+srv:'].includes(uri.protocol) || !LOCAL_HOSTS.has(uri.hostname) || uri.pathname !== '/lunas_db') {
    throw new Error('Only the local lunas_db database is allowed.');
  }
  if (uri.hostname === 'mongodb' && env.ROLE_TERMINOLOGY_MIGRATION_DOCKER !== 'true') {
    throw new Error('Docker MongoDB requires ROLE_TERMINOLOGY_MIGRATION_DOCKER=true.');
  }
  return uriString;
}

async function migrate({ uri = process.env.MONGODB_URI, dryRun = !process.argv.includes('--apply') } = {}) {
  assertLocalDatabase(uri);
  await mongoose.connect(uri);
  const result = { dryRun, matched: 0, changed: 0, unchanged: 0, accounts: [] };
  try {
    const accounts = await User.find({ email: { $regex: SEEDED_EMAIL } })
      .select('role barangay email firstName lastName position approval.reference')
      .lean();
    result.matched = accounts.length;
    for (const account of accounts) {
      const changes = buildChanges(account);
      const changedFields = Object.keys(changes);
      if (!changedFields.length) {
        result.unchanged++;
        continue;
      }
      result.changed++;
      result.accounts.push({ role: account.role, barangay: account.barangay || null, changedFields });
      if (!dryRun) {
        await User.collection.updateOne({ _id: account._id }, { $set: changes });
      }
    }
    return result;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  migrate()
    .then(result => console.log(JSON.stringify(result)))
    .catch(error => {
      console.error(error.message);
      process.exitCode = 1;
    });
}

module.exports = {
  CONFIRMATION,
  SEEDED_EMAIL,
  replaceRoleTerminology,
  isSeededAccount,
  targetOfficialMetadata,
  buildChanges,
  assertLocalDatabase,
  migrate
};
