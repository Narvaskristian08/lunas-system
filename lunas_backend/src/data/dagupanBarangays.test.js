const {
  DAGUPAN_BARANGAY_RECORDS,
  DAGUPAN_BARANGAYS,
  canonicalizeBarangay,
  isRecognizedBarangay
} = require('./dagupanBarangays');

describe('canonical Dagupan barangays', () => {
  test('contains the 31 official barangay names without duplicates', () => {
    expect(DAGUPAN_BARANGAYS).toHaveLength(31);
    expect(new Set(DAGUPAN_BARANGAYS).size).toBe(31);
    expect(DAGUPAN_BARANGAYS).toEqual(expect.arrayContaining([
      'Barangay II',
      'Herrero',
      'Pugaro Suit'
    ]));
    expect(DAGUPAN_BARANGAY_RECORDS).toContainEqual({
      psgcCode: '0105518027',
      name: 'Pugaro Suit'
    });
  });

  test('normalizes case and whitespace only', () => {
    expect(canonicalizeBarangay('  herrero ')).toBe('Herrero');
    expect(canonicalizeBarangay('barangay   ii')).toBe('Barangay II');
  });

  test.each(['Barangay III', 'Barangay II & III', 'Herrero-Perez', 'Pugaro'])(
    'does not silently map the legacy value %s',
    (legacyValue) => {
      expect(isRecognizedBarangay(legacyValue)).toBe(false);
    }
  );
});
