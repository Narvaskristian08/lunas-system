const bcrypt = require('bcryptjs');
const User = require('./User');

const executePreSaveHooks = (user) => new Promise((resolve, reject) => {
  User.schema.s.hooks.execPre('save', user, (error) => {
    if (error) reject(error);
    else resolve();
  });
});

describe('User password persistence', () => {
  test('hashes a new password before saving and never leaves the plaintext value', async () => {
    const password = 'SecurePass123';
    const user = new User({
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      email: 'juan@example.com',
      phone: '09123456789',
      password,
      role: 'citizen'
    });

    await executePreSaveHooks(user);

    expect(user.password).not.toBe(password);
    await expect(bcrypt.compare(password, user.password)).resolves.toBe(true);
  });
});
