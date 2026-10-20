jest.mock('../models/Incident', () => ({ aggregate: jest.fn() }));
const { aggregate } = require('mingo');
const Incident = require('../models/Incident');
const { parseReportQuery, getOperationalReport } = require('./operationalReportService');
const now = new Date('2026-10-20T02:00:00Z');
const user = { _id: 'secretary', role: 'barangay_official', barangay: 'Pantal', isActive: true };
const provider = { _id: 'agency', role: 'utility_provider', utilityCompany: 'Agency A', isActive: true };
const oldEnv = { ...process.env };
let incidents; let orders;
const make = i => ({ _id: String(i).padStart(24, '0'), reportNumber: `REPORT-${i}`, category: 'road', originalCategory: 'road', status: 'submitted', createdAt: new Date('2026-10-20T00:00:00Z'), jurisdiction: { barangay: 'Pantal' }, routing: { responsibleOrganization: 'Agency A' } });
beforeEach(() => {
  incidents = Array.from({ length: 237 }, (_, i) => make(i)); orders = [];
  process.env.OPERATIONAL_REPORT_CSV_ROLES = ''; process.env.OPERATIONAL_REPORT_PDF_ROLES = '';
  Incident.aggregate.mockImplementation(pipeline => ({ option: jest.fn(async () => aggregate(incidents, pipeline, { collectionResolver: () => orders })) }));
});
afterAll(() => { process.env = oldEnv; });
test.each([0, 53, 100, 237])('all %s matching incidents paginate with complete summaries and stable tie ordering', async count => {
  incidents = Array.from({ length: count }, (_, i) => make(i)); const ids = [];
  for (let page = 1; page <= Math.max(1, Math.ceil(count / 50)); page++) {
    const report = await getOperationalReport(user, { period: 'daily', date: '2026-10-20', page: String(page), limit: '50' }, undefined, now);
    expect(report.totals.incidents).toBe(count); ids.push(...report.rows.map(row => row._id));
  }
  expect(new Set(ids).size).toBe(count); expect(ids).toEqual(incidents.map(row => row._id).sort().reverse());
});
test.each([{ page: '0' }, { page: '-1' }, { page: '1.2' }, { limit: '101' }, { page: '100001' }, { category: { $ne: 'road' } }, { status: 'invented' }, { category: 'invented' }, { agency: ['Agency A', 'Agency B'] }, { $where: 'x' }, { period: 'custom', start: '2026-10-21', end: '2026-10-20' }, { period: 'custom', start: '2024-01-01', end: '2026-01-01' }])('rejects invalid parameters %j', query => {
  expect(() => parseReportQuery(query, now)).toThrow();
});
test.each([
  ['daily', '2026-01-01', '2025-12-31T16:00:00.000Z', '2026-01-01T16:00:00.000Z'],
  ['weekly', '2026-01-01', '2025-12-28T16:00:00.000Z', '2026-01-04T16:00:00.000Z'],
  ['monthly', '2024-02-29', '2024-01-31T16:00:00.000Z', '2024-02-29T16:00:00.000Z'],
  ['monthly', '2026-12-31', '2026-11-30T16:00:00.000Z', '2026-12-31T16:00:00.000Z']
])('%s calendar bounds at %s', (period, date, start, end) => {
  const report = parseReportQuery({ period, date }, now); expect(report.start.toISOString()).toBe(start); expect(report.end.toISOString()).toBe(end);
});
test.each(['2026-02-29', '2024-02-30', '2026-13-01', '2026-1-01', '0001-01-01', '2101-01-01'])('rejects impossible or unsupported date %s', date => expect(() => parseReportQuery({ date }, now)).toThrow());
test('custom dates include local start and exclude the midnight after end', async () => {
  incidents = [make(1), make(2), make(3)]; incidents[0].createdAt = new Date('2026-10-19T16:00:00Z'); incidents[1].createdAt = new Date('2026-10-20T15:59:59.999Z'); incidents[2].createdAt = new Date('2026-10-20T16:00:00Z');
  expect((await getOperationalReport(user, { period: 'custom', start: '2026-10-20', end: '2026-10-20' }, undefined, now)).totals.incidents).toBe(2);
});
test('jurisdiction and agency filters cannot broaden the authenticated scope', async () => {
  incidents.push({ ...make(999), jurisdiction: { barangay: 'Bolosan' }, routing: { responsibleOrganization: 'Other' } });
  expect((await getOperationalReport(user, {}, undefined, now)).totals.incidents).toBe(237);
  expect((await getOperationalReport(provider, {}, undefined, now)).totals.incidents).toBe(237);
  await expect(getOperationalReport(user, { barangay: 'Bolosan' }, undefined, now)).rejects.toMatchObject({ statusCode: 403 });
  await expect(getOperationalReport(provider, { agency: 'Other' }, undefined, now)).rejects.toMatchObject({ statusCode: 403 });
});
test.each(['citizen', 'barangay_tanod', 'repair_personnel', 'admin'])('%s has no broad operational reporting grant', async role => {
  await expect(getOperationalReport({ ...user, role }, {}, undefined, now)).rejects.toMatchObject({ statusCode: 403 });
});
test('suspended account cannot report', async () => {
  await expect(getOperationalReport({ ...user, accountStatus: 'suspended' }, {}, undefined, now)).rejects.toMatchObject({ statusCode: 401 });
});
test('CSV and PDF grants are independent of view permission and of each other', async () => {
  await expect(getOperationalReport(user, {}, 'csv', now)).rejects.toMatchObject({ statusCode: 403 });
  process.env.OPERATIONAL_REPORT_CSV_ROLES = 'barangay_official';
  expect((await getOperationalReport(user, {}, 'csv', now)).rows).toHaveLength(237);
  await expect(getOperationalReport(user, {}, 'pdf', now)).rejects.toMatchObject({ statusCode: 403 });
});
test('over-limit exports fail clearly rather than returning the first 2000 rows', async () => {
  incidents = Array.from({ length: 2001 }, (_, i) => make(i)); process.env.OPERATIONAL_REPORT_CSV_ROLES = user.role;
  await expect(getOperationalReport(user, {}, 'csv', now)).rejects.toMatchObject({ statusCode: 413 });
});
test('combined recorded maintenance, assignment, SLA, verification and category filters do not duplicate incidents', async () => {
  const incident = make(1); incident.workOrder = 'order'; incident.categoryConfirmedBy = 'reviewer'; incident.categoryConfirmedAt = new Date('2026-10-20T00:00Z');
  incident.originalCategory = 'water'; incident.agencyStatus = 'pending_funding'; incident.sla = { startedAt: new Date('2026-10-01'), deadline: new Date('2026-10-02'), state: 'active' };
  incidents = [incident, make(2)]; orders = [{ _id: 'order', incident: incident._id, responsibleOrganization: 'Agency A', status: 'in_progress', assignmentState: 'pending', progressUpdates: [1, 2, 3], assignments: [1, 2] }];
  const result = await getOperationalReport(user, { category: 'road', agency: 'Agency A', barangay: 'Pantal', verification: 'confirmed', maintenance: 'in_progress', assignment: 'pending', sla: 'overdue', external: 'pending_funding' }, undefined, now);
  expect(result.totals).toMatchObject({ incidents: 1, confirmed: 1, categoryCorrections: 1, recordedResolved: 0 });
});
test('progress 100 and bidding completion are not recorded final resolution; missing clock is not breached', async () => {
  incidents = [{ ...make(1), status: 'repair_completed', agencyStatus: 'bidding_completed', sla: { state: 'breached' } }, { ...make(2), status: 'closed' }];
  const result = await getOperationalReport(user, {}, undefined, now);
  expect(result.totals).toMatchObject({ recordedResolved: 0, recordedBreaches: 1 }); expect(result.sla).toEqual([{ _id: 'not_started', count: 2 }]);
});
test('verified and resolved event selection uses its recorded timestamp rather than submission month', async () => {
  incidents = [{ ...make(1), status: 'resolved', createdAt: new Date('2026-09-01'), categoryConfirmedAt: new Date('2026-10-01'), categoryConfirmedBy: 'reviewer', finalVerifiedAt: new Date('2026-10-20'), finalVerifiedBy: 'reviewer' }];
  expect((await getOperationalReport(user, {}, undefined, now)).totals.incidents).toBe(0);
  expect((await getOperationalReport(user, { basis: 'verified' }, undefined, now)).totals.incidents).toBe(1);
  expect((await getOperationalReport(user, { basis: 'resolved' }, undefined, now)).totals.recordedResolved).toBe(1);
});
test('priority filtering requires recorded assignment provenance', async () => {
  incidents = [{ ...make(1), priority: 'high' }, { ...make(2), priority: 'high', priorityAssignedBy: 'reviewer', priorityAssignedAt: new Date('2026-10-01') }];
  expect((await getOperationalReport(user, { priority: 'high' }, undefined, now)).totals.incidents).toBe(1);
});
test('terminal SLA outcome and historical breach remain distinct from active overdue', async () => {
  incidents = [
    { ...make(1), sla: { startedAt: new Date('2026-10-01'), deadline: new Date('2026-10-02'), closedAt: new Date('2026-10-03'), state: 'breached' } },
    { ...make(2), sla: { startedAt: new Date('2026-10-01'), deadline: new Date('2026-10-03'), closedAt: new Date('2026-10-02'), state: 'met' } },
    { ...make(3), sla: { deadline: new Date('2026-10-01'), state: 'active' } }
  ];
  const result = await getOperationalReport(user, {}, undefined, now);
  expect(result.sla).toEqual([{ _id: 'breached', count: 1 }, { _id: 'met', count: 1 }, { _id: 'not_started', count: 1 }]);
  expect(result.totals.recordedBreaches).toBe(1);
});
