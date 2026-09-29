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
  const resourceIds = [...userIds, ...incidentIds];

  if (incidentIds.length) await WorkOrder.deleteMany({ incident: { $in: incidentIds } });
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

    const incidents = await Incident.create([
      demoIncident({ reportNumber: 'DEMO-QA-001', reporter: citizen._id, category: 'water', subcategory: 'leak', description: 'Synthetic water leak report for the sequential workflow demonstration.', barangay: 'Poblacion Oeste', coordinates: [120.3387, 16.0433] }),
      demoIncident({ reportNumber: 'DEMO-QA-002', reporter: citizen._id, category: 'drainage', subcategory: 'blockage', description: 'Synthetic drainage report for barangay queue and scope checks.', barangay: 'Poblacion Oeste', coordinates: [120.3374, 16.0421] }),
      demoIncident({ reportNumber: 'DEMO-QA-003', reporter: citizen._id, category: 'streetlight', subcategory: 'outage', description: 'Synthetic report outside the Demo Barangay Official assignment.', barangay: 'Bonuan Gueset', coordinates: [120.3451, 16.0522] })
    ]);

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
    })));

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
    console.log('Demo records use the demo.*@lunas.test namespace; no non-demo records were changed.');
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((error) => {
  console.error(`Demo seed failed: ${error.message}`);
  process.exitCode = 1;
});
