const mockSend = jest.fn();
const mockGetSignedUrl = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({ send: mockSend })),
  PutObjectCommand: class PutObjectCommand { constructor(input) { this.input = input; } },
  DeleteObjectCommand: class DeleteObjectCommand { constructor(input) { this.input = input; } },
  GetObjectCommand: class GetObjectCommand { constructor(input) { this.input = input; } },
  ListObjectsV2Command: class ListObjectsV2Command { constructor(input) { this.input = input; } }
}));
jest.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: mockGetSignedUrl }));
jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));
jest.mock('../utils/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }));

const storage = require('./storageService');
const originalEnvironment = { ...process.env };

beforeEach(() => {
  jest.clearAllMocks();
  process.env.AWS_REGION = 'ap-southeast-1';
  process.env.S3_EVIDENCE_BUCKET = 'lunas-evidence-test';
  process.env.S3_SERVER_SIDE_ENCRYPTION = 'AES256';
  delete process.env.S3_ENDPOINT;
  process.env.SUPABASE_MIGRATION_READ_ENABLED = 'false';
  process.env.EVIDENCE_SIGNED_URL_EXPIRE_SECONDS = '300';
  mockSend.mockResolvedValue({});
  mockGetSignedUrl.mockResolvedValue('https://s3.example.test/signed?token=test');
});

afterAll(() => { process.env = originalEnvironment; });

test('private evidence upload writes to S3 without returning a persisted URL', async () => {
  const result = await storage.uploadToStorage(
    Buffer.from('test'),
    'evidence.webp',
    'image/webp',
    'incidents/owner'
  );

  expect(result.url).toBeUndefined();
  expect(result.key).toMatch(/^incidents\/owner\/.+\.webp$/);
  expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
    input: expect.objectContaining({
      Bucket: 'lunas-evidence-test',
      Key: result.key,
      Body: expect.any(Buffer),
      ContentType: 'image/webp',
      ServerSideEncryption: 'AES256'
    })
  }));
});

test('local endpoint honors explicitly empty encryption', async () => {
  process.env.S3_ENDPOINT = 'http://minio:9000';
  process.env.S3_SERVER_SIDE_ENCRYPTION = '';
  await storage.uploadToStorage(Buffer.from('test'), 'evidence.webp', 'image/webp');
  expect(mockSend.mock.calls[0][0].input).not.toHaveProperty('ServerSideEncryption');
});

test('AWS uploads retain default encryption even when the setting is empty', async () => {
  process.env.S3_SERVER_SIDE_ENCRYPTION = '';
  await storage.uploadToStorage(Buffer.from('test'), 'evidence.webp', 'image/webp');
  expect(mockSend.mock.calls[0][0].input.ServerSideEncryption).toBe('AES256');
});

test('private evidence generates a short-lived S3 signed URL', async () => {
  await expect(storage.getEvidenceUrl('incidents/owner/evidence.webp', 'https://legacy.example/public.jpg'))
    .resolves.toBe('https://s3.example.test/signed?token=test');

  expect(mockGetSignedUrl).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      input: { Bucket: 'lunas-evidence-test', Key: 'incidents/owner/evidence.webp' }
    }),
    { expiresIn: 300 }
  );
});

test('historical evidence without a storage key retains its original URL', async () => {
  await expect(storage.getEvidenceUrl(undefined, 'https://legacy.example/evidence.jpg'))
    .resolves.toBe('https://legacy.example/evidence.jpg');
  expect(mockGetSignedUrl).not.toHaveBeenCalled();
});

test('failed signing fails closed when legacy fallback is disabled', async () => {
  mockGetSignedUrl.mockRejectedValueOnce(new Error('unavailable'));

  await expect(storage.getEvidenceUrl('private/evidence.webp', 'https://legacy.example/public.jpg'))
    .rejects.toThrow('Failed to generate signed URL');
});
