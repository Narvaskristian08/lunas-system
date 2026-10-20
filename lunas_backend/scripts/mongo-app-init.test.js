const fs = require('fs');
const path = require('path');
const vm = require('vm');
const script = fs.readFileSync(path.resolve(__dirname, '../../infra/mongodb/init-app-user.js'), 'utf8');
const environment = () => ({ MONGO_INITDB_DATABASE: 'test_db', MONGO_INITDB_ROOT_USERNAME: 'operator', MONGO_APP_USERNAME: 'test_app', MONGO_APP_PASSWORD: 'synthetic_url_safe_password_for_tests' });
test('fresh-volume initialization grants only database-scoped readWrite', () => {
  const createUser = jest.fn(), getSiblingDB = jest.fn(() => ({ createUser }));
  vm.runInNewContext(script, { process: { env: environment() }, db: { getSiblingDB } });
  expect(getSiblingDB).toHaveBeenCalledWith('test_db');
  expect(createUser.mock.calls[0][0].roles).toEqual([{ role: 'readWrite', db: 'test_db' }]);
});
test.each([{ MONGO_INITDB_DATABASE: 'admin' }, { MONGO_APP_USERNAME: 'operator' }, { MONGO_APP_PASSWORD: '' }])('invalid privilege/credential configuration fails before grants', change => {
  const getSiblingDB = jest.fn();
  expect(() => vm.runInNewContext(script, { process: { env: { ...environment(), ...change } }, db: { getSiblingDB } })).toThrow('Configure a separate');
  expect(getSiblingDB).not.toHaveBeenCalled();
});
