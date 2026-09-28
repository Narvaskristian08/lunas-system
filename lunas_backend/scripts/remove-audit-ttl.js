// Idempotent migration: preserve accountability history by removing only the
// former timestamp TTL index. No user, incident, work-order, or audit rows change.
const mongoose = require('mongoose');

async function removeAuditTtl(db) {
  const collection = db.collection('auditlogs');
  let indexes;
  try { indexes = await collection.indexes(); }
  catch (error) { if (error.code === 26) return 0; throw error; }
  let removed = 0;
  for (const index of indexes) {
    if (index.key.timestamp === 1 && Object.keys(index.key).length === 1
      && index.expireAfterSeconds !== undefined) {
      await collection.dropIndex(index.name);
      removed += 1;
    }
  }
  return removed;
}

if (require.main === module) {
  require('dotenv').config();
  (async () => {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
    await mongoose.connect(process.env.MONGODB_URI);
    const removed = await removeAuditTtl(mongoose.connection.db);
    console.log(`Removed ${removed} audit timestamp TTL index(es). Historical records retained.`);
  })().catch(() => {
    console.error('Audit retention migration failed. Check database access and retry.');
    process.exitCode = 1;
  }).finally(() => mongoose.disconnect());
}

module.exports = { removeAuditTtl };
