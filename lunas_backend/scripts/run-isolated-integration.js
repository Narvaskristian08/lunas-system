// No caller-supplied database URI is accepted. Only this owned loopback replica set is used.
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
async function main() {
  const artifacts = path.resolve(process.cwd(), '.local-backups/step13-integration');
  fs.mkdirSync(artifacts, { recursive: true });
  let replica;
  try {
    replica = await MongoMemoryReplSet.create({ binary: { version: '7.0.24', downloadDir: path.join(artifacts, 'mongodb-binaries') },
      replSet: { count: 1, ip: '127.0.0.1', storageEngine: 'wiredTiger' },
      instanceOpts: [{ args: ['--wiredTigerCacheSizeGB', '0.25'] }] });
    const address = new URL(replica.getUri());
    const uri = `mongodb://127.0.0.1:${address.port}/`;
    const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|SystemRoot|WINDIR|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA)$/i.test(key)));
    Object.assign(environment, { NODE_ENV: 'test', CI: 'true', ACCOUNT_TEST_MONGODB_URI: uri,
      LUNAS_INTEGRATION_MONGODB_URI: uri, JWT_SECRET: 'isolated-integration-access-only', JWT_REFRESH_SECRET: 'isolated-integration-refresh-only' });
    const result = await new Promise((resolve, reject) => {
      const selection = process.argv.includes('--all') ? [] : ['--runTestsByPath', 'src/controllers/authorizedAccounts.integration.test.js', 'src/integration/system.integration.test.js'];
      const child = spawn(process.execPath, [require.resolve('jest/bin/jest'), '--runInBand', '--coverage=false', '--testTimeout=60000', ...selection,
        '--json', `--outputFile=${path.join(artifacts, process.argv.includes('--all') ? 'full-results.json' : 'results.json')}`], { cwd: path.resolve(__dirname, '..'), env: environment, stdio: 'inherit', windowsHide: true });
      child.on('error', reject); child.on('exit', resolve);
    });
    process.exitCode = result || 0;
  } finally { if (replica) await replica.stop(); }
}
main().catch(error => { console.error(`Isolated integration failed: ${error.message}`); process.exitCode = 1; });
