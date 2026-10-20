const { getImageMetadata } = require('./imageProcessor');
test('image decoder rejects inputs above the 40 megapixel budget before normalization', async () => {
  // Header-only metadata check; no large raster fixture is allocated by tests.
  const source = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="7000" height="6000"><rect width="7000" height="6000" fill="red"/></svg>');
  await expect(getImageMetadata(source)).rejects.toThrow('invalid or corrupt');
});
