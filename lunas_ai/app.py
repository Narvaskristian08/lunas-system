"""
LUNAS AI Service
Main Flask Application

AI/ML Microservice for Infrastructure Damage Detection
Supports YOLOv8 and YOLOv11 models
"""

from flask import Flask, jsonify
from flask_cors import CORS
from src.api import api
from src.utils.config import config
from src.utils.logger import logger


def create_app():
    """Application factory"""
    
    # Create Flask app
    app = Flask(__name__)
    
    # Configuration
    app.config['MAX_CONTENT_LENGTH'] = config.MAX_REQUEST_SIZE
    app.config['JSON_SORT_KEYS'] = False
    
    # CORS - Allow all origins for local QA testing
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Type"],
            "supports_credentials": False
        }
    })
    
    # Register blueprints
    app.register_blueprint(api, url_prefix='/api/v1')
    
    # Root endpoint
    @app.route('/')
    def index():
        return jsonify({
            'service': 'LUNAS AI Service',
            'version': '1.0.0',
            'status': 'running',
            'description': 'AI/ML microservice for infrastructure damage detection',
            'endpoints': {
                'health': '/api/v1/health',
                'models': '/api/v1/models',
                'detect_road_damage': '/api/v1/detect/road-damage',
                'detect_cracks': '/api/v1/detect/cracks',
                'detect_privacy': '/api/v1/detect/privacy',
                'detect_all_hazards': '/api/v1/detect/all-hazards',
                'comprehensive': '/api/v1/detect/comprehensive'
            },
            'documentation': 'See README.md for API documentation'
        })
    
    # Serve QA GUI
    @app.route('/qa')
    def qa_gui():
        """Serve the QA testing GUI"""
        from flask import send_file
        import os
        gui_path = os.path.join(os.path.dirname(__file__), 'qa_test_gui.html')
        return send_file(gui_path)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested endpoint does not exist'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(e):
        logger.error(f"Internal error: {e}")
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred'
        }), 500
    
    return app


def main():
    """Main entry point"""
    
    logger.info("="*60)
    logger.info("LUNAS AI Service Starting...")
    logger.info("="*60)
    logger.info(f"Environment: {config.FLASK_ENV}")
    logger.info(f"Device: {config.get_device()}")
    logger.info(f"Host: {config.FLASK_HOST}:{config.FLASK_PORT}")
    logger.info("="*60)
    
    # Create app
    app = create_app()
    
    # Run server
    app.run(
        host=config.FLASK_HOST,
        port=config.FLASK_PORT,
        debug=config.DEBUG,
        threaded=True
    )


if __name__ == '__main__':
    main()
