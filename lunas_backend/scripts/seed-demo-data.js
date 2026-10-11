/*
 * Local-only synthetic data for demonstrations and QA evidence.
 *
 * This is intentionally the target of the existing `npm run seed:demo`
 * command. It refuses every database except a local `lunas_db` database and
 * only removes records that carry the demo account/report identifiers below.
 */
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Incident = require('../src/models/Incident');
const AuditLog = require('../src/models/AuditLog');
const Notification = require('../src/models/Notification');
const WorkOrder = require('../src/models/WorkOrder');
const ReportingAppeal = require('../src/models/ReportingAppeal');

const DEMO_EMAIL_DOMAIN = '@lunas.test';
const DEMO_EMAIL_PATTERN = new RegExp(`^demo\\..+${DEMO_EMAIL_DOMAIN.replace('.', '\\.')}$`, 'i');
const DEMO_REPORT_PREFIX = 'DEMO-QA-';
const DEFAULT_PASSWORD = 'LunasDemo2026!';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const LOCAL_DOCKER_HOSTS = new Set(['mongodb']);

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

  const dockerSeedAllowed = process.env.DEMO_SEED_DOCKER === 'true'
    && LOCAL_DOCKER_HOSTS.has(parsed.hostname);
  if (!LOCAL_HOSTS.has(parsed.hostname) && !dockerSeedAllowed) {
    throw new Error('Refusing to seed: only local MongoDB hosts are allowed. Set DEMO_SEED_DOCKER=true only for the local Compose mongodb service.');
  }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, '').split('/')[0]);
  if (databaseName !== 'lunas_db') {
    throw new Error('Refusing to seed: database name must be exactly lunas_db.');
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

function demoIncident({ reportNumber, reporter, category, subcategory, description, barangay, coordinates }) {
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
    status: 'submitted',
    statusHistory: [{
      status: 'submitted',
      changedBy: reporter,
      actorRole: 'citizen',
      changedAt,
      notes: 'Synthetic local QA fixture; not a real incident.'
    }],
    duplicateDetection: { candidateCount: 0, checkedAt: changedAt },
    aiAnalysis: {
      analysisStatus: 'unavailable',
      modelAvailable: false,
      detected: false,
      requiresManualReview: true,
      advisoryOnly: true
    }
  };

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
  const appeals = userIds.length
    ? await ReportingAppeal.find({ reporter: { $in: userIds } }).select('_id').lean()
    : [];
  const appealIds = appeals.map((appeal) => appeal._id);
  const resourceIds = [...userIds, ...incidentIds, ...appealIds];

  if (incidentIds.length) await WorkOrder.deleteMany({ incident: { $in: incidentIds } });
  if (userIds.length) await ReportingAppeal.deleteMany({ reporter: { $in: userIds } });
  if (userIds.length || incidentIds.length) {
    await Notification.deleteMany({
      $or: [
        ...(userIds.length ? [{ recipient: { $in: userIds } }] : []),
        ...(incidentIds.length ? [{ 'data.incidentId': { $in: incidentIds } }] : [])
      ]
    });
  }

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
    const seededUsers = await User.create([
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
        barangay: 'Poblacion Oeste', repairOrganization: 'Dagupan Water District',
        repairTeam: 'Road Maintenance Team A', availability: 'available', expertise: ['road', 'drainage']
      })
    ]);
    const admin = seededUsers[0];
    const citizen = seededUsers[2];
    const barangayOfficial = seededUsers[3];

    const incidents = await Incident.create([
      demoIncident({ reportNumber: 'DEMO-QA-001', reporter: citizen._id, category: 'water', subcategory: 'leak', description: 'Synthetic water leak report for the sequential workflow demonstration.', barangay: 'Poblacion Oeste', coordinates: [120.3387, 16.0433] }),
      demoIncident({ reportNumber: 'DEMO-QA-002', reporter: citizen._id, category: 'drainage', subcategory: 'blockage', description: 'Synthetic drainage report for barangay queue and scope checks.', barangay: 'Poblacion Oeste', coordinates: [120.3374, 16.0421] }),
      demoIncident({ reportNumber: 'DEMO-QA-003', reporter: citizen._id, category: 'streetlight', subcategory: 'outage', description: 'Synthetic report outside the Demo Barangay Official assignment.', barangay: 'Bonuan Gueset', coordinates: [120.3451, 16.0522] }),
      // Keep one fresh report in the official\'s scope so the Awaiting Review queue is always demonstrable.
      demoIncident({ reportNumber: 'DEMO-QA-004', reporter: citizen._id, category: 'road', subcategory: 'pothole', description: 'Synthetic report intentionally seeded for the Barangay Awaiting Review queue.', barangay: 'Poblacion Oeste', coordinates: [120.3392, 16.0438] })
    ]);

    const awaitingReviewIncident = incidents.find((incident) => incident.reportNumber === 'DEMO-QA-004');
    const pendingAppeal = await ReportingAppeal.create({
      reporter: citizen._id,
      assignedBarangay: 'Poblacion Oeste',
      explanation: 'The submitted reports describe infrastructure issues I personally observed in the assigned Barangay.',
      evidenceReference: 'Synthetic local QA reference: pending appeal fixture.',
      source: 'online',
      status: 'pending',
      version: 0
    });
    await ReportingAppeal.create({
      reporter: citizen._id,
      assignedBarangay: 'Poblacion Oeste',
      explanation: 'The earlier review decision is retained as a completed history fixture for local dashboard testing.',
      evidenceReference: 'Synthetic local QA reference: completed appeal fixture.',
      source: 'online',
      status: 'rejected',
      version: 1,
      reviewedBy: barangayOfficial._id,
      reviewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      reviewNotes: 'Synthetic completed appeal fixture for history testing.',
      decisionHistory: [{
        decision: 'rejected',
        reviewedBy: barangayOfficial._id,
        reviewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        notes: 'Synthetic completed appeal fixture for history testing.'
      }]
    });
    await User.findByIdAndUpdate(citizen._id, { $set: {
      'reportingRestriction.status': 'blocked',
      'reportingRestriction.confirmedFindings': 3,
      'reportingRestriction.threshold': 3,
      'reportingRestriction.assignedBarangay': 'Poblacion Oeste',
      'reportingRestriction.blockedAt': new Date(),
      'reportingRestriction.blockedAtFindings': 3,
      'reportingRestriction.appealStatus': 'pending',
      'reportingRestriction.appealId': pendingAppeal._id
    } });
    await Notification.insertMany(incidents.map((incident) => ({
      recipient: citizen._id,
      type: 'incident_submitted',
      title: 'Report Submitted',
      message: `Your incident report ${incident.reportNumber} has been submitted successfully and is pending validation.`,
      data: {
        incidentId: incident._id,
        reportNumber: incident.reportNumber,
        link: `/incidents/${incident._id}`
      },
      priority: 'medium',
      sentVia: ['in_app']
    })).concat(awaitingReviewIncident ? [{
      recipient: barangayOfficial._id,
      type: 'incident_submitted',
      title: 'Report Awaiting Barangay Review',
      message: `Incident ${awaitingReviewIncident.reportNumber} is ready for Barangay validation.`,
      data: {
        incidentId: awaitingReviewIncident._id,
        reportNumber: awaitingReviewIncident.reportNumber,
        link: `/validation-routing/${awaitingReviewIncident._id}`
      },
      priority: 'high',
      sentVia: ['in_app']
    }] : []));

    await AuditLog.create({
      action: 'user_created',
      performedBy: admin._id,
      affectedUser: citizen._id,
      resourceType: 'User',
      resourceId: citizen._id,
      details: { source: 'local-demo-seed', synthetic: true },
      status: 'success'
    });

    console.log(`Seeded ${seededUsers.length} synthetic demo accounts and ${incidents.length} synthetic submitted incidents in lunas_db.`);
    console.log('DEMO-QA-004 is the fresh Barangay Awaiting Review fixture.');
    console.log('Demo Barangay Reporting Appeals includes one pending and one completed history fixture.');
    console.log('Demo records use the demo.*@lunas.test namespace; no non-demo records were changed.');
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((error) => {
  console.error(`Demo seed failed: ${error.message}`);
  process.exitCode = 1;
});
