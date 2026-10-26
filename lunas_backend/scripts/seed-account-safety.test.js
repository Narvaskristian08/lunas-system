const { syncSeededDisplayMetadata: syncDagupan } = require('./seed-dagupan-data');
const { syncSeededDisplayMetadata: syncPresentation } = require('./seed-presentation-data');

test.each([syncDagupan, syncPresentation])('seed reruns preserve account security and scope fields', sync => {
  const account = {
    firstName: 'Old',
    lastName: 'Display',
    organization: 'Old organization',
    position: 'Old position',
    email: 'demo.barangay@lunas.test',
    password: 'existing-password-hash',
    role: 'barangay_official',
    barangay: 'Pantal',
    refreshTokens: [{ tokenHash: 'existing-session' }],
    accountStatus: 'pending_activation',
    isVerified: false,
    requiresActivation: true
  };
  sync(account, {
    firstName: 'Infrastructure Committee',
    lastName: 'Pantal',
    organization: 'Barangay Pantal',
    position: 'Barangay Infrastructure Committee',
    email: 'dagupan.barangay-pantal@lunas.test',
    password: 'new-seed-password',
    role: 'barangay_official',
    barangay: 'Other barangay'
  }, true);
  expect(account).toMatchObject({
    firstName: 'Infrastructure Committee',
    lastName: 'Pantal',
    organization: 'Barangay Pantal',
    position: 'Barangay Infrastructure Committee',
    email: 'dagupan.barangay-pantal@lunas.test',
    password: 'existing-password-hash',
    role: 'barangay_official',
    barangay: 'Pantal',
    refreshTokens: [{ tokenHash: 'existing-session' }],
    accountStatus: 'pending_activation',
    isVerified: false,
    requiresActivation: true
  });
});
