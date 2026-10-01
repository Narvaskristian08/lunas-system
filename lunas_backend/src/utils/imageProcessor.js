const sharp = require('sharp');
const logger = require('./logger');

const permittedFormats = () => (process.env.ALLOWED_IMAGE_FORMATS || 'jpeg,png,webp')
  .split(',')
  .map((format) => format.trim().toLowerCase())
  .filter(Boolean);

/**
 * An explicit no-model response for legacy callers. It does not fabricate an
 * AI classification and leaves manual category selection as the fallback.
 */
exports.detectHazards = async () => ({
  available: false,
  detected: false,
  hazardType: null,
  confidence: null,
  needsPrivacyMasking: null,
  reason: 'No on-device hazard model is configured in the Node service'
});

/**
 * City Engineering verification is a human review. No image-comparison or
 * SSIM result is produced by this utility.
 */
exports.compareRepairImages = async () => ({
  available: false,
  similarity: null,
  improvementDetected: null,
  notes: 'Repair image comparison is not configured'
});

/**
 * Extract image metadata after Sharp has decoded the data. Sharp decoding is
 * also an integrity check; spoofed MIME types and corrupt files fail here.
 */
exports.getImageMetadata = async (imageBuffer) => {
  try {
    const metadata = await sharp(imageBuffer, { failOn: 'error' }).metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: imageBuffer.length,
      hasAlpha: metadata.hasAlpha
    };
  } catch (error) {
    logger.error(`Image metadata extraction failed: ${error.message}`);
    throw new Error('The uploaded image is invalid or corrupt');
  }
};

/**
 * Validate the decoded image using deliberately modest defaults. Deployments
 * may tighten limits through environment variables without changing code.
 */
exports.checkImageQuality = async (imageBuffer) => {
  const metadata = await exports.getImageMetadata(imageBuffer);
  const minWidth = parseInt(process.env.MIN_IMAGE_WIDTH, 10) || 320;
  const minHeight = parseInt(process.env.MIN_IMAGE_HEIGHT, 10) || 240;
  const maxSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024;
  const allowedFormats = permittedFormats();
  const issues = [];

  if (!allowedFormats.includes(metadata.format)) issues.push('Unsupported image format');
  if (metadata.width < minWidth) issues.push(`Image width must be at least ${minWidth}px`);
  if (metadata.height < minHeight) issues.push(`Image height must be at least ${minHeight}px`);
  if (metadata.size > maxSize) issues.push('File size too large');

  return {
    isValid: issues.length === 0,
    ...metadata,
    issues
  };
};

/**
 * Normalize evidence before storage. Re-encoding strips EXIF/GPS and other
 * unnecessary metadata while correcting orientation and bounding dimensions.
 * The backend owns the format conversion so every stored evidence image uses
 * the same WebP storage contract regardless of the mobile/web upload format.
 */
exports.prepareEvidenceImage = async (imageBuffer) => {
  try {
    const maxWidth = parseInt(process.env.EVIDENCE_MAX_WIDTH, 10) || 1920;
    const quality = parseInt(
      process.env.EVIDENCE_WEBP_QUALITY || process.env.EVIDENCE_JPEG_QUALITY,
      10
    ) || 82;

    return await sharp(imageBuffer, { failOn: 'error' })
      .rotate()
      .resize(maxWidth, null, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toBuffer();
  } catch (error) {
    logger.error(`Evidence normalization failed: ${error.message}`);
    throw new Error('Failed to process the uploaded image');
  }
};
