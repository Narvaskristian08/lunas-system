#!/usr/bin/env python3
"""
LUNAS AI - Reduced Training Script for 8GB RAM
Train YOLOv8n on a smaller subset of RDD2022 dataset
"""

import os
import sys
import logging
from pathlib import Path
from ultralytics import YOLO
import yaml
import argparse

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('train_small.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('lunas_ai_small')

def main():
    parser = argparse.ArgumentParser(description='Train YOLO model on reduced RDD2022 dataset')
    parser.add_argument('--model', type=str, default='yolov8n', help='Model size (yolov8n, yolov8s, etc.)')
    parser.add_argument('--epochs', type=int, default=50, help='Number of epochs')
    parser.add_argument('--batch', type=int, default=4, help='Batch size')
    parser.add_argument('--device', type=str, default='cpu', help='Device (cpu, mps, cuda)')
    parser.add_argument('--fraction', type=float, default=0.25, help='Fraction of dataset to use, e.g. 0.25 for 25 percent')
    args = parser.parse_args()
    
    logger.info("=" * 80)
    logger.info("LUNAS AI - Reduced Dataset Training for 8GB RAM")
    logger.info("=" * 80)
    logger.info(f"Using {args.fraction*100}% of dataset (~{int(38385*args.fraction)} images)")
    logger.info(f"Device: {args.device}")
    
    # Dataset path
    data_yaml = Path(__file__).parent / 'datasets' / 'rdd2022' / 'data.yaml'
    
    if not data_yaml.exists():
        logger.error(f"Dataset not found: {data_yaml}")
        sys.exit(1)
    
    # Load base model
    logger.info(f"Loading base model: {args.model}.pt")
    model = YOLO(f"{args.model}.pt")
    
    # Training configuration optimized for 8GB RAM
    train_args = {
        'data': str(data_yaml),
        'epochs': args.epochs,
        'batch': args.batch,
        'imgsz': 640,
        'device': args.device,
        'name': f'rdd2022_{args.model}_small',
        'pretrained': True,
        'patience': 50,
        'save_period': 10,
        'cache': False,  # Don't cache images (saves RAM)
        'workers': 2,    # Reduced workers
        'project': 'runs/train',
        'exist_ok': True,
        'optimizer': 'AdamW',
        'lr0': 0.001,
        'lrf': 0.01,
        'momentum': 0.937,
        'weight_decay': 0.0005,
        'warmup_epochs': 3.0,
        'fraction': args.fraction,  # Use only a fraction of dataset
        # Data augmentation
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
    
    logger.info("Training configuration:")
    for key, value in train_args.items():
        logger.info(f"  {key}: {value}")
    
    logger.info("=" * 80)
    logger.info("Starting training...")
    logger.info("=" * 80)
    
    try:
        # Train the model
        results = model.train(**train_args)
        
        logger.info("=" * 80)
        logger.info("Training completed successfully!")
        logger.info("=" * 80)
        logger.info(f"Best weights: runs/train/rdd2022_{args.model}_small/weights/best.pt")
        
    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)

if __name__ == '__main__':
    main()
