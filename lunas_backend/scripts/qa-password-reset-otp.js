// Local MongoDB integration check. No email is sent and no real account is used.
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../src/models/User');
const AuditLog = require('../src/models/AuditLog');
let deliveredCode;
require('../src/services/passwordResetDeliveryService').deliverPasswordReset = async ({ code }) => {
  deliveredCode = code;
  return { configured: true, delivered: true };
};
const { forgotPassword, verifyPasswordResetCode, resetPassword } = require('../src/controllers/authController');

async function invoke(handler, body) {
  const result = { status: 200 };
  const res = {
    status(status) { result.status = status; return this; },
    json(payload) { result.payload = payload; return this; }
  };
  await handler({ body, ip: '127.0.0.1', headers: {} }, res, error => { throw error; });
  return result;
}

(async () => {
  assert.equal(process.env.NODE_ENV, 'development', 'Run only in local development');
  await mongoose.connect(process.env.MONGODB_URI);
  const id = new mongoose.Types.ObjectId();
  const email = `otp-qa-${crypto.randomUUID()}@example.test`;
  try {
    await User.create({ _id: id, email, firstName: 'OTP', lastName: 'QA', role: 'citizen', password: 'TemporaryQa123!', isActive: true, isVerified: true, accountStatus: 'active' });
    await invoke(forgotPassword, { email });
    const firstCode = deliveredCode;
    assert.match(firstCode, /^\d{6}$/);
    await invoke(forgotPassword, { email });
    assert.equal(deliveredCode, firstCode, 'resend cooldown preserves the original code');
    const wrongCode = firstCode === '000000' ? '111111' : '000000';
    for (let attempt = 0; attempt < 5; attempt++) {
      assert.equal((await invoke(verifyPasswordResetCode, { email, code: wrongCode })).status, 400);
    }
    assert.equal((await invoke(verifyPasswordResetCode, { email, code: firstCode })).status, 400, 'five failures lock the code');
    await User.updateOne({ _id: id }, { $set: { passwordResetCodeSentAt: new Date(0) } });
    await invoke(forgotPassword, { email });
    await User.updateOne({ _id: id }, { $set: { passwordResetCodeExpires: new Date(0) } });
    assert.equal((await invoke(verifyPasswordResetCode, { email, code: deliveredCode })).status, 400, 'expired codes fail');
    await User.updateOne({ _id: id }, { $set: { passwordResetCodeSentAt: new Date(0) } });
    await invoke(forgotPassword, { email });
    const verified = await invoke(verifyPasswordResetCode, { email, code: deliveredCode });
    assert.equal(verified.status, 200);
    assert.equal((await invoke(verifyPasswordResetCode, { email, code: deliveredCode })).status, 400, 'code reuse fails');
    const token = verified.payload.data.resetToken;
    assert.equal((await invoke(resetPassword, { token, password: 'ChangedQaPassword123!' })).status, 200);
    assert.equal((await invoke(resetPassword, { token, password: 'ReplayQaPassword123!' })).status, 400, 'reset token reuse fails');
    const user = await User.findById(id).select('+password');
    assert.equal(await user.comparePassword('ChangedQaPassword123!'), true);
    console.log('PASS: OTP delivery boundary, cooldown, five-attempt lock, expiry, one-time verification, password change, and replay rejection');
  } finally {
    await AuditLog.deleteMany({ resourceId: id });
    await User.deleteOne({ _id: id });
    await mongoose.disconnect();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
