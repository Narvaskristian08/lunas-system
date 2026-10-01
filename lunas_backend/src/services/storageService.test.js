jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));
jest.mock('../utils/logger', () => ({ info: jest.fn(), error: jest.fn() }));
const { createClient } = require('@supabase/supabase-js');
const storage = require('./storageService');
const originalEnvironment = { ...process.env };
let bucket;
beforeEach(() => {
  jest.clearAllMocks();
  process.env.SUPABASE_URL = 'https://storage.example.test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only';
  process.env.SUPABASE_STORAGE_PUBLIC = 'false';
  process.env.EVIDENCE_SIGNED_URL_EXPIRE_SECONDS = '300';
  // The service retains its initialized client; keep one bucket for all tests.
  if (!bucket) {
    bucket = { upload: jest.fn(), createSignedUrl: jest.fn(), getPublicUrl: jest.fn() };
    createClient.mockReturnValue({ storage: { from: () => bucket } });
  }
  bucket.upload.mockResolvedValue({ error: null });
  bucket.createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://storage.example.test/signed?token=test' } });
});
afterAll(() => { process.env = originalEnvironment; });

test('private evidence upload does not request or return a public URL', async () => {
  const result = await storage.uploadToStorage(Buffer.from('test'), 'evidence.webp', 'image/webp', 'incidents/owner');
  expect(result.url).toBeUndefined();
  expect(result.key).toMatch(/^incidents\/owner\/.+\.webp$/);
  expect(bucket.getPublicUrl).not.toHaveBeenCalled();
  expect(bucket.upload).toHaveBeenCalledWith(result.key, expect.any(Buffer), { contentType: 'image/webp', upsert: false });
});

test('private evidence ignores a legacy public URL and generates a short-lived signed URL', async () => {
  await expect(storage.getEvidenceUrl('incidents/owner/evidence.webp', 'https://legacy.example/public.jpg'))
    .resolves.toBe('https://storage.example.test/signed?token=test');
  expect(bucket.createSignedUrl).toHaveBeenCalledWith('incidents/owner/evidence.webp', 300);
  expect(bucket.getPublicUrl).not.toHaveBeenCalled();
});

test('historical evidence without a storage key retains its original URL', async () => {
  await expect(storage.getEvidenceUrl(undefined, 'https://legacy.example/evidence.jpg'))
    .resolves.toBe('https://legacy.example/evidence.jpg');
  expect(bucket.createSignedUrl).not.toHaveBeenCalled();
});

test('failed signing rejects instead of returning a public URL for private evidence', async () => {
  bucket.createSignedUrl.mockResolvedValueOnce({ error: { message: 'unavailable' } });
  await expect(storage.getEvidenceUrl('private/evidence.webp', 'https://legacy.example/public.jpg'))
    .rejects.toThrow('Failed to generate signed URL');
  expect(bucket.getPublicUrl).not.toHaveBeenCalled();
});
