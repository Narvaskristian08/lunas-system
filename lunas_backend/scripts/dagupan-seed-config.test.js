const { accountDefinitions, ORGANIZATIONS, requireLocalSeedEnvironment } = require('./dagupan-seed-config');
const { DAGUPAN_BARANGAYS } = require('../src/data/dagupanBarangays');
test('local accounts cover all canonical barangays and matching provider/repair organizations', () => {
  const accounts = accountDefinitions('LocalTest2026!');
  expect(accounts).toHaveLength(42);
  expect(new Set(accounts.map(account => account.email)).size).toBe(42);
  expect(accounts.filter(account => account.role === 'barangay_official').map(account => account.barangay)).toEqual(DAGUPAN_BARANGAYS);
  for (const org of ORGANIZATIONS) {
    const provider = accounts.find(account => account.utilityCompany === org.name);
    const repair = accounts.find(account => account.repairOrganization === org.name);
    expect(provider.expertise).toEqual(repair.expertise);
  }
  expect(ORGANIZATIONS.find(org => org.code === 'dcwd').expertise).toEqual(['water']);
});
test('seeding refuses external databases and requires explicit Docker authorization', () => {
  expect(() => requireLocalSeedEnvironment({ ALLOW_DEMO_SEED: 'true', MONGODB_URI: 'mongodb://production/lunas_db' })).toThrow();
  expect(() => requireLocalSeedEnvironment({ ALLOW_DEMO_SEED: 'true', MONGODB_URI: 'mongodb://localhost/production' })).toThrow();
  expect(() => requireLocalSeedEnvironment({ ALLOW_DEMO_SEED: 'true', MONGODB_URI: 'mongodb://mongodb/lunas_db' })).toThrow();
  expect(requireLocalSeedEnvironment({ ALLOW_DEMO_SEED: 'true', DEMO_SEED_DOCKER: 'true', MONGODB_URI: 'mongodb://mongodb/lunas_db' })).toBe('mongodb://mongodb/lunas_db');
});
