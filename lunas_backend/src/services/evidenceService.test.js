jest.mock('./storageService', () => ({
  uploadToStorage: jest.fn(),
  deleteFromStorage: jest.fn()
}));
jest.mock('./aiService', () => ({ analyzeIncidentImage: jest.fn() }));

const sharp = require('sharp');
const storageService = require('./storageService');
const aiService = require('./aiService');
const { processAndUploadEvidence, processAndUploadRepairEvidence } = require('./evidenceService');

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

  test('normalizes a valid image, strips it to WebP metadata, and records truthful privacy state', async () => {
    const sourceImage = await sharp({
      create: { width: 400, height: 300, channels: 3, background: '#9c1d36' }
    }).png().toBuffer();
    storageService.uploadToStorage.mockResolvedValue({
      key: 'incidents/citizen/evidence.webp',
      url: undefined
    });

    const result = await processAndUploadEvidence([{
      buffer: sourceImage,
      originalname: 'evidence.png',
      mimetype: 'image/png'
    }], { reporterId: 'citizen', category: 'road', privacyAcknowledged: true });

    expect(storageService.uploadToStorage).toHaveBeenCalledWith(
      expect.any(Buffer),
      'evidence.webp',
      'image/webp',
      'incidents/citizen'
    );
    const storedBuffer = storageService.uploadToStorage.mock.calls[0][0];
    await expect(sharp(storedBuffer).metadata()).resolves.toEqual(
      expect.objectContaining({ format: 'webp' })
    );
    expect(result.images[0]).toEqual(expect.objectContaining({
      key: 'incidents/citizen/evidence.webp',
      mimeType: 'image/webp',
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
    expect(result.aiAnalysis).toEqual(expect.objectContaining({
      analysisStatus: 'unavailable',
      requiresManualReview: true,
      advisoryOnly: true,
      detections: { roadDamage: 0, cracks: 0 }
    }));
    expect(aiService.analyzeIncidentImage).not.toHaveBeenCalled();
  });

  test('normalizes and persists a completed AI result while forcing manual review', async () => {
    const sourceImage = await sharp({
      create: { width: 400, height: 300, channels: 3, background: '#9c1d36' }
    }).png().toBuffer();
    process.env.AI_EVIDENCE_ANALYSIS_ENABLED = 'true';
    aiService.analyzeIncidentImage.mockResolvedValue({
      detected: true,
      confidence: 0.92,
      suggestion: 'pothole',
      // Deliberately false to prove the backend owns this invariant.
      requiresManualReview: false,
      aiEnabled: true,
      detections: { road_damage: 1, cracks: 0 },
      findings: [{
        label: 'pothole',
        confidence: 0.92,
        bbox: { x1: 0.1, y1: 0.2, x2: 0.7, y2: 0.8 }
      }]
    });
    storageService.uploadToStorage.mockResolvedValue({
      key: 'incidents/citizen/evidence.webp',
      url: undefined
    });

    const result = await processAndUploadEvidence([{
      buffer: sourceImage,
      originalname: 'evidence.png',
      mimetype: 'image/png'
    }], { reporterId: 'citizen', category: 'road' });

    expect(aiService.analyzeIncidentImage).toHaveBeenCalledWith(expect.any(Buffer), 'road');
    expect(result.aiAnalysis).toEqual(expect.objectContaining({
      analysisStatus: 'completed',
      hazardType: 'pothole',
      confidence: 0.92,
      detections: { roadDamage: 1, cracks: 0 },
      findings: [{
        label: 'pothole',
        confidence: 0.92,
        bbox: { x1: 0.1, y1: 0.2, x2: 0.7, y2: 0.8 }
      }],
      requiresManualReview: true,
      advisoryOnly: true
    }));
    expect(result.images[0].aiFindings).toEqual([{
      label: 'pothole',
      confidence: 0.92,
      bbox: { x1: 0.1, y1: 0.2, x2: 0.7, y2: 0.8 }
    }]);
  });

  test('keeps the report path available when AI fails', async () => {
    const sourceImage = await sharp({
      create: { width: 400, height: 300, channels: 3, background: '#9c1d36' }
    }).png().toBuffer();
    process.env.AI_EVIDENCE_ANALYSIS_ENABLED = 'true';
    aiService.analyzeIncidentImage.mockRejectedValue(new Error('AI service offline'));
    storageService.uploadToStorage.mockResolvedValue({
      key: 'incidents/citizen/evidence.webp',
      url: undefined
    });

    const result = await processAndUploadEvidence([{
      buffer: sourceImage,
      originalname: 'evidence.png',
      mimetype: 'image/png'
    }], { reporterId: 'citizen', category: 'road' });

    expect(storageService.uploadToStorage).toHaveBeenCalled();
    expect(result.aiAnalysis).toEqual(expect.objectContaining({
      analysisStatus: 'failed',
      requiresManualReview: true,
      advisoryOnly: true
    }));
    expect(result.aiAnalysis).not.toHaveProperty('error');
  });

  test('converts repair evidence to WebP without invoking incident AI', async () => {
    const sourceImage = await sharp({
      create: { width: 400, height: 300, channels: 3, background: '#1d609c' }
    }).jpeg().toBuffer();
    storageService.uploadToStorage.mockResolvedValue({
      key: 'work-orders/order/repair/worker/repair-evidence.webp',
      url: undefined
    });

    const result = await processAndUploadRepairEvidence([{
      buffer: sourceImage,
      originalname: 'repair.jpg',
      mimetype: 'image/jpeg'
    }], { workOrderId: 'order', uploaderId: 'worker' });

    expect(storageService.uploadToStorage).toHaveBeenCalledWith(
      expect.any(Buffer),
      'repair-evidence.webp',
      'image/webp',
      'work-orders/order/repair/worker'
    );
    const storedBuffer = storageService.uploadToStorage.mock.calls[0][0];
    await expect(sharp(storedBuffer).metadata()).resolves.toEqual(
      expect.objectContaining({ format: 'webp' })
    );
    expect(result[0]).toEqual(expect.objectContaining({ mimeType: 'image/webp' }));
    expect(aiService.analyzeIncidentImage).not.toHaveBeenCalled();
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
