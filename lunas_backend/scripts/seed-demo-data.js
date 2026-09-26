/*
 * Local-only synthetic data for demonstrations and QA evidence.
 *
 * This is intentionally the target of the existing `npm run seed:demo`
 * command. It refuses every database except a local `lunas_demo` database and
 * only removes records that carry the demo account/report identifiers below.
 */
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Incident = require('../src/models/Incident');
const AuditLog = require('../src/models/AuditLog');

const DEMO_EMAIL_DOMAIN = '@lunas.test';
const DEMO_EMAIL_PATTERN = new RegExp(`^demo\\..+${DEMO_EMAIL_DOMAIN.replace('.', '\\.')}$`, 'i');
const DEMO_REPORT_PREFIX = 'DEMO-QA-';
const DEFAULT_PASSWORD = 'LunasDemo2026!';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function requireSafeEnvironment() {
  if (process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Refusing to seed: set ALLOW_DEMO_SEED=true explicitly.');
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Refusing to seed: MONGODB_URI is required.');

  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error('Refusing to seed: MONGODB_URI is not a valid MongoDB URI.');
  }

  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol)) {
    throw new Error('Refusing to seed: MONGODB_URI must use a MongoDB protocol.');
  }

  if (!LOCAL_HOSTS.has(parsed.hostname)) {
    throw new Error('Refusing to seed: only localhost, 127.0.0.1, or ::1 are allowed.');
  }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, '').split('/')[0]);
  if (databaseName !== 'lunas_demo') {
    throw new Error('Refusing to seed: database name must be exactly lunas_demo.');
  }

  return uri;
}

function demoUser({
  firstName,
  lastName,
  email,
  role,
  phone,
  isActive = true,
  address,
  barangay,
  utilityCompany,
  expertise,
  repairOrganization,
  repairTeam,
  availability
}) {
  return {
    firstName,
    lastName,
    email,
    phone,
    password: process.env.DEMO_SEED_PASSWORD || DEFAULT_PASSWORD,
    role,
    isActive,
    isVerified: true,
    address,
    barangay,
    utilityCompany,
    expertise,
    repairOrganization,
    repairTeam,
    availability
  };
}

function demoIncident({ reportNumber, reporter, category, subcategory, description, barangay, coordinates, status = 'submitted', priority = 'medium', changedBy }) {
  const changedAt = new Date();
  const result = {
    reportNumber,
    reporter,
    category,
    subcategory,
    description,
    location: {
      type: 'Point',
      coordinates,
      address: {
        street: 'Synthetic QA evidence only',
        barangay,
        city: 'Dagupan City',
        landmark: 'Local QA fixture'
      }
    },
    images: [],
    status,
    priority,
    statusHistory: [{
      status: 'submitted',
      changedBy: reporter,
      actorRole: 'citizen',
      changedAt,
      notes: 'Synthetic local QA fixture; not a real incident.'
    }],
    isPublic: false,
    duplicateDetection: { candidateCount: 0, checkedAt: changedAt },
    aiAnalysis: {
      analysisStatus: 'unavailable',
      modelAvailable: false,
      detected: false,
      requiresManualReview: true,
      advisoryOnly: true
    }
  };

  if (status === 'validated') {
    result.validatedBy = changedBy;
    result.validatedAt = changedAt;
    result.jurisdiction = {
      barangay,
      city: 'Dagupan City',
      responsibility: 'city_engineering',
      confirmedBy: changedBy,
      confirmedAt: changedAt
    };
    result.routing = {
      responsibleOrganization: 'Dagupan City Engineering Office',
      responsibleRole: 'city_engineering',
      reason: 'Synthetic QA routing fixture',
      routedBy: changedBy,
      routedAt: changedAt
    };
    result.sla = { targetResolutionTime: 72, startedAt: changedAt, deadline: new Date(changedAt.getTime() + 72 * 60 * 60 * 1000), state: 'active' };
    result.statusHistory.push({ status: 'validated', changedBy, actorRole: 'city_engineer', changedAt, notes: 'Synthetic QA validation fixture.' });
  }

  if (status === 'rejected') {
    result.rejectedBy = changedBy;
    result.rejectedAt = changedAt;
    result.rejectionReason = 'Synthetic QA fixture: insufficient evidence for a verified report.';
    result.statusHistory.push({ status: 'rejected', changedBy, actorRole: 'city_engineer', changedAt, notes: 'Synthetic QA rejection fixture.' });
  }

  return result;
}

async function clearPreviousDemoData() {
  const users = await User.find({ email: DEMO_EMAIL_PATTERN }).select('_id').lean();
  const userIds = users.map((user) => user._id);
  const incidents = await Incident.find({
    $or: [
      { reportNumber: new RegExp(`^${DEMO_REPORT_PREFIX}`) },
      ...(userIds.length ? [{ reporter: { $in: userIds } }] : [])
    ]
  }).select('_id').lean();
  const incidentIds = incidents.map((incident) => incident._id);
  const resourceIds = [...userIds, ...incidentIds];

  if (userIds.length || resourceIds.length) {
    await AuditLog.deleteMany({
      $or: [
        ...(userIds.length ? [{ performedBy: { $in: userIds } }, { affectedUser: { $in: userIds } }] : []),
        ...(resourceIds.length ? [{ resourceId: { $in: resourceIds } }] : [])
      ]
    });
  }
  if (incidentIds.length) await Incident.deleteMany({ _id: { $in: incidentIds } });
  if (userIds.length) await User.deleteMany({ _id: { $in: userIds } });
}

