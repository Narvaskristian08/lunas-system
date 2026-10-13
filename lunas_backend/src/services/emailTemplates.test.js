const { renderBrandedEmail } = require('./emailTemplates');

describe('LUNAS transactional email template', () => {
  test('renders a branded responsive code email and escapes dynamic content', () => {
    const message = renderBrandedEmail({
      preheader: 'Verify your account',
      title: 'Verify your email',
      greeting: 'Hello <Juan>,',
      intro: 'Use the code below.',
      code: '123456',
      expiryText: 'This code expires in 10 minutes.'
    });

    expect(message.html).toContain('LUNAS');
    expect(message.html).toContain('Local Urban Network Assistance System');
    expect(message.html).toContain('role="presentation"');
    expect(message.html).toContain('123456');
    expect(message.html).toContain('Hello &lt;Juan&gt;,');
    expect(message.html).toContain('background:#0b1f3a');
    expect(message.text).toContain('LUNAS');
    expect(message.text).toContain('Verification code: 123456');
    expect(message.text).toContain('Hello <Juan>,');
  });

  test('renders a safe action button and escapes the action URL', () => {
    const message = renderBrandedEmail({
      title: 'Reset your password',
      greeting: 'Hello there,',
      intro: 'Use the button below.',
      ctaLabel: 'Reset password',
      ctaUrl: 'https://app.example.test/reset?token=a&next=/dashboard'
    });

    expect(message.html).toContain('Reset password');
    expect(message.html).toContain('token=a&amp;next=/dashboard');
    expect(message.text).toContain('Reset password: https://app.example.test/reset?token=a&next=/dashboard');
  });

  test('renders a browser fallback link below a primary app action', () => {
    const message = renderBrandedEmail({
      title: 'Reset your password',
      intro: 'Choose where to continue.',
      ctaLabel: 'Open in LUNAS Mobile',
      ctaUrl: 'lunas://app/reset-password?token=abc',
      secondaryCtaLabel: 'Use browser instead',
      secondaryCtaUrl: 'https://app.example.test/reset-password?token=abc'
    });

    expect(message.html).toContain('Open in LUNAS Mobile');
    expect(message.html).toContain('Use browser instead');
    expect(message.text).toContain('Open in LUNAS Mobile: lunas://app/reset-password?token=abc');
    expect(message.text).toContain('Use browser instead: https://app.example.test/reset-password?token=abc');
  });
});
