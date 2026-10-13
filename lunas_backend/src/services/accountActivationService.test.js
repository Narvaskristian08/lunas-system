jest.mock('./emailDeliveryService', () => ({
  deliverEmail: jest.fn(),
  escapeHtml: value => String(value)
}));

const { deliverEmail } = require('./emailDeliveryService');
const { createActivation, deliverActivation } = require('./accountActivationService');

describe('account activation email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ACCOUNT_ACTIVATION_APP_URL = 'https://app.example.test/activate';
    deliverEmail.mockResolvedValue({ configured: true, delivered: true });
  });

  afterEach(() => {
    delete process.env.ACCOUNT_ACTIVATION_APP_URL;
  });

  test('uses the branded LUNAS activation layout', async () => {
    const activation = createActivation();

    await expect(deliverActivation({
      email: 'staff@example.test',
      firstName: 'Staff'
    }, activation)).resolves.toEqual({ configured: true, delivered: true });

    expect(deliverEmail).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Activate your LUNAS account',
      text: expect.stringContaining('LUNAS'),
      html: expect.stringContaining('Activate account')
    }));
  });
});
