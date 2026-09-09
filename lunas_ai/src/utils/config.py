"""
Configuration Manager
Handles loading and validation of configuration from YAML and .env
"""

import os
import yaml
from pathlib import Path
from typing import Dict, Any
from dotenv import load_dotenv


class Config:
    """Configuration manager for LUNAS AI service"""
    
    def __init__(self, config_path: str = "config.yaml"):
        # Load environment variables
        load_dotenv()
        
        # Set base paths
        self.BASE_DIR = Path(__file__).parent.parent.parent
        self.CONFIG_PATH = self.BASE_DIR / config_path
        
        # Load YAML configuration
        self.config = self._load_yaml_config()
        
        # Override with environment variables
        self._load_env_overrides()
    
    def _load_yaml_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        try:
            with open(self.CONFIG_PATH, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            print(f"Warning: Config file {self.CONFIG_PATH} not found. Using defaults.")
            return {}
        except yaml.YAMLError as e:
            print(f"Error parsing YAML config: {e}")
            return {}
    
    def _load_env_overrides(self):
        """Override config with environment variables"""
        # Service config
        self.FLASK_ENV = os.getenv('FLASK_ENV', 'production')
        self.FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
        self.FLASK_PORT = int(os.getenv('FLASK_PORT', 5001))
        self.DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
        
        # Detection thresholds
        self.CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', 0.25))
        self.IOU_THRESHOLD = float(os.getenv('IOU_THRESHOLD', 0.45))
        self.MAX_DETECTIONS = int(os.getenv('MAX_DETECTIONS', 50))
        
        # Paths
        self.MODEL_CACHE_DIR = self.BASE_DIR / os.getenv('MODEL_CACHE_DIR', 'models/cache')
        self.INFERENCE_CACHE_DIR = self.BASE_DIR / os.getenv('INFERENCE_CACHE_DIR', 'cache/inference')
        self.LOG_FILE = self.BASE_DIR / os.getenv('LOG_FILE', 'logs/lunas_ai.log')
        self.DATASET_PATH = self.BASE_DIR / os.getenv('DATASET_PATH', 'datasets/rdd2022')
        
        # Device configuration
        self.DEVICE = os.getenv('DEVICE', 'cpu')
        self.ENABLE_HALF_PRECISION = os.getenv('ENABLE_HALF_PRECISION', 'False').lower() == 'true'
        
        # Image processing
        self.MAX_IMAGE_SIZE = int(os.getenv('MAX_IMAGE_SIZE', 1920))
        self.IMAGE_QUALITY = int(os.getenv('IMAGE_QUALITY', 85))
        
        # Security
        self.MAX_REQUEST_SIZE = int(os.getenv('MAX_REQUEST_SIZE', 10485760))
        # Allow all origins for local QA testing (file://, localhost, etc.)
        self.ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*').split(',')
        self.API_KEY = os.getenv('API_KEY', None)
        
        # Logging
        self.LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
        
        # Create necessary directories
        self._create_directories()
    
    def _create_directories(self):
        """Create necessary directories if they don't exist"""
        directories = [
            self.MODEL_CACHE_DIR,
            self.INFERENCE_CACHE_DIR,
            self.LOG_FILE.parent,
            self.DATASET_PATH
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
    
    def get_model_config(self, model_name: str) -> Dict[str, Any]:
        """Get configuration for a specific model"""
        return self.config.get('models', {}).get(model_name, {})
    
    def get_category_config(self, category_name: str) -> Dict[str, Any]:
        """Get configuration for a specific category"""
        return self.config.get('categories', {}).get(category_name, {})

    def get_category_model(self, category_name: str):
        """Return the explicitly assigned model for a canonical category."""
        category = str(category_name or '').strip().lower()
        return self.config.get('category_models', {}).get(category)
    
    def get_device(self) -> str:
        """Auto-detect best available device"""
        if self.DEVICE != 'cpu':
            return self.DEVICE
        
        # Auto-detection
        try:
            import torch
            if torch.cuda.is_available():
                return 'cuda'
            elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                return 'mps'  # Apple M1/M2
        except ImportError:
            pass
        
        return 'cpu'
    
    def __repr__(self):
        return f"<Config env={self.FLASK_ENV} device={self.get_device()}>"


# Global config instance
config = Config()
