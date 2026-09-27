jest.mock('../models/AuditLog', () => ({ create: jest.fn() }));

const AuditLog = require('../models/AuditLog');
const { createAuditLog, sanitizeAuditValue } = require('./auditLogger');

describe('audit logger safety', () => {
  beforeEach(() => jest.clearAllMocks());

  test('recursively removes credentials and one-time codes from audit details', async () => {
    AuditLog.create.mockResolvedValue({ _id: 'audit-1' });

    await createAuditLog({
      action: 'user_login',
      performedBy: '507f191e810c19729de860aa',
      details: {
        password: 'plaintext',
        nested: { captchaToken: 'captcha-secret', code: '123456', reason: 'invalid' }
      }
    });

    expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      actorType: 'user',
      details: {
        password: '[REDACTED]',
        nested: { captchaToken: '[REDACTED]', code: '[REDACTED]', reason: 'invalid' }
      }
    }));
  });

  test('preserves safe operational details', () => {
    expect(sanitizeAuditValue({ reason: 'account_archived', attempts: 3 }))
      .toEqual({ reason: 'account_archived', attempts: 3 });
  });
});
