const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Incident = require('../src/models/Incident');
const { createAuditLog } = require('../src/utils/auditLogger');
const {
  DAGUPAN_CITY,
  canonicalizeBarangay,
  canonicalizeDagupanCity
} = require('../src/data/dagupanBarangays');

const valueAt = (source, keys) => keys.reduce((value, key) => value?.[key], source);

const buildIncidentBarangayPlan = (incident, explicitBarangay) => {
  const submitted = valueAt(incident, ['location', 'address', 'barangay']);
  const confirmed = valueAt(incident, ['jurisdiction', 'barangay']);
  const submittedCity = valueAt(incident, ['location', 'address', 'city']);
  const confirmedCity = valueAt(incident, ['jurisdiction', 'city']);
  const correction = explicitBarangay && canonicalizeBarangay(explicitBarangay);

  if (explicitBarangay && !correction) {
    return { status: 'manual', reason: 'Explicit correction is not recognized' };
  }

  if (correction) {
    return {
      status: 'correctable',
      source: 'explicit',
      set: {
        'location.address.barangay': correction,
        'location.address.city': DAGUPAN_CITY,
        'jurisdiction.barangay': correction,
        'jurisdiction.city': DAGUPAN_CITY
      }
    };
  }

  const canonicalSubmitted = canonicalizeBarangay(submitted);
  const canonicalConfirmed = confirmed ? canonicalizeBarangay(confirmed) : null;
  if (!canonicalSubmitted) {
    return { status: 'manual', reason: 'Submitted barangay is missing or unrecognized' };
  }
  if (confirmed && !canonicalConfirmed) {
    return { status: 'manual', reason: 'Confirmed jurisdiction is unrecognized' };
  }
  if (canonicalConfirmed && canonicalConfirmed !== canonicalSubmitted) {
    return { status: 'manual', reason: 'Submitted and confirmed barangays disagree' };
  }
  if (submittedCity && !canonicalizeDagupanCity(submittedCity)) {
    return { status: 'manual', reason: 'Submitted city is not Dagupan City' };
  }
  if (confirmedCity && !canonicalizeDagupanCity(confirmedCity)) {
    return { status: 'manual', reason: 'Confirmed city is not Dagupan City' };
  }

  const set = {};
  if (submitted !== canonicalSubmitted) {
    set['location.address.barangay'] = canonicalSubmitted;
  }
  if (submittedCity !== DAGUPAN_CITY) {
    set['location.address.city'] = DAGUPAN_CITY;
  }
  if (confirmed && confirmed !== canonicalConfirmed) {
    set['jurisdiction.barangay'] = canonicalConfirmed;
  }
  if (confirmed && confirmedCity !== DAGUPAN_CITY) {
    set['jurisdiction.city'] = DAGUPAN_CITY;
  }

  return Object.keys(set).length
    ? { status: 'normalizable', source: 'canonical', set }
    : { status: 'canonical', set: {} };
};

const loadCorrections = (argument) => {
  if (!argument) return {};
  const filename = path.resolve(argument);
  const value = JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Corrections file must be an object keyed by incident ID');
  }
  return value;
};

async function auditIncidentBarangays({ apply = false, corrections = {} } = {}) {
  const incidents = await Incident.find({}).select(
    '_id reportNumber location.address.barangay location.address.city jurisdiction.barangay jurisdiction.city'
  ).lean();
  const result = { canonical: 0, normalizable: 0, manual: 0, corrected: 0, details: [] };

  for (const incident of incidents) {
    const id = incident._id.toString();
    const plan = buildIncidentBarangayPlan(incident, corrections[id]);
    if (plan.status === 'canonical') result.canonical += 1;
    else if (plan.status === 'manual') result.manual += 1;
    else result.normalizable += 1;

    if (plan.status === 'manual') {
      result.details.push({
        id,
        reportNumber: incident.reportNumber,
        submitted: incident.location?.address?.barangay || null,
        confirmed: incident.jurisdiction?.barangay || null,
        reason: plan.reason
      });
      continue;
    }
    if (!apply || !Object.keys(plan.set || {}).length) continue;

    await Incident.updateOne({ _id: incident._id }, { $set: plan.set });
    await createAuditLog({
      action: 'incident_jurisdiction_updated',
      actorType: 'system',
      source: 'system',
      resourceType: 'Incident',
      resourceId: incident._id,
      details: { migration: 'canonical_barangays', source: plan.source },
      changes: {
        before: {
          submitted: incident.location?.address?.barangay || null,
          confirmed: incident.jurisdiction?.barangay || null
        },
        after: plan.set
      }
    });
    result.corrected += 1;
  }

  return result;
}

if (require.main === module) {
  require('dotenv').config();
  const apply = process.argv.includes('--apply');
  const correctionsArg = process.argv.find((value) => value.startsWith('--corrections='));
  const corrections = loadCorrections(correctionsArg?.slice('--corrections='.length));
  (async () => {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await auditIncidentBarangays({ apply, corrections });
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', ...result }, null, 2));
  })().catch((error) => {
    console.error(`Incident barangay audit failed: ${error.message}`);
    process.exitCode = 1;
  }).finally(() => mongoose.disconnect());
}

module.exports = { auditIncidentBarangays, buildIncidentBarangayPlan };
