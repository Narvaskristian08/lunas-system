/* Isolated local documentation fixtures. Never alters existing demo accounts. */
const mongoose = require('mongoose');
const fs = require('fs');
const User = require('../src/models/User');
const Incident = require('../src/models/Incident');
const Inspection = require('../src/models/Inspection');
const { accountDefinitions, requireLocalSeedEnvironment } = require('./dagupan-seed-config');
const { testEvidence } = require('./seed-fixture-evidence');
const EMAIL = 'chapter3.staff-oeste@lunas.test';
async function main() {
  const uri = requireLocalSeedEnvironment();
  const password = process.env.DAGUPAN_SEED_PASSWORD || fs.readFileSync(require.resolve('./seed-dagupan-data'), 'utf8').match(/DAGUPAN_SEED_PASSWORD \|\| '([^']+)'/)[1];
  await mongoose.connect(uri);
  try {
    let staff = await User.findOne({ email: EMAIL });
    if (!staff) {
      const definition = accountDefinitions(password).find(a => a.email === 'dagupan.tanod-poblacion-oeste@lunas.test');
      const { legacyEmail, ...fields } = definition;
      staff = await User.create({ ...fields, email: EMAIL, firstName: 'Chapter III', lastName: 'Committee Staff', phone: '09980000999', approval: { authority: 'Local screenshot fixture', reference: 'Synthetic local Chapter III fixture; not an official account.' } });
    }
    if (staff.role !== 'utility_personnel' || staff.barangay !== 'Poblacion Oeste') throw new Error('Existing fixture account does not match supported role/scope; refusing to modify it.');
    const citizen = await User.findOne({ email: 'dagupan.citizen@lunas.test' });
    const base = 'http://127.0.0.1:5000/api/v1';
    async function api(route, token, body, method = 'POST') {
      const response = await fetch(base + route, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }) }, body: body instanceof FormData ? body : JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(`${method} ${route}: ${response.status} ${data.message || 'request failed'}`);
      return data.data;
    }
    async function login(email, platform) { return (await api('/auth/login', null, { email, password, platform })).accessToken; }
    const committeeToken = await login('dagupan.barangay-poblacion-oeste@lunas.test', 'web');
    const staffToken = await login(EMAIL, 'android');
    const agencyToken = await login('dagupan.provider-city-maintenance@lunas.test', 'web');
    const output = { account: EMAIL, role: staff.role, barangay: staff.barangay, fixtures: [] };
    for (const [suffix, description] of [['INITIAL', 'Synthetic road-surface concern for initial field verification.'], ['FINAL', 'Synthetic maintenance-completion scenario for final field verification; no real repair is claimed.']]) {
      const reportNumber = `CHAPTER3-STAFF-${suffix}`;
      let incident = await Incident.findOne({ reportNumber });
      if (!incident) incident = await Incident.create({ reportNumber, reporter: citizen._id, category: 'road', subcategory: 'pothole', description: `[SYNTHETIC LOCAL CHAPTER III] ${description}`, location: { type: 'Point', coordinates: [120.3387, 16.0433], address: { street: 'Synthetic demonstration location', barangay: staff.barangay, city: 'Dagupan City' } }, images: [await testEvidence(reportNumber, 'chapter3-staff')], status: 'submitted', statusHistory: [{ status: 'submitted', changedBy: citizen._id, actorRole: 'citizen', notes: 'New isolated synthetic screenshot fixture, not a real infrastructure report.' }] });
      let initial = await Inspection.findOne({ incident: incident._id, type: 'initial', tanod: staff._id });
      if (!initial) initial = await api(`/incidents/${incident._id}/tanod-inspections`, committeeToken, { tanodId: staff._id });
      if (suffix === 'FINAL') {
        if (['assigned', 'in_progress'].includes(initial.status)) {
          const form = new FormData();form.set('findings', 'Synthetic initial verification for the final-inspection demonstration. No physical field visit is claimed.');form.set('result', 'verified');
          form.set('evidence', new Blob([fs.readFileSync('/tmp/chapter3-staff-evidence.png')], { type: 'image/png' }), 'synthetic-test-evidence.png');
          await api(`/incidents/${incident._id}/inspections/${initial._id}/submit`, staffToken, form);
        }
        initial = await Inspection.findById(initial._id);
        if (initial.status === 'submitted') await api(`/incidents/${incident._id}/inspections/${initial._id}/review`, committeeToken, { decision: 'approve', notes: 'Synthetic local fixture review only.' });
        incident = await Incident.findById(incident._id);
        if (incident.agencyStatus === 'ready_for_work') await api(`/incidents/${incident._id}/agency-status`, agencyToken, { status: 'pending_procurement', priority: 'low', slaDeadline: new Date(Date.now()+7*86400000).toISOString(), note: 'Synthetic external-process scenario; no actual procurement.' }, 'PATCH');
        incident = await Incident.findById(incident._id);
        if (incident.agencyStatus === 'pending_procurement') await api(`/incidents/${incident._id}/agency-status`, agencyToken, { status: 'work_in_progress', note: 'Synthetic scenario only; no physical work is claimed.' }, 'PATCH');
        incident = await Incident.findById(incident._id);
        if (incident.agencyStatus === 'work_in_progress') await api(`/incidents/${incident._id}/agency-status`, agencyToken, { status: 'work_completed', note: 'Synthetic completion scenario for testing field verification; not a real government repair.' }, 'PATCH');
        if (!await Inspection.exists({ incident: incident._id, type: 'completion', tanod: staff._id })) await api(`/incidents/${incident._id}/completion-inspections`, committeeToken, { tanodId: staff._id });
      }
      const inspections = await Inspection.find({ incident: incident._id }).select('_id type status').lean();
      output.fixtures.push({ reportNumber, incidentId: incident._id, inspections });
    }
    console.log(JSON.stringify(output));
  } finally { await mongoose.disconnect(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
