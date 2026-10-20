// Preserve the old CLI/module contract as an explicit refusal. The former
// migration fabricated seed consent, rewrote personnel organization fields and
// advanced incident states without approved mappings or a rollback plan.
// Refuse before loading dotenv, database clients or models.
async function migrate() {
  const error = new Error('Tanod workflow migration is retired. No records changed. Inventory historical accounts and incidents, approve mappings, then validate a dry run, backup and rollback plan in isolation before proposing a replacement.');
  error.code = 'LEGACY_MIGRATION_RETIRED';
  throw error;
}
if (require.main === module) migrate().catch((error) => { console.error(error.message); process.exitCode = 1; });
module.exports = { migrate };
