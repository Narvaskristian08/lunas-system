const crypto = require('crypto');
const aiService = require('./aiService');
const storageService = require('./storageService');
const {
  applyPrivacyRedactions,
  checkImageQuality,
  getImageMetadata,
  prepareEvidenceImage
} = require('../utils/imageProcessor');
const logger = require('../utils/logger');

const clientError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const shouldRunAiAnalysis = () => process.env.AI_EVIDENCE_ANALYSIS_ENABLED === 'true';
const shouldRunPrivacyRedaction = () => process.env.PRIVACY_REDACTION_ENABLED !== 'false';

const privacyUnavailableError = () => {
  const error = new Error(
    'Evidence privacy processing is temporarily unavailable. Please try again later.'
  );
  error.statusCode = 503;
  return error;
};

const redactEvidence = async (preparedBuffer) => {
  if (!shouldRunPrivacyRedaction()) throw privacyUnavailableError();

  const privacy = await aiService.detectPrivacy(preparedBuffer);
  if (!privacy || privacy.status !== 'completed' || privacy.modelAvailable !== true) {
    throw privacyUnavailableError();
  }

  const result = await applyPrivacyRedactions(preparedBuffer, privacy.detections);
  return {
    buffer: result.buffer,
    detectedRegions: result.detectedRegions,
    status: 'applied'
  };
};

const toDetectionCount = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.max(0, Math.round(numericValue)) : 0;
};

const clampUnit = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.max(0, Math.min(1, numericValue)) : null;
};

const normalizeFinding = (finding) => {
  if (!finding || typeof finding !== 'object') return null;
  const label = typeof finding.label === 'string'
    ? finding.label
    : typeof finding.class === 'string' ? finding.class : null;
  const bbox = finding.bbox && typeof finding.bbox === 'object' ? finding.bbox : null;
  if (!label || !bbox) return null;
  const normalizedBox = {};
  for (const key of ['x1', 'y1', 'x2', 'y2']) {
    const value = clampUnit(bbox[key]);
    if (value === null) return null;
    normalizedBox[key] = value;
  }
  if (normalizedBox.x2 < normalizedBox.x1 || normalizedBox.y2 < normalizedBox.y1) return null;
  const confidenceStatus = finding.confidenceStatus === 'manual_review'
    || finding.confidence_status === 'manual_review'
    ? 'manual_review'
    : finding.confidenceStatus === 'production'
      || finding.confidence_status === 'production'
      ? 'production'
      : undefined;
  const productionThreshold = clampUnit(
    finding.productionThreshold ?? finding.production_threshold
  );
  return {
    label: label.trim().slice(0, 100),
    confidence: clampUnit(finding.confidence) ?? 0,
    bbox: normalizedBox,
    ...(confidenceStatus ? { confidenceStatus } : {}),
    ...(productionThreshold !== null ? { productionThreshold } : {})
  };
};

const normalizeAiAnalysis = (analysis) => {
  const hasError = typeof analysis?.error === 'string' && analysis.error.trim().length > 0;
  const failed = hasError || (analysis?.success === false && analysis?.aiEnabled === true);
  const explicitlyUnavailable = analysis?.analysisStatus === 'unavailable'
    || analysis?.analysis_status === 'unavailable'
    || analysis?.modelAvailable === false;
  const explicitlyFailed = analysis?.analysisStatus === 'failed'
    || analysis?.analysis_status === 'failed';
  const category = typeof analysis?.category === 'string'
    ? analysis.category.trim().toLowerCase()
    : '';
  const manualReviewOnly = category === 'other'
    || analysis?.manualReviewOnly === true
    || analysis?.manual_review_only === true;
  const completed = analysis?.aiEnabled === true
    && analysis?.success !== false
    && !failed
    && !explicitlyUnavailable
    && !explicitlyFailed
    && typeof analysis.confidence === 'number'
    && Number.isFinite(analysis.confidence);
  const classificationStatus = manualReviewOnly
    ? 'manual_review'
    : analysis?.classificationStatus === 'manual_review'
    || analysis?.classification_status === 'manual_review'
    ? 'manual_review'
    : analysis?.classificationStatus === 'no_detection'
      || analysis?.classification_status === 'no_detection'
      ? 'no_detection'
      : 'production';
  const suggestedHazard = !manualReviewOnly && classificationStatus === 'production'
    ? analysis?.suggestion ?? analysis?.hazardType
    : null;
  const findings = (Array.isArray(analysis?.findings) ? analysis.findings : [])
    .map(normalizeFinding)
    .map((finding) => manualReviewOnly && finding
      ? { ...finding, confidenceStatus: 'manual_review' }
      : finding)
    .filter(Boolean)
    .slice(0, 50);
  const analysisStatus = completed ? 'completed' : (failed || explicitlyFailed ? 'failed' : 'unavailable');

  return {
    analysisStatus,
    category: typeof analysis?.category === 'string' ? analysis.category.slice(0, 40) : undefined,
    manualReviewOnly,
    model: typeof analysis?.model === 'string' ? analysis.model.trim().slice(0, 80) : undefined,
    modelAvailable: completed,
    classificationStatus,
    detected: completed && !manualReviewOnly && analysis?.detected === true,
    hazardType: completed
      ? (typeof suggestedHazard === 'string'
        ? suggestedHazard.slice(0, 100)
        : null)
      : null,
    confidence: completed ? Math.max(0, Math.min(1, analysis.confidence)) : 0,
    findings,
    findingsCount: findings.length,
    detections: {
      roadDamage: toDetectionCount(analysis?.detections?.roadDamage ?? analysis?.detections?.road_damage),
      cracks: toDetectionCount(analysis?.detections?.cracks)
    },
    // Legacy compatibility field for hazard-analysis consumers.
    needsPrivacyMasking: false,
    // This invariant is intentionally owned by the backend, regardless of AI output.
    requiresManualReview: true,
    advisoryOnly: true,
    processedAt: new Date()
  };
};

