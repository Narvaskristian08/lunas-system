/* Local fixtures for testing Barangay Reports period filters and CSV export. */
require('dotenv').config();
const mongoose = require('mongoose');
const Incident = require('../src/models/Incident');
const User = require('../src/models/User');
const { fixtureEmails, requireLocalSeedEnvironment } = require('./dagupan-seed-config');

const FIXTURE_PREFIX = 'BARANGAY-REPORT-';
const BARANGAY = 'Poblacion Oeste';
const CITY = 'Dagupan City';

function daysAgo(days, hour = 9) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

const fixtures = [
  { suffix: 'DAILY-001', daysAgo: 0, category: 'road', status: 'submitted', description: 'Daily fixture: pothole reported for filter testing.' },
  { suffix: 'DAILY-002', daysAgo: 0, category: 'streetlight', status: 'submitted', description: 'Daily fixture: streetlight issue reported for filter testing.' },
  { suffix: 'WEEKLY-001', daysAgo: 3, category: 'water', status: 'provider_assigned', description: 'Weekly fixture: water infrastructure issue for filter testing.' },
  { suffix: 'WEEKLY-002', daysAgo: 6, category: 'drainage', status: 'tanod_verified', description: 'Weekly fixture: drainage issue for filter testing.' },
  { suffix: 'MONTHLY-001', daysAgo: 12, category: 'electrical', status: 'in_progress', description: 'Monthly fixture: electrical issue for filter testing.' },
  { suffix: 'MONTHLY-002', daysAgo: 26, category: 'road', status: 'closed', description: 'Monthly fixture: completed road issue for filter testing.' },
  { suffix: 'OLDER-001', daysAgo: 45, category: 'water', status: 'closed', description: 'Older fixture: outside the monthly filter window.' }
];

function incidentFor(fixture, citizenId) {
  const reportNumber = `${FIXTURE_PREFIX}${fixture.suffix}`;
  return {
    reportNumber,
    reporter: citizenId,
    category: fixture.category,
    subcategory: fixture.category === 'road' ? 'pothole' : fixture.category === 'water' ? 'leak' : fixture.category === 'drainage' ? 'blockage' : 'damage',
    description: `[SYNTHETIC BARANGAY REPORT] ${fixture.description}`,
    location: {
      type: 'Point',
      coordinates: [120.3387, 16.0433],
      address: { street: 'Synthetic test location', barangay: BARANGAY, city: CITY }
    },
    images: [],
    status: fixture.status,
    agencyStatus: fixture.status === 'in_progress' ? 'work_in_progress' : fixture.status === 'closed' ? 'work_completed' : 'not_routed',
    statusHistory: [{ status: fixture.status, changedBy: citizenId, actorRole: 'citizen', changedAt: daysAgo(fixture.daysAgo), notes: 'Synthetic local fixture for Barangay Reports testing.' }],
    aiAnalysis: { analysisStatus: 'unavailable', modelAvailable: false, detected: false, requiresManualReview: true, advisoryOnly: true },
    createdAt: daysAgo(fixture.daysAgo),
    updatedAt: daysAgo(fixture.daysAgo)
  };
}

async function seed() {
  const uri = requireLocalSeedEnvironment();
  await mongoose.connect(uri);
  try {
    const citizen = await User.findOne({ email: fixtureEmails.citizen }).select('_id').lean();
    if (!citizen) throw new Error(`Seed the Dagupan accounts first: ${fixtureEmails.citizen} was not found.`);

    const replacing = process.argv.includes('--replace');
    let removed = 0;
    if (replacing) {
      const result = await Incident.deleteMany({ reportNumber: new RegExp(`^${FIXTURE_PREFIX}`) });
      removed = result.deletedCount || 0;
    }

    let created = 0;
    let updated = 0;
    for (const fixture of fixtures) {
      const document = incidentFor(fixture, citizen._id);
      const existing = await Incident.findOne({ reportNumber: document.reportNumber });
      if (existing) {
        existing.set(document);
        await existing.save();
        updated++;
      } else {
        await Incident.create(document);
        created++;
      }
    }

    console.log(JSON.stringify({ barangay: BARANGAY, created, updated, removed, reports: fixtures.length, windows: { daily: 2, weekly: 4, monthly: 6 } }));
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) seed().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { seed, fixtures };
