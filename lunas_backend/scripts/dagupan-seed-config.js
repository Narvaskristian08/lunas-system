const { DAGUPAN_BARANGAYS } = require('../src/data/dagupanBarangays');

const ORGANIZATIONS = Object.freeze([
  { code: 'city-maintenance', name: 'Dagupan City Engineering Office', expertise: ['road', 'drainage', 'streetlight'] },
  { code: 'decorp', name: 'Dagupan Electric Corporation (DECORP)', expertise: ['electrical'] },
  { code: 'dcwd', name: 'Dagupan City Water District / Pamana Water Dagupan', expertise: ['water'] },
  { code: 'dpwh', name: 'DPWH - Dagupan National Infrastructure', expertise: ['road', 'drainage'] }
]);
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const email = code => `dagupan.${code}@lunas.test`;
const fixtureEmails = {
  admin: email('admin'), engineer: email('engineer'), citizen: email('citizen'),
  barangay: email('barangay-poblacion-oeste')
};
function accountDefinitions(password) {
  const address = { city: 'Dagupan City', province: 'Pangasinan', zipCode: '2400' };
  const common = { password, address, isActive: true, isVerified: true, accountStatus: 'active', requiresActivation: false,
    approval: { authority: 'Local development seed', reference: 'Synthetic local account; not an officially provisioned government account.' } };
  const accounts = [
    { firstName: 'Local', lastName: 'Administrator', email: fixtureEmails.admin, role: 'admin', legacyEmail: 'demo.admin@lunas.test' },
    { firstName: 'Local', lastName: 'City Engineer', email: fixtureEmails.engineer, role: 'utility_provider', organization: 'Dagupan City Engineering Office', utilityCompany: 'Dagupan City Engineering Office', expertise: ['road', 'drainage', 'streetlight'], legacyEmail: 'demo.engineer@lunas.test' },
    { firstName: 'Local', lastName: 'Citizen', email: fixtureEmails.citizen, role: 'citizen', legacyEmail: 'demo.citizen@lunas.test' },
    ...DAGUPAN_BARANGAYS.map(barangay => ({ firstName: barangay, lastName: 'Official', email: email(`barangay-${slug(barangay)}`),
      role: 'barangay_official', barangay, organization: `Barangay ${barangay}`, position: 'Local barangay account',
      ...(barangay === 'Poblacion Oeste' ? { legacyEmail: 'demo.barangay@lunas.test' } : {}) })),
    ...DAGUPAN_BARANGAYS.map((barangay, index) => ({
      firstName: `Tanod ${barangay}`, lastName: 'Utility Personnel', email: email(`tanod-${slug(barangay)}`), role: 'repair_personnel',
      phone: `0998000${String(index + 1).padStart(4, '0')}`, barangay, organization: `Barangay ${barangay}`,
      position: 'Barangay Tanod / Utility Personnel', availability: 'available'
    })),
    ...ORGANIZATIONS.map((org) => ({
      firstName: org.code.toUpperCase(), lastName: 'Provider', email: email(`provider-${org.code}`), role: 'utility_provider',
      organization: org.name, utilityCompany: org.name, expertise: org.expertise,
      ...(org.code === 'dcwd' ? { legacyEmail: 'demo.utility@lunas.test' } : {})
    }))
  ];
  return accounts.map(account => ({ ...common, ...account, address: { ...address, barangay: account.barangay || 'Poblacion Oeste' } }));
}
function requireLocalSeedEnvironment(env = process.env) {
  if (env.ALLOW_DEMO_SEED !== 'true') throw new Error('Set ALLOW_DEMO_SEED=true for local fixture seeding.');
  const uri = new URL(env.MONGODB_URI);
  if (uri.protocol !== 'mongodb:' || !['localhost', '127.0.0.1', '[::1]', 'mongodb'].includes(uri.hostname)
    || uri.pathname !== '/lunas_db' || (uri.hostname === 'mongodb' && env.DEMO_SEED_DOCKER !== 'true')) {
    throw new Error('Only local lunas_db is allowed; Docker also requires DEMO_SEED_DOCKER=true.');
  }
  return uri.toString();
}
module.exports = { ORGANIZATIONS, fixtureEmails, email, slug, accountDefinitions, requireLocalSeedEnvironment };
