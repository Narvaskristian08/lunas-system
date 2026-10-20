/* Local-only agency workflow snapshots; no repair personnel or legacy engineer required. */
require('dotenv').config();
const mongoose = require('mongoose');
const Incident = require('../src/models/Incident');
const WorkOrder = require('../src/models/WorkOrder');
const User = require('../src/models/User');
const storage = require('../src/services/storageService');
const { testEvidence } = require('./seed-fixture-evidence');
const { ORGANIZATIONS, fixtureEmails, email, requireLocalSeedEnvironment } = require('./dagupan-seed-config');

const fixtures = [
  ['submitted', 'road'], ['submitted', 'drainage'], ['submitted', 'electrical'],
  ['submitted', 'water'], ['submitted', 'drainage'], ['submitted', 'streetlight'], ['submitted', 'drainage'],
  ['barangay_validated', 'water'], ['barangay_validated', 'road'],
  ['barangay_validated', 'drainage'], ['prioritized', 'water'],
  ['barangay_validated', 'road'], ['rejected', 'road'],
  ['provider_assigned', 'water', 'ready_for_work'],
  ['provider_assigned', 'drainage', 'pending_procurement'],
  ['in_progress', 'water', 'work_in_progress'],
  ['in_progress', 'drainage', 'work_in_progress'],
  ['in_progress', 'water', 'work_in_progress'],
  ['repair_completed', 'water', 'work_completed'],
  ['provider_assigned', 'drainage', 'correction_required'],
  ['repair_completed', 'water', 'work_completed'],
  ['provider_assigned', 'drainage', 'correction_required'],
  ['repair_completed', 'water', 'work_completed'], ['duplicate', 'road']
];

function incidentPath(status) {
  if (['rejected', 'duplicate'].includes(status)) return ['submitted', status];
  const path = ['submitted', 'barangay_validated', 'prioritized', 'provider_assigned', 'in_progress', 'repair_completed'];
  return path.slice(0, path.indexOf(status) + 1);
}

