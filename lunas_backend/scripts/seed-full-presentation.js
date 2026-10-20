/* Explicit presentation volume seed: 50 reports per barangay and agency. */
require('dotenv').config();
const mongoose = require('mongoose');
const Incident = require('../src/models/Incident');
const User = require('../src/models/User');
const { DAGUPAN_BARANGAYS } = require('../src/data/dagupanBarangays');
const { ORGANIZATIONS, requireLocalSeedEnvironment, slug } = require('./dagupan-seed-config');

const BARANGAY_PREFIX = 'FULL-PRESENTATION-BARANGAY-';
const AGENCY_PREFIX = 'FULL-PRESENTATION-AGENCY-';
const categories = ['road', 'drainage', 'electrical', 'water', 'streetlight'];
const subcategories = { road: 'pothole', drainage: 'blockage', electrical: 'damage', water: 'leak', streetlight: 'damage' };
const statuses = ['submitted', 'tanod_verified', 'provider_assigned', 'in_progress', 'repair_completed'];
const daysAgo = days => { const date = new Date(); date.setDate(date.getDate() - days); date.setHours(9, 0, 0, 0); return date; };

function seedEnvironment() {
  if (process.env.ALLOW_PRESENTATION_AWS_SEED === 'true') {
    if (process.env.PRESENTATION_SEED_CONFIRM !== 'LUNAS-PRESENTATION-AWS') throw new Error('AWS presentation seeding requires PRESENTATION_SEED_CONFIRM=LUNAS-PRESENTATION-AWS.');
    return process.env.MONGODB_URI;
  }
  return requireLocalSeedEnvironment();
}

function reportFor({ prefix, group, index, barangay, organization, citizenId }) {
  const category = organization.expertise[index % organization.expertise.length] || categories[index % categories.length];
  const status = statuses[index % statuses.length];
  const createdAt = daysAgo(index % 60);
  return {
    reportNumber: `${prefix}${slug(group)}-${String(index + 1).padStart(3, '0')}`,
    reporter: citizenId, category, subcategory: subcategories[category] || 'damage',
    description: `[SYNTHETIC FULL PRESENTATION] Report ${index + 1} for ${group}. Not a real incident.`,
    location: { type: 'Point', coordinates: [120.3387, 16.0433], address: { street: 'Presentation fixture location', barangay, city: 'Dagupan City' } },
    images: [], status,
    agencyStatus: status === 'repair_completed' ? 'work_completed' : status === 'in_progress' ? 'work_in_progress' : status === 'provider_assigned' ? 'ready_for_work' : 'not_routed',
    routing: { responsibleOrganization: organization.name, responsibleRole: 'utility_provider', reason: 'Full presentation fixture routing', routedAt: createdAt },
    statusHistory: [{ status, changedBy: citizenId, actorRole: 'citizen', changedAt: createdAt, notes: 'Synthetic full-volume presentation fixture.' }],
    aiAnalysis: { analysisStatus: 'unavailable', modelAvailable: false, detected: false, requiresManualReview: true, advisoryOnly: true },
    createdAt, updatedAt: createdAt
  };
}

function definitions(citizenId) {
  const reports = [];
  for (const [barangayIndex, barangay] of DAGUPAN_BARANGAYS.entries()) {
    const organization = ORGANIZATIONS[barangayIndex % ORGANIZATIONS.length];
    for (let index = 0; index < 50; index++) reports.push(reportFor({ prefix: BARANGAY_PREFIX, group: barangay, index, barangay, organization, citizenId }));
  }
  for (const organization of ORGANIZATIONS) {
    for (let index = 0; index < 50; index++) reports.push(reportFor({ prefix: AGENCY_PREFIX, group: organization.code, index, barangay: 'Poblacion Oeste', organization, citizenId }));
  }
  return reports;
}

async function seed() {
  await mongoose.connect(seedEnvironment());
  try {
    const citizen = await User.findOne({ email: 'dagupan.citizen@lunas.test' }).select('_id').lean();
    if (!citizen) throw new Error('Seed the Dagupan accounts first: dagupan.citizen@lunas.test was not found.');
    let created = 0; let updated = 0;
    for (const document of definitions(citizen._id)) { const existing = await Incident.findOne({ reportNumber: document.reportNumber }); if (existing) { existing.set(document); await existing.save(); updated++; } else { await Incident.create(document); created++; } }
    console.log(JSON.stringify({ created, updated, barangayReports: DAGUPAN_BARANGAYS.length * 50, agencyReports: ORGANIZATIONS.length * 50, total: 1750 }));
  } finally { await mongoose.disconnect(); }
}
if (require.main === module) seed().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { definitions, seed };
