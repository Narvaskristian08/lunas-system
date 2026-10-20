const { spawnSync } = require('child_process');
const path = require('path');

jest.mock('mongoose', () => { throw new Error('Retired migration must not load database code'); });
jest.mock('dotenv', () => { throw new Error('Retired migration must not read environment files'); });

test('module entry refuses without loading database or dotenv', async () => {
  const { migrate } = require('./migrate-tanod-workflow');
  await expect(migrate()).rejects.toMatchObject({ code: 'LEGACY_MIGRATION_RETIRED' });
});

test('CLI refuses even with supplied seed consent and URI', () => {
  const result = spawnSync(process.execPath, [path.join(__dirname, 'migrate-tanod-workflow.js')], {
    env: { ...process.env, ALLOW_DEMO_SEED: 'true', DEMO_SEED_DOCKER: 'true', MONGODB_URI: 'mongodb://127.0.0.1:1/never_connect' },
    encoding: 'utf8', timeout: 5000
  });
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('No records changed');
  expect(result.stderr).not.toMatch(/ECONNREFUSED|MongoServer/);
});