async function seed() {
  const uri = requireLocalSeedEnvironment();
  await mongoose.connect(uri);
  try {
    const users = {};
    for (const name of ['citizen', 'barangay']) {
      users[name] = await User.findOne({ email: fixtureEmails[name], isActive: true, isArchived: { $ne: true } });
      if (!users[name]) throw new Error(`Missing active Dagupan ${name} account; run seed:dagupan first.`);
    }
    const providers = {};
    for (const org of ORGANIZATIONS) {
      providers[org.code] = await User.findOne({ email: email(`provider-${org.code}`), role: 'utility_provider', isActive: true, isArchived: { $ne: true } });
      if (!providers[org.code]) throw new Error(`Missing active ${org.code} provider; run seed:dagupan first.`);
    }
    if (!process.env.S3_ENDPOINT || new URL(process.env.S3_ENDPOINT).hostname !== 'minio') {
      throw new Error('Mock evidence requires the local Compose object store');
    }
    const probe = await testEvidence('Storage readiness check', 'mock-web/probe');
    await storage.deleteFromStorage(probe.key);
    if (process.argv.includes('--refresh')) {
      const mocks = await Incident.find({ reportNumber: /^MOCK-WEB-/, description: /^\[SYNTHETIC TEST\]/ }).select('_id images').lean();
      const ids = mocks.map(item => item._id);
      const oldOrders = await WorkOrder.find({ incident: { $in: ids } }).select('repairEvidence').lean();
      for (const image of [...mocks.flatMap(item => item.images), ...oldOrders.flatMap(item => item.repairEvidence)]) {
        if (image.key?.startsWith('mock-web/')) await storage.deleteFromStorage(image.key);
      }
      await WorkOrder.deleteMany({ incident: { $in: ids } });
      await Incident.deleteMany({ _id: { $in: ids } });
    }
    let created = 0;
    let original;
    for (const [index, [status, category, agencyStatus]] of fixtures.entries()) {
      const reportNumber = `MOCK-WEB-${String(index + 1).padStart(3, '0')}`;
      const existing = await Incident.findOne({ reportNumber });
      if (existing) { if (index === 0) original = existing; continue; }
      const orgCode = category === 'water' ? 'dcwd' : category === 'electrical' ? 'decorp' : 'city-maintenance';
      const provider = providers[orgCode];
      const now = new Date();
      const submittedAt = new Date(now.getTime() - 6 * 3600000);
      const lifecycle = incidentPath(status);
      const stateTime = state => new Date(submittedAt.getTime() + (now - submittedAt) * lifecycle.indexOf(state) / Math.max(1, lifecycle.length - 1));
      const actor = state => state === 'submitted' ? users.citizen
        : ['provider_assigned', 'in_progress', 'repair_completed'].includes(state) ? provider : users.barangay;
      const priority = ['critical', 'high', 'medium', 'low'][index % 4];
      const incident = await Incident.create({
        reportNumber, reporter: users.citizen._id, category,
        subcategory: category === 'road' ? 'pothole' : category === 'drainage' ? 'blockage' : category === 'water' ? 'leak' : 'damage',
        description: `[SYNTHETIC TEST] ${category} report for the ${status} queue. No actual infrastructure incident is represented.`,
        location: { type: 'Point', coordinates: [120.3387 + index * 0.00003, 16.0433],
          address: { street: `Mock test location ${index + 1}`, barangay: 'Poblacion Oeste', city: 'Dagupan City', landmark: 'Synthetic web QA fixture' } },
        status, images: [await testEvidence(`${reportNumber} - citizen report`, 'mock-web/citizen')],
        sla: { state: 'not_started' }, createdAt: submittedAt,
        ...(lifecycle.includes('barangay_validated') ? { validatedBy: users.barangay._id, validatedAt: stateTime('barangay_validated') } : {}),
        ...(lifecycle.includes('prioritized') ? { priority, priorityAssignedBy: users.barangay._id, priorityAssignedAt: stateTime('prioritized') } : {}),
        ...(agencyStatus ? {
          assignedUtility: provider._id, providerAssignedBy: users.barangay._id, providerAssignedAt: stateTime('provider_assigned'),
          jurisdiction: { barangay: 'Poblacion Oeste', city: 'Dagupan City', confirmedBy: users.barangay._id, confirmedAt: stateTime('barangay_validated') },
          routing: { responsibleOrganization: provider.utilityCompany, responsibleRole: 'utility_provider', routedBy: users.barangay._id, routedAt: stateTime('provider_assigned'), reason: 'Synthetic agency workflow snapshot' },
          agencyStatus, agencyStatusNote: 'Synthetic agency progress; not an actual authorization or decision.',
          agencyStatusUpdatedBy: provider._id, agencyStatusUpdatedAt: now,
          ...(agencyStatus === 'work_completed' ? { agencyCompletionReportedBy: provider._id, agencyCompletionReportedAt: now } : {})
        } : {}),
        ...(status === 'rejected' ? { rejectedBy: users.barangay._id, rejectedAt: now, rejectionReason: 'Synthetic rejection fixture', rejectionNotes: 'Testing the rejected report detail.' } : {}),
        ...(status === 'duplicate' ? { duplicateOf: original._id, duplicateReason: 'Synthetic duplicate fixture', duplicateMarkedBy: users.barangay._id, duplicateMarkedAt: now } : {}),
        aiAnalysis: { analysisStatus: 'unavailable', advisoryOnly: true, requiresManualReview: true },
        statusHistory: lifecycle.map(state => ({ status: state, changedBy: actor(state)._id, actorRole: actor(state).role,
          changedAt: stateTime(state), notes: 'Synthetic local QA snapshot; not a real workflow decision.' }))
      });
      if (index === 0) original = incident;
      created++;
    }
    console.log(JSON.stringify({ reportsCreated: created, workOrdersCreated: 0,
      totalMockReports: await Incident.countDocuments({ reportNumber: /^MOCK-WEB-/ }) }));
  } finally { await mongoose.disconnect(); }
}
if (require.main === module) seed().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { seed, fixtures, incidentPath };
