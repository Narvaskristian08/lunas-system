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
 * Detect privacy-sensitive objects
 * 
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} Detection results
 */
exports.detectPrivacyConcerns = async (imageBuffer) => {
  if (!AI_SERVICE_ENABLED) {
    return {
      success: false,
      enabled: false,
      has_privacy_concerns: false,
      detections: []
    };
  }

  try {
    const form = new FormData();
    form.append('image', imageBuffer, 'incident.jpg');

    const response = await axios.post(
      `${AI_SERVICE_URL}/api/v1/detect/privacy`,
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
    logger.error(`Privacy detection failed: ${error.message}`);
    
    return {
      success: false,
      enabled: true,
      has_privacy_concerns: false,
      detections: [],
      error: error.message
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
exports.comprehensiveDetection = async (imageBuffer, category = 'road_pavement') => {
  if (!AI_SERVICE_ENABLED) {
    return {
      success: false,
      enabled: false,
      category: category,
      requires_manual_review: true
    };
  }

  try {
    const form = new FormData();
    form.append('image', imageBuffer, 'incident.jpg');
    form.append('category', category);

    logger.info(`Running comprehensive AI detection for category: ${category}`);
    
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
      success: true
    };

  } catch (error) {
    logger.error(`Comprehensive detection failed: ${error.message}`);
    
    return {
      success: false,
      enabled: true,
      category: category,
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
exports.analyzeIncidentImage = async (imageBuffer, category = 'road') => {
  try {
    // Map LUNAS categories to AI categories
    const categoryMap = {
      'road': 'road_pavement',
      'drainage': 'drainage_sewage',
      'electrical': 'street_lighting',
      'water': 'water_supply',
      'gas': 'water_supply',
      'streetlight': 'street_lighting',
      'other': 'road_pavement'
    };

    const aiCategory = categoryMap[category] || 'road_pavement';

    // Run comprehensive detection
    const result = await this.comprehensiveDetection(imageBuffer, aiCategory);

    if (!result.success) {
      logger.warn('AI detection failed or disabled, using manual classification');
      return {
        detected: false,
        confidence: 0,
        requiresManualReview: true,
        aiEnabled: result.enabled || false,
        error: result.error
      };
    }

    // Extract relevant information
    const aiAnalysis = {
      detected: result.confidence_score > 0.5,
      confidence: result.confidence_score,
      suggestion: result.ai_suggestion,
      requiresManualReview: result.requires_manual_review,
      aiEnabled: true,
      detections: {
        road_damage: result.road_damage?.total_detections || 0,
        cracks: result.cracks?.total_detections || 0,
        privacy_concerns: result.privacy?.has_privacy_concerns || false
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
