"""
Model Manager
Handles loading, caching, and management of YOLO models
"""

import torch
from pathlib import Path
from typing import Dict, Optional, Any
from ultralytics import YOLO
from ..utils.config import config
from ..utils.logger import logger


class ModelManager:
    """
    Manages YOLO model instances with caching and lazy loading
    """
    
    def __init__(self):
        self.models: Dict[str, YOLO] = {}
        self.device = config.get_device()
        logger.info(f"ModelManager initialized with device: {self.device}")
        
        # Pre-load critical models
        self._preload_models()
    
    def _preload_models(self):
        """Pre-load models that are frequently used"""
        logger.info("Pre-loading critical models...")
        
        # Pre-load road damage detection (most common)
        try:
            self.load_model('road_damage')
            logger.info("✅ Pre-loaded: road_damage model")
        except Exception as e:
            logger.warning(f"Could not pre-load road_damage model: {e}")
    
    def load_model(self, model_name: str, force_reload: bool = False) -> YOLO:
        """
        Load or retrieve a YOLO model
        
        Args:
            model_name: Name of the model from config
            force_reload: Force reload even if cached
            
        Returns:
            Loaded YOLO model instance
            
        Raises:
            ValueError: If model not found in config
            RuntimeError: If model loading fails
        """
        # Check cache
        if not force_reload and model_name in self.models:
            logger.debug(f"Using cached model: {model_name}")
            return self.models[model_name]
        
        # Get model configuration
        model_config = config.get_model_config(model_name)
        if not model_config:
            raise ValueError(f"Model '{model_name}' not found in configuration")
        
        model_path = model_config.get('path')
        if not model_path:
            raise ValueError(f"No path specified for model '{model_name}'")
        
        # Resolve path
        full_path = config.BASE_DIR / model_path
        
        try:
            logger.info(f"Loading model: {model_name} from {full_path}")
            
            # Missing category models are a manual-review state. Never ask
            # Ultralytics to download a similarly named model because that
            # would violate strict category routing and the no-install rule.
            if not full_path.is_file():
                logger.warning(f"Configured model file not found: {full_path}")
                raise FileNotFoundError(f"Configured model file not found: {full_path}")

            model_path_str = str(full_path)
            
            # Load model
            model = YOLO(model_path_str)
            
            # Move to device
            if self.device != 'cpu':
                model.to(self.device)
            
            # Apply half precision if enabled and on GPU
            if config.ENABLE_HALF_PRECISION and self.device in ['cuda', 'mps']:
                try:
                    model.half()
                    logger.info(f"Enabled FP16 precision for {model_name}")
                except Exception as e:
                    logger.warning(f"Could not enable FP16: {e}")
            
            # Cache the model
            self.models[model_name] = model
            logger.info(f"✅ Successfully loaded model: {model_name}")
            
            return model
            
        except Exception as e:
            logger.error(f"Failed to load model '{model_name}': {e}")
            raise RuntimeError(f"Model loading failed: {e}")
    
    def get_model(self, model_name: str) -> Optional[YOLO]:
        """
        Get a loaded model (returns None if not loaded)
        
        Args:
            model_name: Name of the model
            
        Returns:
            YOLO model or None
        """
        return self.models.get(model_name)
    
    def unload_model(self, model_name: str):
        """
        Unload a model from memory
        
        Args:
            model_name: Name of the model to unload
        """
        if model_name in self.models:
            del self.models[model_name]
            logger.info(f"Unloaded model: {model_name}")
            
            # Clear CUDA cache if using GPU
            if self.device == 'cuda':
                torch.cuda.empty_cache()
    
    def unload_all(self):
        """Unload all models from memory"""
        for model_name in list(self.models.keys()):
            self.unload_model(model_name)
        
        logger.info("All models unloaded")
    
    def get_loaded_models(self) -> list:
        """Get list of currently loaded models"""
        return list(self.models.keys())
    
    def get_model_info(self, model_name: str) -> Dict[str, Any]:
        """
        Get information about a model
        
        Args:
            model_name: Name of the model
            
        Returns:
            Dictionary with model information
        """
        model_config = config.get_model_config(model_name)
        
        info = {
            'name': model_name,
            'display_name': model_config.get('name', model_name),
            'type': model_config.get('type', 'unknown'),
            'classes': model_config.get('classes', []),
            'damage_only': bool(model_config.get('damage_only', False)),
            'loaded': model_name in self.models,
            'device': self.device,
            'confidence_threshold': model_config.get('confidence_threshold', 0.25),
            'input_size': model_config.get('input_size', 640)
        }
        
        return info
    
    def get_all_models_info(self) -> Dict[str, Dict[str, Any]]:
        """Get information about all configured models"""
        all_models = config.config.get('models', {})
        return {
            name: self.get_model_info(name)
            for name in all_models.keys()
        }
    
    def __repr__(self):
        loaded = len(self.models)
        return f"<ModelManager device={self.device} loaded={loaded}>"


# Global model manager instance
model_manager = ModelManager()
