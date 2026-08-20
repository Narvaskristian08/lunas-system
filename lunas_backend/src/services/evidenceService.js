const crypto = require('crypto');
const aiService = require('./aiService');
const storageService = require('./storageService');
const { checkImageQuality, getImageMetadata, prepareEvidenceImage } = require('../utils/imageProcessor');
const logger = require('../utils/logger');

const clientError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const shouldRunAiAnalysis = () => process.env.AI_EVIDENCE_ANALYSIS_ENABLED === 'true';

const normalizeAiAnalysis = (analysis) => {
  if (!analysis || analysis.aiEnabled !== true || typeof analysis.confidence !== 'number') {
    return null;
  }

  return {
    detected: Boolean(analysis.detected),
    hazardType: typeof analysis.suggestion === 'string' ? analysis.suggestion.slice(0, 100) : undefined,
    confidence: Math.max(0, Math.min(1, analysis.confidence)),
    needsPrivacyMasking: Boolean(analysis.detections?.privacy_concerns),
    processedAt: new Date()
  };
};

const processOne = async (file, { reporterId, category, privacyAcknowledged }) => {
  const quality = await checkImageQuality(file.buffer);
  if (!quality.isValid) {
    throw clientError(`Evidence image failed quality validation: ${quality.issues.join('; ')}`);
  }

  // Sharp re-encodes to JPEG, which strips EXIF/GPS metadata and avoids
  // retaining the original, unprocessed upload in storage.
  const preparedBuffer = await prepareEvidenceImage(file.buffer);
  const preparedMetadata = await getImageMetadata(preparedBuffer);
  const checksum = crypto.createHash('sha256').update(preparedBuffer).digest('hex');

  let aiAnalysis = null;
  if (shouldRunAiAnalysis()) {
    // The existing AI service is only trusted when it returns a real result.
    // A missing model/service simply leaves manual category selection intact.
    aiAnalysis = normalizeAiAnalysis(await aiService.analyzeIncidentImage(preparedBuffer, category));
  }

  const uploaded = await storageService.uploadToStorage(
    preparedBuffer,
    'evidence.jpg',
    'image/jpeg',
    `incidents/${reporterId}`
  );

  return {
    uploadKey: uploaded.key,
    aiAnalysis,
    evidence: {
      url: uploaded.url,
      key: uploaded.key,
      uploadedAt: new Date(),
      isPrivacyMasked: false,
      mimeType: 'image/jpeg',
      size: preparedBuffer.length,
      checksum,
      width: preparedMetadata.width,
      height: preparedMetadata.height,
      quality: {
        status: 'passed',
        issues: []
      },
      // No face/license-plate detector capable of producing a redacted image
      // is configured in this backend. This truthful state prevents clients
      // from claiming that redaction happened when it did not.
      privacyProcessing: {
        status: 'not_available',
        applied: false,
        acknowledgedByReporter: Boolean(privacyAcknowledged),
        processedAt: new Date()
      }
    }
  };
};

exports.getUploadedEvidenceFiles = (req) => Object.values(req.files || {}).flat();

/**
 * Process and upload multipart incident evidence. Any files already uploaded
 * during a later failure are removed so incident creation does not leave
 * orphaned private objects behind.
 */
exports.processAndUploadEvidence = async (files, context) => {
  const uploadedKeys = [];

  try {
    const results = [];
    for (const file of files) {
      const result = await processOne(file, context);
      uploadedKeys.push(result.uploadKey);
      results.push(result);
    }

    return {
      images: results.map((result) => result.evidence),
      aiAnalysis: results.map((result) => result.aiAnalysis).find(Boolean) || null
    };
  } catch (error) {
    await Promise.allSettled(uploadedKeys.map((key) => storageService.deleteFromStorage(key)));
    logger.error(`Incident evidence processing failed: ${error.message}`);
    throw error;
  }
};

/**
 * Process field evidence for a work-order progress update. It deliberately
 * follows the same private-storage, re-encode, EXIF-stripping and checksum
 * path as citizen evidence, but does not perform incident AI classification.
 */
exports.processAndUploadRepairEvidence = async (files, { workOrderId, uploaderId }) => {
  const uploadedKeys = [];
  try {
    const evidence = [];
    for (const file of files || []) {
      const quality = await checkImageQuality(file.buffer);
      if (!quality.isValid) {
        throw clientError(`Repair evidence image failed quality validation: ${quality.issues.join('; ')}`);
      }

      const preparedBuffer = await prepareEvidenceImage(file.buffer);
      const metadata = await getImageMetadata(preparedBuffer);
      const checksum = crypto.createHash('sha256').update(preparedBuffer).digest('hex');
      const uploaded = await storageService.uploadToStorage(
        preparedBuffer,
        'repair-evidence.jpg',
        'image/jpeg',
        `work-orders/${workOrderId}/repair/${uploaderId}`
      );
      uploadedKeys.push(uploaded.key);
      evidence.push({
        key: uploaded.key,
        url: uploaded.url,
        mimeType: 'image/jpeg',
        size: preparedBuffer.length,
        checksum,
        width: metadata.width,
        height: metadata.height,
        uploadedBy: uploaderId,
        uploadedAt: new Date()
      });
    }
    return evidence;
  } catch (error) {
    await Promise.allSettled(uploadedKeys.map((key) => storageService.deleteFromStorage(key)));
    logger.error(`Repair evidence processing failed: ${error.message}`);
    throw error;
  }
};

exports.cleanupEvidence = async (images = []) => {
  const keys = images.map((image) => image.key).filter(Boolean);
  await Promise.allSettled(keys.map((key) => storageService.deleteFromStorage(key)));
};
