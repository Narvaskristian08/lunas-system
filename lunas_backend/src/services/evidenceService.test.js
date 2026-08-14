jest.mock('./storageService', () => ({
  uploadToStorage: jest.fn(),
  deleteFromStorage: jest.fn()
}));
jest.mock('./aiService', () => ({ analyzeIncidentImage: jest.fn() }));

const sharp = require('sharp');
const storageService = require('./storageService');
const { processAndUploadEvidence } = require('./evidenceService');

describe('secure incident evidence processing', () => {
  const originalAiFlag = process.env.AI_EVIDENCE_ANALYSIS_ENABLED;
  const originalMinWidth = process.env.MIN_IMAGE_WIDTH;
  const originalMinHeight = process.env.MIN_IMAGE_HEIGHT;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AI_EVIDENCE_ANALYSIS_ENABLED = 'false';
    process.env.MIN_IMAGE_WIDTH = '320';
    process.env.MIN_IMAGE_HEIGHT = '240';
  });

  afterAll(() => {
    if (originalAiFlag === undefined) delete process.env.AI_EVIDENCE_ANALYSIS_ENABLED;
    else process.env.AI_EVIDENCE_ANALYSIS_ENABLED = originalAiFlag;
    if (originalMinWidth === undefined) delete process.env.MIN_IMAGE_WIDTH;
    else process.env.MIN_IMAGE_WIDTH = originalMinWidth;
    if (originalMinHeight === undefined) delete process.env.MIN_IMAGE_HEIGHT;
    else process.env.MIN_IMAGE_HEIGHT = originalMinHeight;
  });

  test('normalizes a valid image, strips it to JPEG metadata, and records truthful privacy state', async () => {
    const sourceImage = await sharp({
      create: { width: 400, height: 300, channels: 3, background: '#9c1d36' }
    }).png().toBuffer();
    storageService.uploadToStorage.mockResolvedValue({
      key: 'incidents/citizen/evidence.jpg',
      url: undefined
    });

    const result = await processAndUploadEvidence([{
      buffer: sourceImage,
      originalname: 'evidence.png',
      mimetype: 'image/png'
    }], { reporterId: 'citizen', category: 'road', privacyAcknowledged: true });

    expect(storageService.uploadToStorage).toHaveBeenCalledWith(
      expect.any(Buffer),
      'evidence.jpg',
      'image/jpeg',
      'incidents/citizen'
    );
    expect(result.images[0]).toEqual(expect.objectContaining({
      key: 'incidents/citizen/evidence.jpg',
      mimeType: 'image/jpeg',
      width: 400,
      height: 300,
      quality: { status: 'passed', issues: [] },
      privacyProcessing: expect.objectContaining({
        status: 'not_available',
        applied: false,
        acknowledgedByReporter: true
      })
    }));
    expect(result.images[0].checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  test('rejects corrupt image data before it can reach object storage', async () => {
    await expect(processAndUploadEvidence([{
      buffer: Buffer.from('not an image'),
      originalname: 'bad.jpg',
      mimetype: 'image/jpeg'
    }], { reporterId: 'citizen', category: 'road' })).rejects.toThrow('invalid or corrupt');

    expect(storageService.uploadToStorage).not.toHaveBeenCalled();
  });
});
