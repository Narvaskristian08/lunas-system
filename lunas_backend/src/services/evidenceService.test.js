jest.mock('./storageService', () => ({
  uploadToStorage: jest.fn(),
  deleteFromStorage: jest.fn()
}));
jest.mock('./aiService', () => ({
  analyzeIncidentImage: jest.fn(),
  detectPrivacy: jest.fn().mockResolvedValue({
    success: true,
    status: 'completed',
    modelAvailable: true,
    detections: [],
    detectedRegions: 0
  })
}));

const sharp = require('sharp');
const crypto = require('crypto');
const storageService = require('./storageService');
const aiService = require('./aiService');
const { processAndUploadEvidence, processAndUploadRepairEvidence } = require('./evidenceService');

describe('secure incident evidence processing', () => {
  const originalAiFlag = process.env.AI_EVIDENCE_ANALYSIS_ENABLED;
  const originalMinWidth = process.env.MIN_IMAGE_WIDTH;
  const originalMinHeight = process.env.MIN_IMAGE_HEIGHT;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService.detectPrivacy.mockResolvedValue({
      success: true,
      status: 'completed',
      modelAvailable: true,
      detections: [],
      detectedRegions: 0
    });
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

  test('normalizes a valid image, redacts it before storage, and records privacy state', async () => {
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
        status: 'applied',
        applied: true,
        detectedRegions: 0,
        acknowledgedByReporter: true
      })
    }));
    expect(result.images[0].checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(result.images[0].checksum).toBe(crypto.createHash('sha256').update(storedBuffer).digest('hex'));
    expect(result.images[0].isPrivacyMasked).toBe(false);
    expect(result.aiAnalysis).toEqual(expect.objectContaining({
      analysisStatus: 'unavailable',
      requiresManualReview: true,
      advisoryOnly: true,
      detections: { roadDamage: 0, cracks: 0 }
    }));
    expect(aiService.analyzeIncidentImage).not.toHaveBeenCalled();
  });

  test('applies detector regions before storing evidence', async () => {
    const sourceImage = await sharp({
      create: { width: 400, height: 300, channels: 3, background: '#9c1d36' }
    }).png().toBuffer();
    aiService.detectPrivacy.mockResolvedValue({
      success: true,
      status: 'completed',
      modelAvailable: true,
      detections: [{ label: 'face', bbox: { x1: 0.2, y1: 0.2, x2: 0.4, y2: 0.45 } }],
      detectedRegions: 1
    });
    storageService.uploadToStorage.mockResolvedValue({
      key: 'incidents/citizen/evidence.webp',
      url: undefined
    });

    const result = await processAndUploadEvidence([{
      buffer: sourceImage,
      originalname: 'evidence.png',
      mimetype: 'image/png'
    }], { reporterId: 'citizen', category: 'road', privacyAcknowledged: true });

    expect(aiService.detectPrivacy).toHaveBeenCalledWith(expect.any(Buffer));
    expect(result.images[0]).toMatchObject({
      isPrivacyMasked: true,
      privacyProcessing: { status: 'applied', applied: true, detectedRegions: 1 }
    });
  });

  test('fails closed when privacy detection is unavailable', async () => {
    const sourceImage = await sharp({
      create: { width: 400, height: 300, channels: 3, background: '#9c1d36' }
    }).png().toBuffer();
    aiService.detectPrivacy.mockResolvedValue({
      success: false,
      status: 'unavailable',
      modelAvailable: false,
      detections: []
    });

    await expect(processAndUploadEvidence([{
      buffer: sourceImage,
      originalname: 'evidence.png',
      mimetype: 'image/png'
    }], { reporterId: 'citizen', category: 'road' }))
      .rejects.toThrow('privacy processing is temporarily unavailable');
    expect(storageService.uploadToStorage).not.toHaveBeenCalled();
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
      category: 'road',
      model: 'road_damage',
      // Deliberately false to prove the backend owns this invariant.
      requiresManualReview: false,
      aiEnabled: true,
      detections: { road_damage: 1, cracks: 0, privacy_concerns: true },
      isPrivacyMasked: true,
      privacyProcessing: { status: 'applied', applied: true },
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
      category: 'road',
      model: 'road_damage',
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
    expect(result.aiAnalysis.needsPrivacyMasking).toBe(false);
    expect(result.images[0]).toMatchObject({ isPrivacyMasked: false,
      privacyProcessing: { status: 'applied', applied: true } });
  });

  test('strips real EXIF/GPS metadata while retaining valid evidence without a privacy detector', async () => {
    const source = await sharp({ create: { width: 400, height: 300, channels: 3, background: '#9c1d36' } })
      .withMetadata({ exif: { IFD0: { Artist: 'Metadata test' },
        IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '16/1 2/1 0/1', GPSLongitudeRef: 'E', GPSLongitude: '120/1 20/1 0/1' } } })
      .jpeg().toBuffer();
    expect((await sharp(source).metadata()).exif).toBeDefined();
    storageService.uploadToStorage.mockResolvedValue({ key: 'incidents/test/evidence.webp' });
    await processAndUploadEvidence([{ buffer: source }], { reporterId: 'test', category: 'road', privacyAcknowledged: true });
    const stored = await sharp(storageService.uploadToStorage.mock.calls[0][0]).metadata();
    expect(stored.format).toBe('webp');
    expect(stored.exif).toBeUndefined();
    expect(stored.xmp).toBeUndefined();
    expect(stored.iptc).toBeUndefined();
  });

  test('still rejects an image below minimum dimensions before storage', async () => {
    const buffer = await sharp({ create: { width: 100, height: 100, channels: 3, background: '#000' } }).png().toBuffer();
    await expect(processAndUploadEvidence([{ buffer }], { reporterId: 'test', category: 'road' }))
      .rejects.toThrow('quality validation');
    expect(storageService.uploadToStorage).not.toHaveBeenCalled();
  });

  test('decoded formats outside the allowlist remain rejected', async () => {
    const buffer = await sharp({ create: { width: 400, height: 300, channels: 3, background: '#000' } }).gif().toBuffer();
    await expect(processAndUploadEvidence([{ buffer }], { reporterId: 'test', category: 'road' }))
      .rejects.toThrow('Unsupported image format');
    expect(storageService.uploadToStorage).not.toHaveBeenCalled();
  });

  test('the configured byte-size limit remains enforced before storage', async () => {
    const previous = process.env.MAX_FILE_SIZE;
    try {
      process.env.MAX_FILE_SIZE = '16';
      const buffer = await sharp({ create: { width: 400, height: 300, channels: 3, background: '#000' } }).png().toBuffer();
      await expect(processAndUploadEvidence([{ buffer }], { reporterId: 'test', category: 'road' }))
        .rejects.toThrow('File size too large');
      expect(storageService.uploadToStorage).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) delete process.env.MAX_FILE_SIZE;
      else process.env.MAX_FILE_SIZE = previous;
    }
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
