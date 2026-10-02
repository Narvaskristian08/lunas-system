/**
 * AI Service Integration
 * Connects to LUNAS AI microservice for infrastructure damage detection
 */

const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
const AI_SERVICE_TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT || '30000');
const AI_SERVICE_ENABLED = process.env.AI_SERVICE_ENABLED !== 'false';

const normalizePrivacyDetection = (payload = {}) => {
  const status = payload.status || payload.analysisStatus || payload.analysis_status;
  const detections = Array.isArray(payload.detections)
    ? payload.detections
      .filter((detection) => detection && typeof detection === 'object')
      .slice(0, 50)
    : [];
  const modelAvailable = payload.model_available !== false
    && payload.modelAvailable !== false
    && status === 'completed';

  return {
    success: payload.success === true && modelAvailable,
    status: modelAvailable ? 'completed' : (status || 'unavailable'),
    modelAvailable,
    model: typeof payload.model === 'string' ? payload.model.slice(0, 80) : undefined,
    detected: modelAvailable && payload.detected === true,
    detectedRegions: modelAvailable
      ? Math.max(0, Math.round(Number(payload.detected_regions ?? payload.detectedRegions ?? detections.length)))
      : 0,
    detections,
    error: typeof payload.error === 'string' ? payload.error : undefined
  };
};

/**
 * Ask the privacy model for regions that must be redacted before storage.
 * The backend deliberately applies the returned masks itself so the AI
 * service never controls which bytes are persisted.
 */
exports.detectPrivacy = async (imageBuffer) => {
  if (!AI_SERVICE_ENABLED) {
    return {
      success: false,
      status: 'unavailable',
      modelAvailable: false,
      detections: [],
      detectedRegions: 0,
      error: 'AI service disabled'
    };
  }

  try {
    const form = new FormData();
    form.append('image', imageBuffer, {
      filename: 'evidence.webp',
      contentType: 'image/webp'
    });
    const response = await axios.post(`${AI_SERVICE_URL}/api/v1/detect/privacy`, form, {
      headers: form.getHeaders(),
      timeout: AI_SERVICE_TIMEOUT,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      validateStatus: (status) => status >= 200 && status < 600
    });
    return normalizePrivacyDetection(response.data);
  } catch (error) {
    logger.error(`Privacy detection failed: ${error.message}`);
    return {
      success: false,
      status: 'failed',
      modelAvailable: false,
      detections: [],
      detectedRegions: 0,
      error: error.message
    };
  }
};

/**
 * Check if AI service is available
 */
exports.checkHealth = async () => {
  if (!AI_SERVICE_ENABLED) {
    return { available: false, reason: 'AI service disabled' };
  }

  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/v1/health`, {
      timeout: 5000
    });
    
    return {
      available: response.data.status === 'healthy',
      device: response.data.device,
      models_loaded: response.data.models_loaded
    };
  } catch (error) {
    logger.warn(`AI service health check failed: ${error.message}`);
    return { available: false, reason: error.message };
  }
};

/**
 * Detect road damage in image
 * 
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Detection options
 * @returns {Promise<Object>} Detection results
 */
exports.detectRoadDamage = async (imageBuffer, options = {}) => {
  if (!AI_SERVICE_ENABLED) {
    logger.info('AI service disabled, skipping detection');
    return {
      success: false,
      enabled: false,
      detections: [],
      total_detections: 0
    };
  }

  try {
    const form = new FormData();
    form.append('image', imageBuffer, {
      filename: 'incident.jpg',
      contentType: 'image/jpeg'
    });

    if (options.confidence) {
      form.append('confidence', options.confidence.toString());
    }

    logger.info('Calling AI service for road damage detection...');
    
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/v1/detect/road-damage`,
      form,
      {
        headers: form.getHeaders(),
        timeout: AI_SERVICE_TIMEOUT,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    logger.info(`AI detection completed: ${response.data.total_detections} detections in ${response.data.processing_time}s`);
    
    return {
      ...response.data,
      enabled: true
    };

  } catch (error) {
    logger.error(`AI detection failed: ${error.message}`);
    
    return {
      success: false,
      enabled: true,
      error: error.message,
      detections: [],
      total_detections: 0
    };
  }
};

/**
 * Detect cracks in image
 * 
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Detection options
 * @returns {Promise<Object>} Detection results
 */
exports.detectCracks = async (imageBuffer, options = {}) => {
  if (!AI_SERVICE_ENABLED) {
    return {
      success: false,
      enabled: false,
      detections: [],
      total_detections: 0
    };
  }

  try {
    const form = new FormData();
    form.append('image', imageBuffer, 'incident.jpg');

    if (options.confidence) {
      form.append('confidence', options.confidence.toString());
    }

    const response = await axios.post(
      `${AI_SERVICE_URL}/api/v1/detect/cracks`,
      form,
      {
        headers: form.getHeaders(),
        timeout: AI_SERVICE_TIMEOUT
      }
    );

    return {
      ...response.data,
      enabled: true
    };

  } catch (error) {
    logger.error(`Crack detection failed: ${error.message}`);
    
    return {
      success: false,
      enabled: true,
      error: error.message,
      detections: [],
      total_detections: 0
    };
  }
};

/**
 * Comprehensive detection based on incident category
 * 
 * @param {Buffer} imageBuffer - Image buffer
 * @param {String} category - Incident category
 * @returns {Promise<Object>} Comprehensive detection results
 */
