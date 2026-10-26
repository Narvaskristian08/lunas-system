/* Idempotent local presentation seed for Dagupan barangay and agency views. */
require('dotenv').config();
const mongoose = require('mongoose');
const Incident = require('../src/models/Incident');
const User = require('../src/models/User');
const { DAGUPAN_BARANGAYS } = require('../src/data/dagupanBarangays');
const { ORGANIZATIONS, accountDefinitions, requireLocalSeedEnvironment, slug } = require('./dagupan-seed-config');

const PREFIX = 'PRESENTATION-';
const CITY = 'Dagupan City';
const PASSWORD = process.env.DAGUPAN_SEED_PASSWORD || 'LunasLocal2026!';
const categoryFor = org => org.expertise[0];
const subcategoryFor = category => ({ road: 'pothole', drainage: 'blockage', water: 'leak' }[category] || 'damage');
const dateDaysAgo = days => { const date = new Date(); date.setDate(date.getDate() - days); date.setHours(10, 0, 0, 0); return date; };
function syncSeededDisplayMetadata(account, definition, migrateEmail) {
  for (const field of ['firstName', 'lastName', 'organization', 'position']) {
    if (definition[field] !== undefined) account[field] = definition[field];
  }
  if (migrateEmail) account.email = definition.email;
}

function seedEnvironment() {
  if (process.env.ALLOW_PRESENTATION_AWS_SEED === 'true') {
    if (process.env.PRESENTATION_SEED_CONFIRM !== 'LUNAS-PRESENTATION-AWS') {
      throw new Error('AWS presentation seeding requires PRESENTATION_SEED_CONFIRM=LUNAS-PRESENTATION-AWS.');
    }
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required for AWS presentation seeding.');
    return process.env.MONGODB_URI;
  }
  return requireLocalSeedEnvironment();
}

function reportDefinitions(citizenId) {
  const reports = [];
  DAGUPAN_BARANGAYS.forEach((barangay, index) => {
    const organization = ORGANIZATIONS[index % ORGANIZATIONS.length];
    const category = categoryFor(organization);
    [['DAILY', 0, 'submitted', 'not_routed'], ['WEEKLY', 4, 'tanod_verified', 'ready_for_work'], ['MONTHLY', 18, 'repair_completed', 'work_completed']].forEach(([period, age, status, agencyStatus]) => {
      const createdAt = dateDaysAgo(age + (index % 3));
      reports.push({ reportNumber: `${PREFIX}BARANGAY-${String(index + 1).padStart(2, '0')}-${period}`, reporter: citizenId, category, subcategory: subcategoryFor(category), description: `[SYNTHETIC PRESENTATION] ${period.toLowerCase()} report for ${barangay}. Not a real incident.`, location: { type: 'Point', coordinates: [120.3387, 16.0433], address: { street: 'Presentation fixture location', barangay, city: CITY } }, images: [], status, agencyStatus, routing: { responsibleOrganization: organization.name, responsibleRole: 'utility_provider', reason: 'Presentation fixture routing', routedAt: createdAt }, statusHistory: [{ status, changedBy: citizenId, actorRole: 'citizen', changedAt: createdAt, notes: 'Synthetic presentation fixture.' }], aiAnalysis: { analysisStatus: 'unavailable', modelAvailable: false, detected: false, requiresManualReview: true, advisoryOnly: true }, createdAt, updatedAt: createdAt });
    });
  });
  ORGANIZATIONS.forEach((organization, index) => ['DAILY', 'WEEKLY', 'MONTHLY'].forEach((period, periodIndex) => {
    const category = categoryFor(organization); const createdAt = dateDaysAgo(periodIndex * 7 + index);
    const status = period === 'DAILY' ? 'provider_assigned' : period === 'WEEKLY' ? 'in_progress' : 'repair_completed';
    const agencyStatus = period === 'DAILY' ? 'ready_for_work' : period === 'WEEKLY' ? 'work_in_progress' : 'work_completed';
    reports.push({ reportNumber: `${PREFIX}AGENCY-${slug(organization.code).toUpperCase()}-${period}`, reporter: citizenId, category, subcategory: subcategoryFor(category), description: `[SYNTHETIC PRESENTATION] ${period.toLowerCase()} agency report for ${organization.name}. Not a real incident.`, location: { type: 'Point', coordinates: [120.3387, 16.0433], address: { street: 'Presentation fixture location', barangay: 'Poblacion Oeste', city: CITY } }, images: [], status, agencyStatus, routing: { responsibleOrganization: organization.name, responsibleRole: 'utility_provider', reason: 'Presentation fixture routing', routedAt: createdAt }, statusHistory: [{ status, changedBy: citizenId, actorRole: 'citizen', changedAt: createdAt, notes: 'Synthetic presentation fixture.' }], aiAnalysis: { analysisStatus: 'unavailable', modelAvailable: false, detected: false, requiresManualReview: true, advisoryOnly: true }, createdAt, updatedAt: createdAt });
  }));
  return reports;
}

async function seed() {
  const uri = seedEnvironment();
  if (PASSWORD.length < 8) throw new Error('DAGUPAN_SEED_PASSWORD must have at least 8 characters.');
  const definitions = accountDefinitions(PASSWORD);
  for (const definition of definitions) await new User(definition).validate();
  await mongoose.connect(uri);
  try {
    const replace = process.argv.includes('--replace');
    if (replace) await Incident.deleteMany({ reportNumber: new RegExp(`^${PREFIX}`) });
    let accountsCreated = 0;
    for (const { legacyEmail, ...definition } of definitions) {
      let account = await User.findOne({ email: definition.email });
      if (!account && legacyEmail) account = await User.findOne({ email: legacyEmail });
      if (!account) { await User.create(definition); accountsCreated++; }
      else if (replace || account.email === legacyEmail) {
        // Refresh only synthetic display metadata. Preserve credentials,
        // sessions, permissions, assignments and account lifecycle fields.
        syncSeededDisplayMetadata(account, definition, account.email === legacyEmail);
        await account.save({ validateModifiedOnly: true });
      }
    }
    const citizen = await User.findOne({ email: 'dagupan.citizen@lunas.test' }).select('_id').lean();
    if (!citizen) throw new Error('Citizen seed account was not created.');
    const reports = reportDefinitions(citizen._id); let created = 0; let updated = 0;
    for (const document of reports) { const existing = await Incident.findOne({ reportNumber: document.reportNumber }); if (existing) { existing.set(document); await existing.save(); updated++; } else { await Incident.create(document); created++; } }
    console.log(JSON.stringify({ accountsCreated, reportsCreated: created, reportsUpdated: updated, barangays: DAGUPAN_BARANGAYS.length, agencies: ORGANIZATIONS.length, reports: reports.length }));
  } finally { await mongoose.disconnect(); }
}
if (require.main === module) seed().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { reportDefinitions, seed, syncSeededDisplayMetadata };
