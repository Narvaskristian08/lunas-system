const {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} = require('@aws-sdk/client-s3');
const { getSignedUrl: signS3Url } = require('@aws-sdk/s3-request-presigner');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const logger = require('../utils/logger');
const crypto = require('crypto');

let s3 = null;
let signingS3 = null;
let supabase = null;

const getBucketName = () => process.env.S3_EVIDENCE_BUCKET || process.env.S3_BUCKET || '';
const getRegion = () => process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '';
const getSignedUrlExpiry = () => {
  const configured = Number(process.env.EVIDENCE_SIGNED_URL_EXPIRE_SECONDS);
  return Number.isInteger(configured) && configured > 0 ? Math.min(configured, 300) : 300;
};
const isLegacyReadEnabled = () => process.env.SUPABASE_MIGRATION_READ_ENABLED === 'true';

const initializeS3 = () => {
  if (!s3) {
    const region = getRegion();
    if (!region) throw new Error('AWS_REGION is not configured');

    const endpoint = process.env.S3_ENDPOINT;
    s3 = new S3Client({
      region,
      ...(endpoint ? { endpoint, forcePathStyle: true } : {})
    });
  }
  return s3;
};

const initializeSupabase = () => {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  return supabase;
};

const toS3Error = (operation, error) => {
  logger.error(`S3 ${operation} error: ${error.message}`);
  return new Error(`Failed to ${operation} file in S3`);
};

const bodyToBuffer = async (body) => {
  if (!body) return Buffer.alloc(0);
  if (typeof body.transformToByteArray === 'function') {
    return Buffer.from(await body.transformToByteArray());
  }

  const chunks = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
};

const createStorageKey = (fileName, folder) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const fileExtension = String(fileName || '').split('.').pop() || 'bin';
  return `${folder}/${timestamp}-${randomString}.${fileExtension}`;
};

const uploadToS3 = async (fileBuffer, key, mimeType) => {
  try {
    const encryption = process.env.S3_ENDPOINT && process.env.S3_SERVER_SIDE_ENCRYPTION === ''
      ? undefined
      : process.env.S3_SERVER_SIDE_ENCRYPTION || 'AES256';
    await initializeS3().send(new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      CacheControl: 'private, no-store',
      ...(encryption ? { ServerSideEncryption: encryption } : {})
    }));
  } catch (error) {
    throw toS3Error('upload', error);
  }
};

const deleteFromS3 = async (filePath) => {
  try {
    await initializeS3().send(new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: filePath
    }));
  } catch (error) {
    throw toS3Error('delete', error);
  }
};

const getS3SignedUrl = async (filePath, expiresIn) => {
  try {
    if (!signingS3) {
      const endpoint = process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT;
      signingS3 = new S3Client({
        region: getRegion(),
        ...(endpoint ? { endpoint, forcePathStyle: true } : {})
      });
    }
    return await signS3Url(
      signingS3,
      new GetObjectCommand({ Bucket: getBucketName(), Key: filePath }),
      { expiresIn }
    );
  } catch (error) {
    throw toS3Error('generate a signed URL for', error);
  }
};

const getLegacySignedUrl = async (filePath, legacyUrl) => {
  const client = initializeSupabase();
  if (!client) {
    if (legacyUrl) return legacyUrl;
    throw new Error('Legacy Supabase migration storage is not configured');
  }

  if (process.env.SUPABASE_STORAGE_PUBLIC === 'true' && legacyUrl) return legacyUrl;

  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'lunas-storage';
  const { data, error } = await client.storage
    .from(bucketName)
    .createSignedUrl(filePath, getSignedUrlExpiry());

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Legacy storage did not return a signed URL');
  }
  return data.signedUrl;
};

/**
 * Upload a privacy-processed file to the private S3 evidence bucket.
 * The returned URL is intentionally empty because persisted URLs must not
 * expire; callers generate an authorized URL through getEvidenceUrl instead.
 */
exports.uploadToStorage = async (fileBuffer, fileName, mimeType, folder = 'uploads') => {
  const key = createStorageKey(fileName, folder);
  await uploadToS3(fileBuffer, key, mimeType);
  return { url: undefined, path: key, key };
};

exports.deleteFromStorage = async (filePath) => {
  if (!filePath) return;
  await deleteFromS3(filePath);
  logger.info(`Deleted file from S3: ${filePath}`);
};

exports.optimizeImage = async (imageBuffer, maxWidth = 1920, quality = 80) => {
  try {
    return await sharp(imageBuffer)
      .resize(maxWidth, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
  } catch (error) {
    logger.error('Image optimization error:', error);
    throw new Error('Failed to optimize image');
  }
};

exports.generateThumbnail = async (imageBuffer, size = 300) => {
  try {
    return await sharp(imageBuffer)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 70 })
      .toBuffer();
  } catch (error) {
    logger.error('Thumbnail generation error:', error);
    throw new Error('Failed to generate thumbnail');
  }
};

exports.uploadMultipleToStorage = async (files, folder = 'uploads') => {
  try {
    return await Promise.all(files.map((file) => (
      exports.uploadToStorage(file.buffer, file.name, file.mimeType, folder)
    )));
  } catch (error) {
    logger.error(`Multiple S3 upload error: ${error.message}`);
    throw new Error('Failed to upload files to S3');
  }
};

exports.getSignedUrl = async (filePath, expiresIn = getSignedUrlExpiry()) => {
  if (typeof filePath !== 'string' || !filePath || filePath.length > 1024 || filePath.startsWith('/')
    || filePath.includes('\\') || filePath.includes('..') || filePath.includes('://') || Array.from(filePath).some(character => character.charCodeAt(0) < 32)) throw new Error('Invalid persisted evidence reference');
  expiresIn = Number.isInteger(expiresIn) && expiresIn > 0 ? Math.min(expiresIn, 300) : getSignedUrlExpiry();
  try {
    return await getS3SignedUrl(filePath, expiresIn);
  } catch (error) {
    logger.error(`S3 signed URL error: ${error.message}`);
    throw new Error('Failed to generate signed URL');
  }
};

/**
 * Generate a short-lived URL at read time. During migration, an opt-in
 * Supabase fallback keeps historical objects readable while S3 is verified.
 */
exports.getEvidenceUrl = async (filePath, legacyUrl) => {
  if (!filePath) return legacyUrl || null;

  try {
    return await exports.getSignedUrl(filePath, getSignedUrlExpiry());
  } catch (error) {
    if (!isLegacyReadEnabled()) throw error;
    if (typeof logger.warn === 'function') {
      logger.warn(`Falling back to legacy evidence storage for ${filePath}`);
    }
    return getLegacySignedUrl(filePath, legacyUrl);
  }
};

exports.listFiles = async (folder = '') => {
  try {
    const response = await initializeS3().send(new ListObjectsV2Command({
      Bucket: getBucketName(),
      Prefix: folder || undefined
    }));
    return (response.Contents || []).map((object) => ({
      name: object.Key,
      id: object.ETag,
      size: object.Size,
      updated_at: object.LastModified
    }));
  } catch (error) {
    throw toS3Error('list', error);
  }
};

exports.downloadFile = async (filePath) => {
  try {
    const response = await initializeS3().send(new GetObjectCommand({
      Bucket: getBucketName(),
      Key: filePath
    }));
    return bodyToBuffer(response.Body);
  } catch (error) {
    throw toS3Error('download', error);
  }
};

module.exports = exports;
