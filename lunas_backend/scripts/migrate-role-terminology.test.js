const {
  CONFIRMATION,
  replaceRoleTerminology,
  buildChanges,
  assertLocalDatabase
} = require('./migrate-role-terminology');

const baseAccount = {
  _id: 'account-id',
  email: 'dagupan.tanod-pantal@lunas.test',
  role: 'utility_personnel',
  barangay: 'Pantal',
  firstName: 'Tanod Pantal',
  lastName: 'Utility Personnel',
  position: 'Barangay Tanod / Utility Personnel',
  approval: { reference: 'Created by Barangay Secretary: Pantal' },
  password: 'hashed-password',
  refreshTokens: [{ tokenHash: 'preserve-me' }]
};

test('replaces legacy terms in display metadata without changing internal identifiers', () => {
  expect(replaceRoleTerminology('Barangay Secretary assigned a Barangay Tanod')).toBe('Barangay Infrastructure Committee assigned a Barangay Committee Staff');
  const changes = buildChanges(baseAccount);
  expect(changes).toEqual({
    firstName: 'Committee Staff Pantal',
    position: 'Barangay Committee Staff / Utility Personnel',
    'approval.reference': 'Created by Barangay Infrastructure Committee: Pantal'
  });
  expect(changes.role).toBeUndefined();
  expect(changes.email).toBeUndefined();
  expect(changes.password).toBeUndefined();
  expect(changes.refreshTokens).toBeUndefined();
});

test('converts the current synthetic official display metadata', () => {
  expect(buildChanges({
    email: 'dagupan.barangay-pantal@lunas.test',
    role: 'barangay_official',
    barangay: 'Pantal',
    firstName: 'Pantal',
    lastName: 'Official',
    position: 'Local barangay account'
  })).toEqual({
    firstName: 'Infrastructure Committee',
    lastName: 'Pantal',
    position: 'Barangay Infrastructure Committee'
  });
});

test('converts a legacy demo barangay official display without changing its scope', () => {
  expect(buildChanges({
    email: 'demo.barangay@lunas.test',
    role: 'barangay_official',
    barangay: 'Poblacion Oeste',
    firstName: 'Demo',
    lastName: 'Barangay Official'
  })).toEqual({
    firstName: 'Infrastructure Committee',
    lastName: 'Poblacion Oeste',
    position: 'Barangay Infrastructure Committee'
  });
});

test('safety gate rejects non-local databases and accepts explicitly authorized Docker local MongoDB', () => {
  const env = {
    NODE_ENV: 'development',
    ALLOW_ROLE_TERMINOLOGY_MIGRATION: 'true',
    ROLE_TERMINOLOGY_MIGRATION_CONFIRM: CONFIRMATION
  };
  expect(() => assertLocalDatabase('mongodb://production/lunas_db', env)).toThrow();
  expect(() => assertLocalDatabase('mongodb://localhost/other_db', env)).toThrow();
  expect(() => assertLocalDatabase('mongodb://mongodb/lunas_db', env)).toThrow();
  expect(assertLocalDatabase('mongodb://mongodb/lunas_db', { ...env, ROLE_TERMINOLOGY_MIGRATION_DOCKER: 'true' })).toBe('mongodb://mongodb/lunas_db');
});
