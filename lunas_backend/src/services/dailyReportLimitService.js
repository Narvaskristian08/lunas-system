const Incident = require('../models/Incident');
const DailyReportQuota = require('../models/DailyReportQuota');

const DAILY_REPORT_LIMIT = 3;
const DAILY_REPORT_TIME_ZONE = 'Asia/Manila';
const DAILY_REPORT_LIMIT_CODE = 'DAILY_REPORT_LIMIT_REACHED';
const DAILY_REPORT_LIMIT_MESSAGE = 'You have reached the daily limit of 3 reports. You can submit another report tomorrow.';
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

const datePart = (parts, type) => parts.find((part) => part.type === type)?.value;

const getManilaDayWindow = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: DAILY_REPORT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const year = Number(datePart(parts, 'year'));
  const month = Number(datePart(parts, 'month'));
  const day = Number(datePart(parts, 'day'));
  const dayKey = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  // Dagupan observes UTC+8 without DST. Constructing the boundary in UTC
  // keeps this independent from the API host's local timezone.
  const start = new Date(Date.UTC(year, month - 1, day) - MANILA_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { dayKey, start, end };
};

const allowance = ({ dayKey, end, submitted }) => ({
  limit: DAILY_REPORT_LIMIT,
  submitted: Math.max(0, submitted),
  remaining: Math.max(0, DAILY_REPORT_LIMIT - submitted),
  dayKey,
  resetsAt: end
});

const getDailyReportAllowance = async ({ reporterId, now = new Date() }) => {
  const window = getManilaDayWindow(now);
  const submitted = await Incident.countDocuments({
    reporter: reporterId,
    createdAt: { $gte: window.start, $lt: window.end }
  });
  return allowance({ ...window, submitted: Number(submitted) || 0 });
};

const quotaDocument = ({ reporterId, window, count }) => ({
  reporter: reporterId,
  dayKey: window.dayKey,
  count,
  expiresAt: window.end
});

const reserveDailyReportSlot = async ({ reporterId, now = new Date() }) => {
  const window = getManilaDayWindow(now);

  // A quota document is a small per-citizen/day counter. The conditional
  // update is atomic in MongoDB, so concurrent requests cannot both reserve
  // the final available slot.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const current = await DailyReportQuota.findOne({
      reporter: reporterId,
      dayKey: window.dayKey
    }).lean();

    if (current) {
      const updated = await DailyReportQuota.findOneAndUpdate(
        { _id: current._id, count: { $lt: DAILY_REPORT_LIMIT } },
        { $inc: { count: 1 } },
        { new: true }
      ).lean();
      if (updated) {
        return {
          allowed: true,
          reservation: { dayKey: window.dayKey },
          ...allowance({ ...window, submitted: Number(updated.count) || 0 })
        };
      }
      return {
        allowed: false,
        ...allowance({ ...window, submitted: Number(current.count) || DAILY_REPORT_LIMIT })
      };
    }

    const submitted = Number(await Incident.countDocuments({
      reporter: reporterId,
      createdAt: { $gte: window.start, $lt: window.end }
    })) || 0;
    const allowed = submitted < DAILY_REPORT_LIMIT;
    try {
      // Inserting the first reservation includes the already-created reports
      // from this day. A unique-key race simply retries the atomic update.
      const created = await DailyReportQuota.create(quotaDocument({
        reporterId,
        window,
        count: allowed ? submitted + 1 : submitted
      }));
      if (!allowed) {
        return { allowed: false, ...allowance({ ...window, submitted }) };
      }
      return {
        allowed: true,
        reservation: { dayKey: window.dayKey },
        ...allowance({ ...window, submitted: Number(created.count) || submitted + 1 })
      };
    } catch (error) {
      if (error?.code === 11000) continue;
      throw error;
    }
  }

  const current = await getDailyReportAllowance({ reporterId, now });
  return { allowed: false, ...current };
};

const releaseDailyReportSlot = async ({ reporterId, dayKey }) => {
  if (!dayKey) return;
  await DailyReportQuota.findOneAndUpdate(
    { reporter: reporterId, dayKey, count: { $gt: 0 } },
    { $inc: { count: -1 } },
    { new: true }
  );
};

module.exports = {
  DAILY_REPORT_LIMIT,
  DAILY_REPORT_TIME_ZONE,
  DAILY_REPORT_LIMIT_CODE,
  DAILY_REPORT_LIMIT_MESSAGE,
  getManilaDayWindow,
  getDailyReportAllowance,
  reserveDailyReportSlot,
  releaseDailyReportSlot
};
