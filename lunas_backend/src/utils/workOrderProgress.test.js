const {
  getCurrentProgressPercent,
  normalizeProgressPercent,
  validateProgressAdvance
} = require('./workOrderProgress');

describe('work-order progress helpers', () => {
  test('normalizes only the supported repair-progress milestones', () => {
    expect(normalizeProgressPercent(0)).toBe(0);
    expect(normalizeProgressPercent('50')).toBe(50);
    expect(normalizeProgressPercent(100)).toBe(100);
  });

  test('rejects empty, out-of-range, and non-numeric percentages', () => {
    expect(normalizeProgressPercent('')).toBeNull();
    expect(normalizeProgressPercent(-1)).toBeNull();
    expect(normalizeProgressPercent(100.01)).toBeNull();
    expect(normalizeProgressPercent('65.5')).toBeNull();
    expect(normalizeProgressPercent('not-a-number')).toBeNull();
  });

  test('uses 0 as the legacy default when a work order has no stored percentage', () => {
    expect(getCurrentProgressPercent(undefined)).toBe(0);
  });

  test('allows a milestone advance but prevents regression and repeats', () => {
    expect(validateProgressAdvance(50, 75)).toEqual({
      valid: true,
      progressPercent: 75
    });
    expect(validateProgressAdvance(50, 25)).toEqual({
      valid: false,
      message: 'Repair progress cannot be lower than the current progress'
    });
    expect(validateProgressAdvance(50, 50)).toEqual({
      valid: false,
      message: 'Repair progress is already recorded at this percentage'
    });
  });
});
