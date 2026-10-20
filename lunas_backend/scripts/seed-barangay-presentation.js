/* Local/AWS-explicit presentation fixtures: 50 reports across all 31 barangays. */
require('dotenv').config();
const mongoose = require('mongoose');
const Incident = require('../src/models/Incident');
const User = require('../src/models/User');
const { DAGUPAN_BARANGAYS } = require('../src/data/dagupanBarangays');
const { ORGANIZATIONS, requireLocalSeedEnvironment } = require('./dagupan-seed-config');

const PREFIX = 'BARANGAY-PRESENTATION-';
const categories = ['road', 'drainage', 'electrical', 'water', 'streetlight'];
const subcategories = { road: 'pothole', drainage: 'blockage', electrical: 'damage', water: 'leak', streetlight: 'damage' };
const daysAgo = days => { const date = new Date(); date.setDate(date.getDate() - days); date.setHours(9, 0, 0, 0); return date; };

function seedEnvironment() {
  if (process.env.ALLOW_PRESENTATION_AWS_SEED === 'true') {
    if (process.env.PRESENTATION_SEED_CONFIRM !== 'LUNAS-PRESENTATION-AWS') throw new Error('AWS presentation seeding requires PRESENTATION_SEED_CONFIRM=LUNAS-PRESENTATION-AWS.');
    return process.env.MONGODB_URI;
  }
  return requireLocalSeedEnvironment();
}

function definitions(citizenId) {
  return Array.from({ length: 50 }, (_, index) => {
    const barangay = DAGUPAN_BARANGAYS[index % DAGUPAN_BARANGAYS.length];
    const category = categories[index % categories.length];
    const organization = ORGANIZATIONS[index % ORGANIZATIONS.length];
    const status = ['submitted', 'tanod_verified', 'provider_assigned', 'in_progress', 'repair_completed'][index % 5];
    const createdAt = daysAgo(index % 30);
    return {
      reportNumber: `${PREFIX}${String(index + 1).padStart(3, '0')}`,
      reporter: citizenId, category, subcategory: subcategories[category],
      description: `[SYNTHETIC PRESENTATION] Barangay report for ${barangay}. Not a real incident.`,
      location: { type: 'Point', coordinates: [120.3387, 16.0433], address: { street: 'Presentation fixture location', barangay, city: 'Dagupan City' } },
      images: [], status,
      agencyStatus: status === 'repair_completed' ? 'work_completed' : status === 'in_progress' ? 'work_in_progress' : status === 'provider_assigned' ? 'ready_for_work' : 'not_routed',
      routing: { responsibleOrganization: organization.name, responsibleRole: 'utility_provider', reason: 'Presentation fixture routing', routedAt: createdAt },
      statusHistory: [{ status, changedBy: citizenId, actorRole: 'citizen', changedAt: createdAt, notes: 'Synthetic presentation fixture.' }],
      aiAnalysis: { analysisStatus: 'unavailable', modelAvailable: false, detected: false, requiresManualReview: true, advisoryOnly: true },
      createdAt, updatedAt: createdAt
    };
  });
}

async function seed() {
  await mongoose.connect(seedEnvironment());
  try {
    const citizen = await User.findOne({ email: 'dagupan.citizen@lunas.test' }).select('_id').lean();
    if (!citizen) throw new Error('Seed the Dagupan accounts first: dagupan.citizen@lunas.test was not found.');
    let created = 0; let updated = 0;
    for (const document of definitions(citizen._id)) {
      const existing = await Incident.findOne({ reportNumber: document.reportNumber });
      if (existing) { existing.set(document); await existing.save(); updated++; } else { await Incident.create(document); created++; }
    }
    console.log(JSON.stringify({ created, updated, reports: 50, barangays: DAGUPAN_BARANGAYS.length, coverage: 'at least one report per barangay' }));
  } finally { await mongoose.disconnect(); }
}
if (require.main === module) seed().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { definitions, seed };