async function seed() {
  const uri = requireSafeEnvironment();
  await mongoose.connect(uri);

  try {
    await clearPreviousDemoData();

    const commonAddress = {
      street: 'Synthetic QA evidence only',
      barangay: 'Poblacion Oeste',
      city: 'Dagupan City',
      province: 'Pangasinan',
      zipCode: '2400'
    };
    const [admin, engineer, citizen, barangayOfficial, utilityProvider, repairPersonnel, disabledCitizen] = await User.create([
      demoUser({
        firstName: 'Demo', lastName: 'Administrator', email: 'demo.admin@lunas.test',
        role: 'admin', phone: '09990000001', address: commonAddress
      }),
      demoUser({
        firstName: 'Demo', lastName: 'Engineer', email: 'demo.engineer@lunas.test',
        role: 'city_engineer', phone: '09990000002', address: commonAddress
      }),
      demoUser({
        firstName: 'Demo', lastName: 'Citizen', email: 'demo.citizen@lunas.test',
        role: 'citizen', phone: '09990000003', address: commonAddress
      }),
      demoUser({
        firstName: 'Demo', lastName: 'Barangay Official', email: 'demo.barangay@lunas.test',
        role: 'barangay_official', phone: '09990000004', address: commonAddress,
        barangay: 'Poblacion Oeste', expertise: ['road', 'drainage', 'streetlight']
      }),
      demoUser({
        firstName: 'Demo', lastName: 'Utility Provider', email: 'demo.utility@lunas.test',
        role: 'utility_provider', phone: '09990000005', address: commonAddress,
        utilityCompany: 'Dagupan Water District', expertise: ['water', 'drainage']
      }),
      demoUser({
        firstName: 'Demo', lastName: 'Repair Personnel', email: 'demo.repair@lunas.test',
        role: 'repair_personnel', phone: '09990000006', address: commonAddress,
        barangay: 'Poblacion Oeste', repairOrganization: 'Dagupan City Engineering Office',
        repairTeam: 'Road Maintenance Team A', availability: 'available', expertise: ['road', 'drainage']
      }),
      demoUser({
        firstName: 'Demo', lastName: 'Disabled Citizen', email: 'demo.disabled-citizen@lunas.test',
        role: 'citizen', phone: '09990000007', isActive: false, address: commonAddress
      })
    ]);

    const incidents = await Incident.create([
      demoIncident({ reportNumber: 'DEMO-QA-001', reporter: citizen._id, category: 'road', subcategory: 'pothole', description: 'Synthetic deep pothole report for RBAC validation evidence.', barangay: 'Poblacion Oeste', coordinates: [120.3387, 16.0433] }),
      demoIncident({ reportNumber: 'DEMO-QA-002', reporter: citizen._id, category: 'drainage', subcategory: 'blockage', description: 'Synthetic drainage blockage report for QA queue evidence.', barangay: 'Poblacion Oeste', coordinates: [120.3374, 16.0421] }),
      demoIncident({ reportNumber: 'DEMO-QA-003', reporter: citizen._id, category: 'streetlight', subcategory: 'outage', description: 'Synthetic streetlight outage report for QA queue evidence.', barangay: 'Bonuan Gueset', coordinates: [120.3451, 16.0522] }),
      demoIncident({ reportNumber: 'DEMO-QA-004', reporter: citizen._id, category: 'road', subcategory: 'crack', description: 'Synthetic validated report retained for dashboard counter evidence.', barangay: 'Poblacion Oeste', coordinates: [120.3398, 16.0445], status: 'validated', priority: 'high', changedBy: engineer._id }),
      demoIncident({ reportNumber: 'DEMO-QA-005', reporter: citizen._id, category: 'water', subcategory: 'leak', description: 'Synthetic rejected report retained for citizen-status evidence.', barangay: 'Poblacion Oeste', coordinates: [120.3406, 16.0452], status: 'rejected', changedBy: engineer._id })
    ]);

    await AuditLog.create({
      action: 'user_created',
      performedBy: admin._id,
      affectedUser: citizen._id,
      resourceType: 'User',
      resourceId: citizen._id,
      details: { source: 'local-demo-seed', synthetic: true },
      status: 'success'
    });

    console.log(`Seeded ${[admin, engineer, citizen, barangayOfficial, utilityProvider, repairPersonnel, disabledCitizen].length} synthetic demo accounts and ${incidents.length} synthetic incidents in lunas_demo.`);
    console.log('Demo records use the demo.*@lunas.test namespace; no non-demo records were changed.');
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((error) => {
  console.error(`Demo seed failed: ${error.message}`);
  process.exitCode = 1;
});
