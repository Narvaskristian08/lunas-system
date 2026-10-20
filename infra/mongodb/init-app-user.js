// Fresh disposable volumes only. Existing installations require an approved
// administrative change; never delete a volume to make initialization rerun.
const appDatabase = process.env.MONGO_INITDB_DATABASE;
const appUser = process.env.MONGO_APP_USERNAME;
const appPassword = process.env.MONGO_APP_PASSWORD;
if (!/^[A-Za-z0-9_-]+$/.test(appDatabase || '') || ['admin', 'local', 'config'].includes(appDatabase)
    || !/^[A-Za-z0-9_-]+$/.test(appUser || '') || appUser === process.env.MONGO_INITDB_ROOT_USERNAME
    || !/^[A-Za-z0-9._~-]{24,}$/.test(appPassword || '')) {
  throw new Error('Configure a separate application user, application database and URL-safe password of at least 24 characters');
}
db.getSiblingDB(appDatabase).createUser({ user: appUser, pwd: appPassword,
  roles: [{ role: 'readWrite', db: appDatabase }] });
