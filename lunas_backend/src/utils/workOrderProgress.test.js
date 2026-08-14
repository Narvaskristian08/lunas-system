const {
  getCurrentProgressPercent,
  normalizeProgressPercent,
  validateProgressAdvance
} = require('./workOrderProgress');

describe('work-order progress helpers', () => {
  test('normalizes valid percentages in the inclusive 0–100 range', () => {
    expect(normalizeProgressPercent(0)).toBe(0);
    expect(normalizeProgressPercent('65.5')).toBe(65.5);
    expect(normalizeProgressPercent(100)).toBe(100);
  });

  test('rejects empty, out-of-range, and non-numeric percentages', () => {
    expect(normalizeProgressPercent('')).toBeNull();
    expect(normalizeProgressPercent(-1)).toBeNull();
    expect(normalizeProgressPercent(100.01)).toBeNull();
    expect(normalizeProgressPercent('not-a-number')).toBeNull();
  });

  test('uses 0 as the legacy default when a work order has no stored percentage', () => {
    expect(getCurrentProgressPercent(undefined)).toBe(0);
  });

  test('allows progress to advance but prevents regression', () => {
    expect(validateProgressAdvance(65, 80)).toEqual({
      valid: true,
      progressPercent: 80
    });
    expect(validateProgressAdvance(65, 64)).toEqual({
      valid: false,
      message: 'Progress percent cannot be lower than the current progress'
    });
  });
});
