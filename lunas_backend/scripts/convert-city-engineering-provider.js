/** Idempotent role/workflow migration. Dry run by default; pass --apply. */
require('dotenv').config();
const mongoose = require('mongoose');
const CITY_ORGANIZATION = 'Dagupan City Engineering Office';

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const users = db.collection('users');
  const incidents = db.collection('incidents');
  const orders = db.collection('workorders');
  const apply = process.argv.includes('--apply');
  const accounts = await users.find({ role: 'city_engineer' }).toArray();
  const incidentMappings = {
    city_confirmed: 'barangay_validated',
    provider_accepted: 'provider_review',
    city_verification: 'provider_review',
    city_correction_required: 'rework_required'
  };
  const orderMappings = {
    provider_accepted: 'completed', city_correction_required: 'rework_required'
  };
  console.log(JSON.stringify({ apply, cityEngineerAccounts: accounts.length,
    incidentsToConvert: await incidents.countDocuments({ status: { $in: Object.keys(incidentMappings) } }),
    workOrdersToConvert: await orders.countDocuments({ status: { $in: Object.keys(orderMappings) } }) }));
  if (!apply) return;
  for (const account of accounts) {
    const now = new Date();
    // Capture conversion provenance before changing the account; no credentials are copied.
    await db.collection('role_migrations').updateOne({ _id: account._id }, { $setOnInsert: {
      migration: 'city-engineering-provider-v1', previousRole: account.role,
      previousOrganization: account.organization, organization: CITY_ORGANIZATION, recordedAt: now
    } }, { upsert: true });
    await users.updateOne({ _id: account._id, role: 'city_engineer' }, {
      $set: { role: 'utility_provider', utilityCompany: CITY_ORGANIZATION,
        organization: CITY_ORGANIZATION, expertise: ['road', 'drainage', 'streetlight'],
        refreshTokens: [], updatedAt: now },
      $inc: { tokenVersion: 1, version: 1 }
    });
  }
  for (const [previous, status] of Object.entries(incidentMappings)) {
    await incidents.updateMany({ status: previous }, {
      $set: { status, updatedAt: new Date() },
      $push: { statusHistory: { status, changedAt: new Date(), actorRole: 'system',
        notes: 'City Engineering provider conversion; returned to the responsible operational queue',
        metadata: { migration: 'city-engineering-provider-v1', previousStatus: previous } } }
    });
  }
  for (const [previous, status] of Object.entries(orderMappings)) {
    await orders.updateMany({ status: previous }, {
      $set: { status, updatedAt: new Date() }, $inc: { version: 1 },
      $push: { history: { type: 'provider_conversion', status, createdAt: new Date(), actorRole: 'system',
        notes: 'Returned for responsible-provider review or corrective work',
        metadata: { migration: 'city-engineering-provider-v1', previousStatus: previous } } }
    });
  }
  console.log('Provider conversion completed. Converted accounts must sign in again.');
}
main().catch(() => { console.error('Provider conversion failed; check database connectivity and permissions.'); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
