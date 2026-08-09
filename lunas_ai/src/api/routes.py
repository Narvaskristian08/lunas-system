"""
API Routes
RESTful endpoints for LUNAS AI service
"""

import io
import time
from flask import Blueprint, request, jsonify
from PIL import Image
from werkzeug.utils import secure_filename
from ..services.detection_service import detection_service
from ..models.model_manager import model_manager
from ..utils.config import config
from ..utils.logger import logger


# Create blueprint
api = Blueprint('api', __name__)


def validate_image(file) -> tuple:
    """
    Validate uploaded image
    
    Returns:
        (is_valid, error_message, image)
    """
    if not file:
        return False, "No file provided", None
    
    try:
        # Read image
        image_bytes = file.read()
        
        # Check size
        if len(image_bytes) > config.MAX_REQUEST_SIZE:
            return False, f"Image too large (max {config.MAX_REQUEST_SIZE/1024/1024}MB)", None
        
        # Open with PIL
        image = Image.open(io.BytesIO(image_bytes))
        
        # Verify format
        if image.format.lower() not in ['jpeg', 'jpg', 'png', 'webp']:
            return False, f"Unsupported format: {image.format}", None
        
        # Check dimensions
        if max(image.width, image.height) > config.MAX_IMAGE_SIZE:
            logger.info(f"Resizing image from {image.width}x{image.height}")
            image.thumbnail((config.MAX_IMAGE_SIZE, config.MAX_IMAGE_SIZE), Image.Resampling.LANCZOS)
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        return True, None, image
        
    except Exception as e:
        logger.error(f"Image validation failed: {e}")
        return False, f"Invalid image: {str(e)}", None


@api.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        loaded_models = model_manager.get_loaded_models()
        
        return jsonify({
            'status': 'healthy',
            'service': 'lunas-ai',
            'version': '1.0.0',
            'device': model_manager.device,
            'models_loaded': len(loaded_models),
            'loaded_models': loaded_models
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500


@api.route('/models', methods=['GET'])
def list_models():
    """List all available models"""
    try:
        models_info = model_manager.get_all_models_info()
        
        return jsonify({
            'success': True,
            'models': models_info,
            'total': len(models_info)
        }), 200
    except Exception as e:
        logger.error(f"Failed to list models: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api.route('/detect/road-damage', methods=['POST'])
def detect_road_damage():
    """Detect road damage (potholes, cracks, manholes, sewer covers)"""
    start_time = time.time()
    
    try:
        # Validate image
        file = request.files.get('image')
        is_valid, error, image = validate_image(file)
        
        if not is_valid:
            return jsonify({
                'success': False,
                'error': error
            }), 400
        
        # Get optional confidence threshold
        confidence = request.form.get('confidence', type=float)
        
        # Run detection
        result = detection_service.detect_road_damage(image, confidence)
        
        # Add timing
        result['processing_time'] = round(time.time() - start_time, 3)
        
        logger.info(f"Road damage detection completed in {result['processing_time']}s")
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Detection failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api.route('/detect/cracks', methods=['POST'])
def detect_cracks():
    """Detect and segment cracks"""
    start_time = time.time()
    
    try:
        # Validate image
        file = request.files.get('image')
        is_valid, error, image = validate_image(file)
        
        if not is_valid:
            return jsonify({
                'success': False,
                'error': error
            }), 400
        
        # Get optional confidence threshold
        confidence = request.form.get('confidence', type=float)
        
        # Run detection
        result = detection_service.detect_cracks(image, confidence)
        
        # Add timing
        result['processing_time'] = round(time.time() - start_time, 3)
        
        logger.info(f"Crack detection completed in {result['processing_time']}s")
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Detection failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api.route('/detect/privacy', methods=['POST'])
def detect_privacy():
    """Detect privacy-sensitive objects (people, vehicles)"""
    start_time = time.time()
    
    try:
        # Validate image
        file = request.files.get('image')
        is_valid, error, image = validate_image(file)
        
        if not is_valid:
            return jsonify({
                'success': False,
                'error': error
            }), 400
        
        # Get optional confidence threshold
        confidence = request.form.get('confidence', type=float)
        
        # Run detection
        result = detection_service.detect_privacy_concerns(image, confidence)
        
        # Add timing
        result['processing_time'] = round(time.time() - start_time, 3)
        
        logger.info(f"Privacy detection completed in {result['processing_time']}s")
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Detection failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api.route('/detect/comprehensive', methods=['POST'])
def comprehensive_detection():
    """
    Comprehensive infrastructure detection based on category
    """
    start_time = time.time()
    
    try:
        # Validate image
        file = request.files.get('image')
        is_valid, error, image = validate_image(file)
        
        if not is_valid:
            return jsonify({
                'success': False,
                'error': error
            }), 400
        
        # Get category
        category = request.form.get('category', 'road_pavement')
        
        # Run comprehensive detection
        result = detection_service.comprehensive_detection(image, category)
        
        # Add timing and metadata
        result['processing_time'] = round(time.time() - start_time, 3)
        result['success'] = True
        
        logger.info(f"Comprehensive detection ({category}) completed in {result['processing_time']}s")
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Comprehensive detection failed: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@api.route('/ping', methods=['GET'])
def ping():
    """Simple ping endpoint"""
    return jsonify({
        'message': 'pong',
        'timestamp': time.time()
    }), 200


@api.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large"""
    return jsonify({
        'success': False,
        'error': 'File too large'
    }), 413


@api.errorhandler(404)
def not_found(error):
    """Handle 404"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@api.errorhandler(500)
def internal_error(error):
    """Handle 500"""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500