const processOne = async (file, { reporterId, category, privacyAcknowledged }) => {
  const quality = await checkImageQuality(file.buffer);
  if (!quality.isValid) {
    throw clientError(`Evidence image failed quality validation: ${quality.issues.join('; ')}`);
  }

  // Re-encode first so the detector sees the same orientation and dimensions
  // that will be used by the stored evidence.
  const preparedBuffer = await prepareEvidenceImage(file.buffer);
  const privacy = await redactEvidence(preparedBuffer);
  const storedBuffer = privacy.buffer;
  const preparedMetadata = await getImageMetadata(storedBuffer);
  const checksum = crypto.createHash('sha256').update(storedBuffer).digest('hex');

  let aiAnalysis;
  if (shouldRunAiAnalysis()) {
    try {
      aiAnalysis = normalizeAiAnalysis(await aiService.analyzeIncidentImage(storedBuffer, category));
    } catch (error) {
      // AI is advisory. A service failure must never prevent evidence storage.
      aiAnalysis = normalizeAiAnalysis({ error: error?.message || 'AI analysis failed' });
    }
  } else {
    aiAnalysis = normalizeAiAnalysis();
  }

  const uploaded = await storageService.uploadToStorage(
    storedBuffer,
    'evidence.webp',
    'image/webp',
    `incidents/${reporterId}`
  );

  return {
    uploadKey: uploaded.key,
    aiAnalysis,
    evidence: {
      url: uploaded.url,
      key: uploaded.key,
      uploadedAt: new Date(),
      isPrivacyMasked: privacy.detectedRegions > 0,
      mimeType: 'image/webp',
      size: storedBuffer.length,
      checksum,
      width: preparedMetadata.width,
      height: preparedMetadata.height,
      quality: {
        status: 'passed',
        issues: []
      },
      aiFindings: aiAnalysis.findings,
      privacyProcessing: {
        status: privacy.status,
        applied: true,
        acknowledgedByReporter: Boolean(privacyAcknowledged),
        detectedRegions: privacy.detectedRegions,
        processedAt: new Date()
      }
    }
  };
};

const mergeAiAnalyses = (analyses = []) => {
  const completed = analyses.filter((analysis) => analysis?.analysisStatus === 'completed');
  const failed = analyses.some((analysis) => analysis?.analysisStatus === 'failed');
  const findings = analyses.flatMap((analysis) => analysis?.findings || []).slice(0, 50);
  const first = analyses.find((analysis) => analysis?.category) || {};
  return {
    analysisStatus: completed.length ? 'completed' : (failed ? 'failed' : 'unavailable'),
    category: first.category,
    model: first.model,
    modelAvailable: completed.length > 0,
    classificationStatus: completed.some((analysis) => analysis?.classificationStatus === 'production')
      ? 'production'
      : findings.length ? 'manual_review' : 'no_detection',
    detected: completed.some((analysis) => analysis.detected),
    hazardType: completed.find((analysis) => analysis.classificationStatus === 'production' && analysis.hazardType)?.hazardType || null,
    confidence: completed.length
      ? Math.max(...completed.map((analysis) => Number(analysis.confidence) || 0))
      : 0,
    findings,
    findingsCount: findings.length,
    detections: {
      roadDamage: analyses.reduce((sum, analysis) => sum + toDetectionCount(analysis?.detections?.roadDamage), 0),
      cracks: analyses.reduce((sum, analysis) => sum + toDetectionCount(analysis?.detections?.cracks), 0)
    },
    needsPrivacyMasking: false,
    requiresManualReview: true,
    advisoryOnly: true,
    processedAt: new Date()
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
      aiAnalysis: mergeAiAnalyses(results.map((result) => result.aiAnalysis))
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
      const privacy = await redactEvidence(preparedBuffer);
      const storedBuffer = privacy.buffer;
      const metadata = await getImageMetadata(storedBuffer);
      const checksum = crypto.createHash('sha256').update(storedBuffer).digest('hex');
      const uploaded = await storageService.uploadToStorage(
        storedBuffer,
        'repair-evidence.webp',
        'image/webp',
        `work-orders/${workOrderId}/repair/${uploaderId}`
      );
      uploadedKeys.push(uploaded.key);
      evidence.push({
        key: uploaded.key,
        url: uploaded.url,
        mimeType: 'image/webp',
        size: storedBuffer.length,
        checksum,
        width: metadata.width,
        height: metadata.height,
        uploadedBy: uploaderId,
        uploadedAt: new Date(),
        isPrivacyMasked: privacy.detectedRegions > 0,
        privacyProcessing: {
          status: privacy.status,
          applied: true,
          detectedRegions: privacy.detectedRegions,
          processedAt: new Date()
        }
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

exports.normalizeAiAnalysis = normalizeAiAnalysis;
exports.mergeAiAnalyses = mergeAiAnalyses;
