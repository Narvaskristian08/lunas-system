/* Local fixtures for agency-owned Daily/Weekly/Monthly reports and exports. */
require('dotenv').config();
const mongoose = require('mongoose');
const Incident = require('../src/models/Incident');
const User = require('../src/models/User');
const { ORGANIZATIONS, fixtureEmails, requireLocalSeedEnvironment } = require('./dagupan-seed-config');

const PREFIX = 'AGENCY-REPORT-';
const BARANGAY = 'Poblacion Oeste';

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(10, 0, 0, 0);
  return date;
}

const fixtures = ORGANIZATIONS.flatMap((organization, organizationIndex) => [
  { organization, suffix: `${organization.code.toUpperCase()}-DAILY`, daysAgo: 0, category: organization.expertise[0], status: 'provider_assigned', agencyStatus: 'ready_for_work' },
  { organization, suffix: `${organization.code.toUpperCase()}-WEEKLY`, daysAgo: 4, category: organization.expertise[0], status: 'in_progress', agencyStatus: 'work_in_progress' },
  { organization, suffix: `${organization.code.toUpperCase()}-MONTHLY`, daysAgo: 18 + organizationIndex, category: organization.expertise[0], status: 'repair_completed', agencyStatus: 'work_completed' }
]);

async function seed() {
  const uri = requireLocalSeedEnvironment();
  await mongoose.connect(uri);
  try {
    const citizen = await User.findOne({ email: fixtureEmails.citizen }).select('_id').lean();
    if (!citizen) throw new Error(`Seed the Dagupan accounts first: ${fixtureEmails.citizen} was not found.`);
    const replacing = process.argv.includes('--replace');
    const removed = replacing ? (await Incident.deleteMany({ reportNumber: new RegExp(`^${PREFIX}`) })).deletedCount || 0 : 0;
    let created = 0;
    let updated = 0;
    for (const fixture of fixtures) {
      const reportNumber = `${PREFIX}${fixture.suffix}`;
      const createdAt = daysAgo(fixture.daysAgo);
      const document = {
        reportNumber,
        reporter: citizen._id,
        category: fixture.category,
        subcategory: fixture.category === 'water' ? 'leak' : fixture.category === 'road' ? 'pothole' : fixture.category === 'drainage' ? 'blockage' : 'damage',
        description: `[SYNTHETIC AGENCY REPORT] ${fixture.organization.name} report for agency period filter testing.`,
        location: { type: 'Point', coordinates: [120.3387, 16.0433], address: { street: 'Synthetic test location', barangay: BARANGAY, city: 'Dagupan City' } },
        images: [],
        status: fixture.status,
        agencyStatus: fixture.agencyStatus,
        routing: { responsibleOrganization: fixture.organization.name, responsibleRole: 'utility_provider', reason: 'Synthetic routed agency fixture', routedAt: createdAt },
        statusHistory: [{ status: fixture.status, changedBy: citizen._id, actorRole: 'citizen', changedAt: createdAt, notes: 'Synthetic agency report fixture.' }],
        aiAnalysis: { analysisStatus: 'unavailable', modelAvailable: false, detected: false, requiresManualReview: true, advisoryOnly: true },
        createdAt,
        updatedAt: createdAt
      };
      const existing = await Incident.findOne({ reportNumber });
      if (existing) { existing.set(document); await existing.save(); updated++; } else { await Incident.create(document); created++; }
    }
    console.log(JSON.stringify({ created, updated, removed, agencies: ORGANIZATIONS.map(item => item.name), reports: fixtures.length }));
  } finally { await mongoose.disconnect(); }
}

if (require.main === module) seed().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { seed, fixtures };
