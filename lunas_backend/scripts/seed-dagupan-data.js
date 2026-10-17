/* Local test accounts use real jurisdiction/organization names, never real official identities. */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Incident = require('../src/models/Incident');
const WorkOrder = require('../src/models/WorkOrder');
const Notification = require('../src/models/Notification');
const AuditLog = require('../src/models/AuditLog');
const { DAGUPAN_BARANGAYS } = require('../src/data/dagupanBarangays');
const { accountDefinitions, fixtureEmails, requireLocalSeedEnvironment } = require('./dagupan-seed-config');
const { testEvidence } = require('./seed-fixture-evidence');

async function removeLegacyFixtures() {
  const incidents = await Incident.find({ $or: [
    { reportNumber: /^DEMO-QA-/, description: /^Synthetic/ },
    { reportNumber: /^MOCK-WEB-/, description: /^\[SYNTHETIC TEST\]/ },
    { reportNumber: /^DAGUPAN-LOCAL-/, description: /^\[SYNTHETIC LOCAL\]/ }
  ] }).select('_id').lean();
  const ids = incidents.map(item => item._id);
  const orders = await WorkOrder.find({ incident: { $in: ids } }).select('_id').lean();
  const orderIds = orders.map(item => item._id);
  await Notification.deleteMany({ $or: [{ 'data.incidentId': { $in: ids } }, { 'data.workOrderId': { $in: orderIds } }] });
  await AuditLog.deleteMany({ $or: [{ resourceId: { $in: [...ids, ...orderIds] } }, { 'details.source': 'local-demo-seed' }] });
  await WorkOrder.deleteMany({ _id: { $in: orderIds } });
  await Incident.deleteMany({ _id: { $in: ids } });
  return { reports: ids.length, workOrders: orderIds.length };
}
async function seed() {
  const uri = requireLocalSeedEnvironment();
  const password = process.env.DAGUPAN_SEED_PASSWORD || 'LunasLocal2026!';
  if (password.length < 8) throw new Error('DAGUPAN_SEED_PASSWORD must have at least 8 characters.');
  const definitions = accountDefinitions(password);
  // Validate every account before changing persisted data.
  for (const definition of definitions) await new User(definition).validate();
  await mongoose.connect(uri);
  try {
    let migrated = 0;
    for (const { legacyEmail, ...definition } of definitions) {
      let account = await User.findOne({ email: definition.email });
      if (!account && legacyEmail) {
        account = await User.findOne({ email: legacyEmail });
        if (account) migrated++;
      }
      if (!account) await User.create(definition);
      else if (account.email === legacyEmail || process.argv.includes('--replace')) {
        // Keep IDs so non-fixture reports and audit references remain valid.
        account.set(definition);
        account.set({ refreshTokens: [], repairTeam: undefined });
        await account.save();
      }
    }
    const removed = process.argv.includes('--replace') ? await removeLegacyFixtures() : { reports: 0, workOrders: 0 };
    const citizen = await User.findOne({ email: fixtureEmails.citizen });
    const categories = ['road', 'drainage', 'electrical', 'water', 'streetlight'];
    let created = 0;
    for (const [index, barangay] of DAGUPAN_BARANGAYS.entries()) {
      const reportNumber = `DAGUPAN-LOCAL-${String(index + 1).padStart(3, '0')}`;
      if (await Incident.exists({ reportNumber })) continue;
      const category = categories[index % categories.length];
      const images = process.env.S3_ENDPOINT && new URL(process.env.S3_ENDPOINT).hostname === 'minio'
        ? [await testEvidence(`${reportNumber}: ${category}`, 'mock-web/dagupan-local')] : [];
      await Incident.create({ reportNumber, reporter: citizen._id, category,
        subcategory: category === 'road' ? 'pothole' : category === 'water' ? 'leak' : category === 'drainage' ? 'blockage' : 'damage',
        description: `[SYNTHETIC LOCAL] ${category} fixture for ${barangay}. Not a real incident.`,
        location: { type: 'Point', coordinates: [120.3387, 16.0433], address: { street: 'Synthetic location; jurisdiction not geographically verified', barangay, city: 'Dagupan City' } },
        images, status: 'submitted', statusHistory: [{ status: 'submitted', changedBy: citizen._id, actorRole: 'citizen', changedAt: new Date(), notes: 'Local synthetic fixture; requires human review.' }],
        aiAnalysis: { analysisStatus: 'unavailable', modelAvailable: false, detected: false, requiresManualReview: true, advisoryOnly: true }
      });
      created++;
    }
    console.log(JSON.stringify({ accounts: definitions.length, legacyAccountsMigrated: migrated, fixturesRemoved: removed, reportsCreated: created }));
  } finally { await mongoose.disconnect(); }
}
if (require.main === module) seed().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { seed, removeLegacyFixtures };