exports.comprehensiveDetection = async (imageBuffer, category = '') => {
  const canonicalCategory = String(category || '').trim().toLowerCase();
  const supportedCategories = new Set(['road', 'drainage', 'electrical', 'water', 'gas', 'streetlight', 'other']);
  if (!supportedCategories.has(canonicalCategory)) {
    return {
      success: true,
      enabled: AI_SERVICE_ENABLED,
      aiEnabled: AI_SERVICE_ENABLED,
      category: canonicalCategory,
      analysisStatus: 'unavailable',
      modelAvailable: false,
      requiresManualReview: true,
      advisoryOnly: true
    };
  }

  if (!AI_SERVICE_ENABLED) {
    return {
      success: true,
      enabled: false,
      aiEnabled: false,
      category: canonicalCategory,
      analysisStatus: 'unavailable',
      modelAvailable: false,
      requires_manual_review: true,
      advisory_only: true,
      findings: []
    };
  }

  try {
    const form = new FormData();
    form.append('image', imageBuffer, {
      filename: 'incident.webp',
      contentType: 'image/webp'
    });
    form.append('category', canonicalCategory);

    logger.info(`Running comprehensive AI detection for category: ${canonicalCategory}`);
    
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/v1/detect/comprehensive`,
      form,
      {
        headers: form.getHeaders(),
        timeout: AI_SERVICE_TIMEOUT
      }
    );

    logger.info(`Comprehensive detection completed. Confidence: ${response.data.confidence_score}`);
    
    return {
      ...response.data,
      enabled: true,
      aiEnabled: true,
      category: canonicalCategory,
      success: response.data.success !== false
    };

  } catch (error) {
    logger.error(`Comprehensive detection failed: ${error.message}`);
    
    return {
      success: false,
      enabled: true,
      aiEnabled: true,
      category: canonicalCategory,
      analysisStatus: 'failed',
      modelAvailable: false,
      findings: [],
      error: error.message,
      requires_manual_review: true
    };
  }
};

/**
 * Process incident image with AI
 * Main function to be called by incident controller
 * 
 * @param {Buffer} imageBuffer - Image buffer
 * @param {String} category - Incident category
 * @returns {Promise<Object>} AI analysis results
 */
exports.analyzeIncidentImage = async (imageBuffer, category = '') => {
  try {
    const canonicalCategory = String(category || '').trim().toLowerCase();
    const result = await this.comprehensiveDetection(imageBuffer, canonicalCategory);
    const model = typeof result.model === 'string' && result.model.trim()
      ? result.model.trim().slice(0, 80)
      : undefined;
    const rawFindings = Array.isArray(result.findings)
      ? result.findings
      : Array.isArray(result.detections) ? result.detections : [];
    const findings = rawFindings
      .filter((finding) => finding && typeof finding === 'object')
      .map((finding) => ({
        label: typeof finding.label === 'string' ? finding.label : finding.class,
        confidence: finding.confidence,
        bbox: finding.bbox
      }))
      .filter((finding) => finding.label && finding.bbox)
      .slice(0, 50);

    if (!result.success || result.analysis_status === 'failed' || result.analysisStatus === 'failed') {
      logger.warn('AI detection failed or disabled, using manual classification');
      return {
        success: false,
        category: canonicalCategory,
        model,
        analysisStatus: 'failed',
        detected: false,
        confidence: 0,
        findings: [],
        modelAvailable: false,
        requiresManualReview: true,
        aiEnabled: result.enabled || false,
        error: result.error
      };
    }

    if (result.analysis_status === 'unavailable'
      || result.analysisStatus === 'unavailable'
      || result.model_available === false
      || result.modelAvailable === false) {
      return {
        success: true,
        category: canonicalCategory,
        model,
        analysisStatus: 'unavailable',
        detected: false,
        confidence: 0,
        findings: [],
        modelAvailable: false,
        requiresManualReview: true,
        advisoryOnly: true,
        aiEnabled: result.aiEnabled ?? result.enabled ?? false
      };
    }

    const reportedConfidence = Number(result.confidence_score ?? result.confidence);
    const confidence = Number.isFinite(reportedConfidence)
      ? Math.max(0, Math.min(1, reportedConfidence))
      : Math.max(0, ...findings.map((finding) => Number(finding.confidence) || 0));

    // Extract relevant information
    const aiAnalysis = {
      success: true,
      category: canonicalCategory,
      model,
      analysisStatus: 'completed',
      modelAvailable: true,
      detected: findings.length > 0,
      confidence,
      suggestion: result.ai_suggestion || findings[0]?.label,
      findings,
      // Keep the manual-only invariant even if the AI service returns a
      // high-confidence result that claims review is unnecessary.
      requiresManualReview: true,
      advisoryOnly: true,
      aiEnabled: true,
      detections: {
        road_damage: canonicalCategory === 'road' ? findings.length : 0,
        cracks: findings.filter((finding) => String(finding.label).toLowerCase().includes('crack')).length
      },
      processing_time: result.processing_time
    };

    // Log AI results
    logger.info('AI Analysis Results:', {
      detected: aiAnalysis.detected,
      confidence: aiAnalysis.confidence,
      suggestion: aiAnalysis.suggestion
    });

    return aiAnalysis;

  } catch (error) {
    logger.error(`AI analysis error: ${error.message}`);
    
    return {
      detected: false,
      confidence: 0,
      category: String(category || '').trim().toLowerCase(),
      analysisStatus: 'failed',
      modelAvailable: false,
      findings: [],
      requiresManualReview: true,
      aiEnabled: false,
      error: error.message
    };
  }
};

/**
 * Get AI service status
 */
exports.getStatus = async () => {
  const health = await this.checkHealth();
  
  return {
    enabled: AI_SERVICE_ENABLED,
    url: AI_SERVICE_URL,
    available: health.available,
    device: health.device,
    models_loaded: health.models_loaded,
    reason: health.reason
  };
};
