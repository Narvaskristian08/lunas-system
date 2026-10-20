const { accountDefinitions, ORGANIZATIONS, requireLocalSeedEnvironment } = require('./dagupan-seed-config');
const { DAGUPAN_BARANGAYS } = require('../src/data/dagupanBarangays');
test('local accounts cover barangays and agencies without retired demo accounts', () => {
  const accounts = accountDefinitions('LocalTest2026!');
  expect(accounts).toHaveLength(68);
  expect(new Set(accounts.map(account => account.email)).size).toBe(68);
  expect(accounts.some(account => ['repair_personnel', 'city_engineer'].includes(account.role))).toBe(false);
  expect(accounts.some(account => /(?:repair-|engineer@)/.test(account.email))).toBe(false);
  expect(accounts.filter(account => account.role === 'barangay_official').map(account => account.barangay)).toEqual(DAGUPAN_BARANGAYS);
  expect(accounts.filter(account => account.role === 'utility_personnel').map(account => account.barangay)).toEqual(DAGUPAN_BARANGAYS);
  for (const org of ORGANIZATIONS) {
    const provider = accounts.find(account => account.utilityCompany === org.name);
    expect(provider.role).toBe('utility_provider');
    expect(provider.expertise).toEqual(org.expertise);
  }
  expect(ORGANIZATIONS.find(org => org.code === 'dcwd').expertise).toEqual(['water']);
});
test('seeding refuses external databases and requires explicit Docker authorization', () => {
  expect(() => requireLocalSeedEnvironment({ ALLOW_DEMO_SEED: 'true', MONGODB_URI: 'mongodb://production/lunas_db' })).toThrow();
  expect(() => requireLocalSeedEnvironment({ ALLOW_DEMO_SEED: 'true', MONGODB_URI: 'mongodb://localhost/production' })).toThrow();
  expect(() => requireLocalSeedEnvironment({ ALLOW_DEMO_SEED: 'true', MONGODB_URI: 'mongodb://mongodb/lunas_db' })).toThrow();
  expect(requireLocalSeedEnvironment({ ALLOW_DEMO_SEED: 'true', DEMO_SEED_DOCKER: 'true', MONGODB_URI: 'mongodb://mongodb/lunas_db' })).toBe('mongodb://mongodb/lunas_db');
});
