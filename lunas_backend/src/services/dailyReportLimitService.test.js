jest.mock('../models/Incident', () => ({ countDocuments: jest.fn() }));
jest.mock('../models/DailyReportQuota', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  create: jest.fn()
}));

const Incident = require('../models/Incident');
const DailyReportQuota = require('../models/DailyReportQuota');
const {
  DAILY_REPORT_LIMIT,
  getManilaDayWindow,
  getDailyReportAllowance,
  reserveDailyReportSlot,
  releaseDailyReportSlot
} = require('./dailyReportLimitService');

const query = (value) => ({
  lean: jest.fn().mockResolvedValue(value)
});

describe('daily citizen report limit', () => {
  beforeEach(() => jest.clearAllMocks());

  test('uses Philippine midnight boundaries independent of the host timezone', () => {
    const beforeMidnight = getManilaDayWindow(new Date('2026-10-26T15:59:00.000Z'));
    const afterMidnight = getManilaDayWindow(new Date('2026-10-26T16:01:00.000Z'));

    expect(beforeMidnight.dayKey).toBe('2026-10-26');
    expect(beforeMidnight.start.toISOString()).toBe('2026-10-25T16:00:00.000Z');
    expect(beforeMidnight.end.toISOString()).toBe('2026-10-26T16:00:00.000Z');
    expect(afterMidnight.dayKey).toBe('2026-10-27');
  });

  test('reports actual created incidents and independent citizen scope', async () => {
    Incident.countDocuments.mockResolvedValue(2);
    const result = await getDailyReportAllowance({
      reporterId: 'citizen-a',
      now: new Date('2026-10-26T08:00:00.000Z')
    });

    expect(Incident.countDocuments).toHaveBeenCalledWith(expect.objectContaining({
      reporter: 'citizen-a',
      createdAt: {
        $gte: new Date('2026-10-25T16:00:00.000Z'),
        $lt: new Date('2026-10-26T16:00:00.000Z')
      }
    }));
    expect(result).toMatchObject({ limit: DAILY_REPORT_LIMIT, submitted: 2, remaining: 1, dayKey: '2026-10-26' });
  });

  test('initializes the quota from existing reports and reserves one slot', async () => {
    DailyReportQuota.findOne.mockReturnValueOnce(query(null));
    Incident.countDocuments.mockResolvedValueOnce(2);
    DailyReportQuota.create.mockResolvedValueOnce({ count: 3 });

    const result = await reserveDailyReportSlot({
      reporterId: 'citizen-a',
      now: new Date('2026-10-26T08:00:00.000Z')
    });

    expect(DailyReportQuota.create).toHaveBeenCalledWith(expect.objectContaining({
      reporter: 'citizen-a', dayKey: '2026-10-26', count: 3
    }));
    expect(result).toMatchObject({ allowed: true, submitted: 3, remaining: 0 });
  });

  test('conditionally reserves from an existing quota and rejects at three', async () => {
    DailyReportQuota.findOne.mockReturnValueOnce(query({ _id: 'quota', count: 2 }));
    DailyReportQuota.findOneAndUpdate.mockReturnValueOnce(query({ _id: 'quota', count: 3 }));

    const allowed = await reserveDailyReportSlot({ reporterId: 'citizen-a' });
    expect(DailyReportQuota.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'quota', count: { $lt: 3 } },
      { $inc: { count: 1 } },
      { new: true }
    );
    expect(allowed).toMatchObject({ allowed: true, remaining: 0 });

    DailyReportQuota.findOne.mockReturnValueOnce(query({ _id: 'quota', count: 3 }));
    DailyReportQuota.findOneAndUpdate.mockReturnValueOnce(query(null));
    const rejected = await reserveDailyReportSlot({ reporterId: 'citizen-a' });
    expect(rejected).toMatchObject({ allowed: false, remaining: 0 });
  });

  test('allows only one of concurrent requests to take the final slot', async () => {
    DailyReportQuota.findOne
      .mockReturnValueOnce(query({ _id: 'quota', count: 2 }))
      .mockReturnValueOnce(query({ _id: 'quota', count: 2 }));
    DailyReportQuota.findOneAndUpdate
      .mockReturnValueOnce(query({ _id: 'quota', count: 3 }))
      .mockReturnValueOnce(query(null));

    const results = await Promise.all([
      reserveDailyReportSlot({ reporterId: 'citizen-a' }),
      reserveDailyReportSlot({ reporterId: 'citizen-a' })
    ]);

    expect(results.filter((result) => result.allowed)).toHaveLength(1);
    expect(results.filter((result) => !result.allowed)).toHaveLength(1);
  });

  test('releases only the reserved citizen/day counter slot', async () => {
    DailyReportQuota.findOneAndUpdate.mockResolvedValueOnce({ count: 2 });
    await releaseDailyReportSlot({ reporterId: 'citizen-a', dayKey: '2026-10-26' });
    expect(DailyReportQuota.findOneAndUpdate).toHaveBeenCalledWith(
      { reporter: 'citizen-a', dayKey: '2026-10-26', count: { $gt: 0 } },
      { $inc: { count: -1 } },
      { new: true }
    );
  });
});
