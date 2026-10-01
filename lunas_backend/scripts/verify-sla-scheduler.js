// Real-clock integration check. Uses only a newly generated disposable database;
// never loads .env and never sends push notifications or touches deployment data.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');

process.env.SLA_AUTOMATION_ENABLED = 'true';
process.env.SLA_POLL_INTERVAL_MINUTES = '1';
process.env.SLA_APPROACHING_THRESHOLD_HOURS = '24';
delete process.env.ONESIGNAL_APP_ID;
delete process.env.ONESIGNAL_REST_API_KEY;

const Incident = require('../src/models/Incident');
const WorkOrder = require('../src/models/WorkOrder');
const Notification = require('../src/models/Notification');
const { startSLAMonitor, stopSLAMonitor, checkSLAStatus, runIncidentSlaCheck } = require('../src/services/slaService');

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const databaseName = `lunas_sla_revision6_${randomUUID().replaceAll('-', '')}`;

const main = async () => {
  await mongoose.connect(process.env.SLA_TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017', {
    dbName: databaseName, serverSelectionTimeoutMS: 5000
  });
  try {
    await Notification.init();
    const provider = new mongoose.Types.ObjectId();
    const repair = new mongoose.Types.ObjectId();
    const incidentId = new mongoose.Types.ObjectId();
    const startedAt = new Date();
    const deadline = new Date(startedAt.getTime() - 3600000);
    await Incident.collection.insertOne({ _id: incidentId, reportNumber: 'SLA-LIVE-OVERDUE',
      status: 'city_verification', assignedUtility: provider,
      sla: { startedAt, deadline, state: 'active', isOverdue: false, escalationLevel: 0, remindersSent: 0 }
    });
    await WorkOrder.collection.insertOne({ incident: incidentId, orderNumber: 'SLA-LIVE-WO',
      status: 'provider_accepted', createdBy: provider, assignedTo: repair, version: 0,
      actualCompletionTime: startedAt,
      sla: { startedAt, deadline, state: 'active', isOverdue: false }
    });
    const warningId = new mongoose.Types.ObjectId();
    await Incident.collection.insertOne({ _id: warningId, reportNumber: 'SLA-LIVE-WARNING',
      status: 'provider_review', assignedUtility: provider,
      sla: { startedAt, deadline: new Date(startedAt.getTime() + 20 * 3600000),
        state: 'active', escalationLevel: 0, remindersSent: 0 }
    });

    // Disable the initial invocation: notifications must come from an actual
    // recurring node-cron callback with the real wall clock and real MongoDB.
    startSLAMonitor({ runImmediately: false });
    const timeout = Date.now() + 90000;
    while (Date.now() < timeout) {
      if (await Notification.countDocuments() === 4) break;
      await sleep(250);
    }
    assert.equal(await Notification.countDocuments(), 4, 'real scheduled warning/escalation delivery');
    assert.equal((await Incident.findById(incidentId)).sla.state, 'overdue');
    assert.equal((await WorkOrder.findOne({ incident: incidentId })).sla.state, 'overdue');
    stopSLAMonitor();

    // Remove delivery acknowledgments to reproduce a crash after notification
    // persistence. Parallel runners must still produce one notification per key.
    await Incident.updateMany({}, { $unset: { 'sla.overdueNotifiedAt': 1, 'sla.reminderThresholdsSent': 1 } });
    await WorkOrder.updateMany({}, { $unset: { 'sla.overdueNotifiedAt': 1 } });
    await Promise.all([checkSLAStatus(), checkSLAStatus()]);
    assert.equal(await Notification.countDocuments(), 4, 'concurrent retries are idempotent');

    // Actual unique-index guarantee, independently of acknowledgment markers.
    const first = await Notification.findOne().lean();
    await assert.rejects(Notification.create({ recipient: first.recipient, type: first.type,
      title: first.title, message: first.message, idempotencyKey: first.idempotencyKey }),
    (error) => error.code === 11000);

    // Real DB failure in notification persistence, followed by a successful retry.
    const retryId = new mongoose.Types.ObjectId();
    await Incident.collection.insertOne({ _id: retryId, reportNumber: 'SLA-LIVE-RETRY',
      status: 'provider_review', assignedUtility: provider,
      sla: { startedAt, deadline, state: 'active', escalationLevel: 0 }
    });
    await mongoose.connection.db.command({ collMod: Notification.collection.name,
      validator: { title: { $eq: 'impossible-test-title' } }, validationLevel: 'strict' });
    await runIncidentSlaCheck();
    assert.equal((await Incident.findById(retryId)).sla.overdueNotifiedAt, undefined);
    assert.equal((await Incident.findById(retryId)).sla.state, 'overdue');
    await mongoose.connection.db.command({ collMod: Notification.collection.name,
      validator: {}, validationLevel: 'off' });
    await runIncidentSlaCheck();
    assert.ok((await Incident.findById(retryId)).sla.overdueNotifiedAt);
    assert.equal(await Notification.countDocuments(), 5);

    const closedAt = new Date();
    await Incident.updateOne({ _id: incidentId }, { $set: { status: 'closed', closedAt } });
    await checkSLAStatus();
    const closed = await Incident.findById(incidentId);
    const order = await WorkOrder.findOne({ incident: incidentId });
    assert.equal(closed.sla.state, 'breached');
    assert.equal(order.sla.state, 'breached');
    assert.equal(order.sla.isOverdue, false);
    assert.equal(order.sla.deadline.getTime(), deadline.getTime());
    assert.equal(order.actualCompletionTime.getTime(), startedAt.getTime());
    console.log('PASS: live cron callback, real MongoDB, warning/escalation delivery, concurrent retries, unique index, notification failure recovery, terminal normalization.');
  } finally {
    stopSLAMonitor();
    assert.equal(mongoose.connection.name, databaseName);
    assert.ok(databaseName.startsWith('lunas_sla_revision6_'));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
};

main().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
