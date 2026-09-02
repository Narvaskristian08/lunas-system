#!/usr/bin/env python3
"""
LUNAS AI - Road Collapse Training Script
Train YOLOv8n on Road Collapse Dataset (100 epochs)

Dataset: Road Collapse Detection
Classes: bridge collapse, road collapse
Train images: 578
Valid images: 37
Test images: 36
"""

import os
import sys
from pathlib import Path
from ultralytics import YOLO
from datetime import datetime
from src.utils.logger import logger
from src.utils.config import config

def train_road_collapse():
    """Train YOLOv8n on road collapse dataset"""
    
    logger.info("="*80)
    logger.info("LUNAS AI - Road Collapse Model Training")
    logger.info("="*80)
    logger.info(f"Using device: {config.get_device()}")
    
    # Dataset configuration
    dataset_path = Path("datasets/road_collapse/data.yaml").absolute()
    
    if not dataset_path.exists():
        logger.error(f"Dataset not found: {dataset_path}")
        sys.exit(1)
    
    logger.info(f"Dataset: {dataset_path}")
    
    # Load base model
    base_model = "yolov8n.pt"
    logger.info(f"Loading base model: {base_model}")
    
    model = YOLO(base_model)
    
    # Training configuration (100 epochs)
    logger.info("Training configuration:")
    train_config = {
        'data': str(dataset_path),
        'epochs': 100,
        'batch': 8,  # Smaller batch for stability on M1
        'imgsz': 640,
        'device': config.get_device(),
        'name': 'road_collapse_yolov8n',
        'pretrained': True,
        'patience': 50,
        'save_period': 10,
        'cache': False,
        'workers': 4,
        'project': 'runs/train',
        'exist_ok': True,
        'optimizer': 'AdamW',
        'lr0': 0.001,
        'lrf': 0.01,
        'momentum': 0.937,
        'weight_decay': 0.0005,
        'warmup_epochs': 3.0,
        
        # Augmentation
        'hsv_h': 0.015,
        'hsv_s': 0.7,
        'hsv_v': 0.4,
        'degrees': 0.0,
        'translate': 0.1,
        'scale': 0.5,
        'shear': 0.0,
        'perspective': 0.0,
        'flipud': 0.0,
        'fliplr': 0.5,
        'mosaic': 1.0,
        'mixup': 0.0,
        'copy_paste': 0.0,
    }
    
    for key, value in train_config.items():
        logger.info(f"  {key}: {value}")
    
    logger.info("="*80)
    logger.info("Starting training...")
    logger.info("="*80)
    
    try:
        # Train the model
        results = model.train(**train_config)
        
        logger.info("="*80)
        logger.info("Training completed successfully!")
        logger.info("="*80)
        
        # Find the best model
        best_model_path = Path(f"runs/train/{train_config['name']}/weights/best.pt")
        
        if best_model_path.exists():
            # Copy to models directory
            output_path = Path("models/yolov8n-road-collapse-best.pt")
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            import shutil
            shutil.copy(best_model_path, output_path)
            logger.info(f"✅ Best model saved to: {output_path}")
        
        # Validation metrics
        logger.info("="*80)
        logger.info("Final Training Metrics:")
        logger.info("="*80)
        
        if hasattr(results, 'results_dict'):
            metrics = results.results_dict
            logger.info(f"  mAP@50: {metrics.get('metrics/mAP50(B)', 'N/A')}")
            logger.info(f"  mAP@50-95: {metrics.get('metrics/mAP50-95(B)', 'N/A')}")
            logger.info(f"  Precision: {metrics.get('metrics/precision(B)', 'N/A')}")
            logger.info(f"  Recall: {metrics.get('metrics/recall(B)', 'N/A')}")
        
        logger.info("="*80)
        logger.info("Training Summary:")
        logger.info(f"  Dataset: Road Collapse (578 train, 37 val)")
        logger.info(f"  Model: YOLOv8n")
        logger.info(f"  Epochs: 100")
        logger.info(f"  Device: {config.get_device()}")
        logger.info(f"  Output: {output_path}")
        logger.info("="*80)
        
        return True
        
    except Exception as e:
        logger.error(f"Training failed: {e}", exc_info=True)
        return False


if __name__ == '__main__':
    logger.info(f"Training started at: {datetime.now()}")
    success = train_road_collapse()
    logger.info(f"Training finished at: {datetime.now()}")
    
    if success:
        logger.info("✅ Training completed successfully!")
        sys.exit(0)
    else:
        logger.error("❌ Training failed!")
        sys.exit(1)
        