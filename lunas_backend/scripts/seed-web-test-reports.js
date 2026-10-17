/* Local-only synthetic workflow fixtures. Existing records are preserved. */
require('dotenv').config();
const mongoose = require('mongoose');
const Incident = require('../src/models/Incident');
const WorkOrder = require('../src/models/WorkOrder');
const User = require('../src/models/User');
const storage = require('../src/services/storageService');
const { testEvidence } = require('./seed-fixture-evidence');
const { ORGANIZATIONS, fixtureEmails, email, requireLocalSeedEnvironment } = require('./dagupan-seed-config');

function incidentPath(status) {
  const path = ['submitted', 'barangay_validated', 'city_confirmed', 'prioritized', 'provider_assigned',
    'repair_assigned', 'in_progress', 'repair_completed', 'provider_review', 'provider_accepted',
    'city_verification', 'verified', 'resolved', 'closed'];
  if (status === 'rejected' || status === 'duplicate') return ['submitted', status];
  if (status === 'clarification_required') return ['submitted', 'barangay_validated', status];
  if (status === 'rework_required') return [...path.slice(0, 9), status];
  if (status === 'city_correction_required') return [...path.slice(0, 11), status];
  return path.slice(0, path.indexOf(status) + 1);
}


async function seed() {
  const uri = requireLocalSeedEnvironment();
  await mongoose.connect(uri);
  try {
    const users = {};
    for (const name of ['citizen', 'barangay', 'engineer']) {
      users[name] = await User.findOne({ email: fixtureEmails[name] });
      if (!users[name]) throw new Error(`Missing Dagupan ${name} account; run seed:dagupan first.`);
    }
    const providers = {};
    const repairPersonnel = {};
    for (const org of ORGANIZATIONS) {
      providers[org.code] = await User.findOne({ email: email(`provider-${org.code}`) });
      repairPersonnel[org.code] = await User.findOne({ email: email(`repair-${org.code}`) });
      if (!providers[org.code] || !repairPersonnel[org.code]) throw new Error(`Missing ${org.code} provider/repair account`);
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
    const fixtures = [
      ['submitted', 'road'], ['submitted', 'drainage'], ['submitted', 'electrical'],
      ['submitted', 'water'], ['submitted', 'drainage'], ['submitted', 'streetlight'], ['submitted', 'drainage'],
      ['barangay_validated', 'water'], ['barangay_validated', 'road'],
      ['city_confirmed', 'drainage'], ['prioritized', 'water'],
      ['clarification_required', 'road'], ['rejected', 'road'],
      ['provider_assigned', 'water', 'pending'],
      ['repair_assigned', 'drainage', 'accepted'],
      ['in_progress', 'water', 'in_progress'],
      ['in_progress', 'drainage', 'in_progress', 'approaching'],
      ['in_progress', 'water', 'in_progress', 'overdue'],
      ['provider_review', 'water', 'completed'],
      ['rework_required', 'drainage', 'rework_required'],
      ['city_verification', 'water', 'provider_accepted'],
      ['city_correction_required', 'drainage', 'city_correction_required'],
      ['closed', 'water', 'verified'], ['duplicate', 'road']
    ];
    let created = 0;
    let orders = 0;
    let original;
    for (const [index, [status, category, orderStatus, risk]] of fixtures.entries()) {
      const orgCode = category === 'water' ? 'dcwd' : category === 'electrical' ? 'decorp' : 'city-maintenance';
      users.utility = providers[orgCode];
      users.repair = repairPersonnel[orgCode];
      const reportNumber = `MOCK-WEB-${String(index + 1).padStart(3, '0')}`;
      const existing = await Incident.findOne({ reportNumber });
      if (existing && (!orderStatus || existing.workOrder)) { if (index === 0) original = existing; continue; }
      if (existing) {
        for (const image of existing.images) if (image.key?.startsWith('mock-web/')) await storage.deleteFromStorage(image.key);
        await Incident.deleteOne({ _id: existing._id });
      }
      const now = new Date();
      const earlier = hours => new Date(now.getTime() - hours * 3600000);
      const priority = ['critical', 'high', 'medium', 'low'][index % 4];
      const target = { critical: 48, high: 72, medium: 168, low: 336 }[priority];
      const closed = orderStatus === 'verified';
      const deadline = new Date(now.getTime() + (risk === 'overdue' ? -6 : risk === 'approaching' ? 12 : target - 4) * 3600000);
      const sla = orderStatus ? { targetResolutionTime: target,
        startedAt: new Date(deadline.getTime() - target * 3600000), deadline,
        state: closed ? 'met' : risk || 'active', isOverdue: risk === 'overdue',
        ...(closed ? { closedAt: now } : {}) } : { state: 'not_started' };
      const assigned = orderStatus && orderStatus !== 'pending';
      const completed = ['completed', 'provider_accepted', 'verified', 'rework_required', 'city_correction_required'].includes(orderStatus);
      const citizenEvidence = await testEvidence(`${reportNumber} - citizen report`, 'mock-web/citizen');
      const lifecycle = incidentPath(status);
      const actors = state => ['submitted'].includes(state) ? users.citizen
        : ['barangay_validated', 'rejected', 'duplicate'].includes(state) ? users.barangay
          : ['repair_assigned', 'provider_accepted', 'city_verification', 'rework_required'].includes(state) ? users.utility
            : ['in_progress', 'repair_completed', 'provider_review'].includes(state) ? users.repair : users.engineer;
      const submittedAt = orderStatus ? new Date(sla.startedAt.getTime() - 2 * 3600000) : earlier(6);
      const stateTime = state => {
        if (orderStatus) {
          const routedTimes = { submitted: submittedAt, barangay_validated: new Date(sla.startedAt.getTime() - 90 * 60000),
            city_confirmed: new Date(sla.startedAt.getTime() - 45 * 60000), prioritized: new Date(sla.startedAt.getTime() - 30 * 60000),
            provider_assigned: sla.startedAt, repair_assigned: earlier(3), in_progress: earlier(2),
            repair_completed: earlier(1), provider_review: earlier(1), provider_accepted: earlier(0.5), city_verification: earlier(0.5) };
          return routedTimes[state] || now;
        }
        const offset = lifecycle.indexOf(state);
        return new Date(submittedAt.getTime() + (now - submittedAt) * Math.max(0, offset) / Math.max(1, lifecycle.length - 1));
      };
      const incident = await Incident.create({ reportNumber, reporter: users.citizen._id, category,
        subcategory: category === 'road' ? 'pothole' : category === 'drainage' ? 'blockage' : category === 'water' ? 'leak' : 'damage',
        description: `[SYNTHETIC TEST] ${category} report for the ${status} queue. No actual infrastructure incident is represented.`,
        location: { type: 'Point', coordinates: [120.3387 + index * 0.00003, 16.0433],
          address: { street: `Mock test location ${index + 1}`, barangay: 'Poblacion Oeste', city: 'Dagupan City', landmark: 'Synthetic web QA fixture' } },
        status, images: [citizenEvidence], sla, createdAt: submittedAt,
        ...(lifecycle.includes('barangay_validated') ? { validatedBy: users.barangay._id, validatedAt: stateTime('barangay_validated') } : {}),
        ...(['city_confirmed', 'prioritized'].includes(status) || orderStatus ? {
          cityConfirmedBy: users.engineer._id, cityConfirmedAt: stateTime('city_confirmed'),
          jurisdiction: { barangay: 'Poblacion Oeste', city: 'Dagupan City', confirmedBy: users.engineer._id, confirmedAt: stateTime('city_confirmed') }
        } : {}),
        ...(status === 'prioritized' || orderStatus ? { priority, priorityAssignedBy: users.engineer._id, priorityAssignedAt: stateTime('prioritized') } : {}),
        ...(orderStatus ? { assignedUtility: users.utility._id, providerAssignedBy: users.engineer._id, providerAssignedAt: sla.startedAt,
          routing: { responsibleOrganization: users.utility.utilityCompany, responsibleRole: 'utility_provider', routedBy: users.engineer._id, routedAt: sla.startedAt, reason: 'Synthetic workflow fixture' } } : {}),
        ...(status === 'clarification_required' ? { clarificationReason: 'Synthetic request: clarify the affected road location.', clarificationRequestedBy: users.engineer._id, clarificationRequestedAt: now } : {}),
        ...(status === 'rejected' ? { rejectedBy: users.barangay._id, rejectedAt: now, rejectionReason: 'Synthetic rejection fixture', rejectionNotes: 'Testing the rejected report detail.' } : {}),
        ...(status === 'duplicate' ? { duplicateOf: original._id, duplicateReason: 'Synthetic duplicate fixture', duplicateMarkedBy: users.barangay._id, duplicateMarkedAt: now } : {}),
        ...(closed ? { finalVerifiedBy: users.engineer._id, finalVerifiedAt: now, closedAt: now } : {}),
        ...(completed ? { repairCompletedAt: earlier(1) } : {}),
        ...(['provider_accepted', 'city_correction_required', 'verified'].includes(orderStatus) ? { providerAcceptedBy: users.utility._id, providerAcceptedAt: earlier(0.5) } : {}),
        aiAnalysis: { analysisStatus: 'unavailable', advisoryOnly: true, requiresManualReview: true },
        statusHistory: lifecycle.map(state => ({ status: state, changedBy: actors(state)._id, actorRole: actors(state).role,
          changedAt: stateTime(state), notes: 'Synthetic local QA workflow fixture; not a real decision.' }))
      });
      if (index === 0) original = incident;
      if (orderStatus) {
        const assignmentId = new mongoose.Types.ObjectId();
        const progressPercent = completed ? 100 : 0;
        const repairEvidence = completed ? { ...await testEvidence(`${reportNumber} - completed repair`, 'mock-web/repair'),
          uploadedBy: users.repair._id, uploadedAt: earlier(1), caption: 'Synthetic completion evidence for local testing' } : null;
        const history = [{ type: 'created', status: 'pending', progressPercent: 0, actor: users.engineer._id, actorRole: 'city_engineer', createdAt: sla.startedAt, notes: 'Synthetic local QA: Engineering routed the report and created its work order.' }];
        if (assigned) history.push({ type: 'assigned', status: 'accepted', progressPercent: 0, actor: users.utility._id, actorRole: 'utility_provider', createdAt: earlier(3), notes: 'Synthetic QA: repair personnel assigned.' });
        if (orderStatus === 'in_progress' || completed) history.push({ type: 'started', status: 'in_progress', progressPercent: 0, actor: users.repair._id, actorRole: 'repair_personnel', createdAt: earlier(2), notes: 'Synthetic QA: repair started.' });
        if (completed) history.push({ type: 'repair_completed', status: 'completed', progressPercent: 100, actor: users.repair._id, actorRole: 'repair_personnel', createdAt: earlier(1), notes: 'Synthetic QA: completion evidence submitted for provider review.' });
        const reviews = [];
        if (['rework_required', 'provider_accepted', 'city_correction_required', 'verified'].includes(orderStatus)) {
          const correction = orderStatus === 'rework_required';
          reviews.push({ stage: 'utility_provider', decision: correction ? 'correction_required' : 'accepted', actor: users.utility._id, createdAt: earlier(0.5), reason: correction ? 'Synthetic QA: repair needs correction.' : 'Synthetic QA: provider accepted completion.', ...(correction ? { instructions: 'Check the repair and submit updated evidence.' } : {}) });
          history.push({ type: correction ? 'provider_correction_requested' : 'provider_accepted', status: correction ? 'rework_required' : 'provider_accepted', actor: users.utility._id, actorRole: 'utility_provider', createdAt: earlier(0.5), notes: reviews.at(-1).reason });
        }
        if (orderStatus === 'city_correction_required' || closed) {
          reviews.push({ stage: 'city_engineer', decision: closed ? 'verified' : 'correction_required', actor: users.engineer._id, createdAt: now, reason: closed ? 'Synthetic QA: city verified completion.' : 'Synthetic QA: city returned the repair.', ...(!closed ? { instructions: 'Correct the repair and resubmit it through provider review.' } : {}) });
          history.push({ type: closed ? 'city_verified' : 'city_returned', status: orderStatus, actor: users.engineer._id, actorRole: 'city_engineer', createdAt: now, notes: reviews.at(-1).reason });
        }
        const order = await WorkOrder.create({ incident: incident._id,
          createdAt: sla.startedAt,
          responsibleOrganization: users.utility.utilityCompany, responsibleRole: 'utility_provider',
          jurisdiction: incident.jurisdiction.toObject(), priority, status: orderStatus, sla,
          createdBy: users.engineer._id, instructions: 'Synthetic QA fixture: use this record to test the workflow.',
          assignmentState: assigned ? 'accepted' : 'unassigned',
          ...(assigned ? { assignedTo: users.repair._id, assignedBy: users.utility._id, assignedAt: earlier(3), acceptedAt: earlier(3), currentAssignment: assignmentId,
            assignments: [{ _id: assignmentId, assignee: users.repair._id, assignedBy: users.utility._id, assignedAt: earlier(3), acceptedAt: earlier(3), status: 'accepted', active: true }] } : {}),
          ...(orderStatus === 'in_progress' || completed ? { startedAt: earlier(2), actualStartTime: earlier(2) } : {}),
          ...(completed ? { readyForCompletionAt: earlier(1), actualCompletionTime: earlier(1) } : {}),
          progressPercent, progressStage: completed ? 'ready_for_completion' : 'assigned',
          repairEvidence: repairEvidence ? [repairEvidence] : [],
          progressUpdates: repairEvidence ? [{ previousPercent: 0, progressPercent: 100, stage: 'ready_for_completion', notes: 'Synthetic completion submission', updatedBy: users.repair._id, updatedAt: earlier(1), location: { type: 'Point', coordinates: incident.location.coordinates } }] : [],
          reviews, history
        });
        incident.workOrder = order._id;
        await incident.save();
        orders++;
      }
      created++;
    }
    for (const personnel of Object.values(repairPersonnel)) {
      const queued = await WorkOrder.exists({ assignedTo: personnel._id, status: { $in: ['accepted', 'in_progress', 'rework_required', 'city_correction_required'] } });
      await User.updateOne({ _id: personnel._id }, { $set: { availability: queued ? 'assigned' : 'available' } });
    }
    console.log(JSON.stringify({ reportsCreated: created, workOrdersCreated: orders,
      totalMockReports: await Incident.countDocuments({ reportNumber: /^MOCK-WEB-/ }) }));
  } finally { await mongoose.disconnect(); }
}
seed().catch(error => { console.error(error.message); process.exitCode = 1; });
