"""
LUNAS AI - Training Script
Fine-tune YOLO models on RDD2022 dataset

Usage:
    python train.py --model yolov8n --dataset rdd2022 --epochs 100
"""

import argparse
from pathlib import Path
from ultralytics import YOLO
from src.utils.config import config
from src.utils.logger import logger


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Train YOLO model on infrastructure damage dataset')
    
    parser.add_argument(
        '--model',
        type=str,
        default='yolov8s',
        choices=['yolov8n', 'yolov8s', 'yolov8m', 'yolov8l', 'yolov8x'],
        help='Base model to use (recommended: yolov8s for RDD2022)'
    )
    
    parser.add_argument(
        '--dataset',
        type=str,
        default='rdd2022',
        help='Dataset name (should have data.yaml in datasets/{name}/)'
    )
    
    parser.add_argument(
        '--epochs',
        type=int,
        default=100,
        help='Number of training epochs'
    )
    
    parser.add_argument(
        '--batch',
        type=int,
        default=16,
        help='Batch size'
    )
    
    parser.add_argument(
        '--imgsz',
        type=int,
        default=640,
        help='Image size'
    )
    
    parser.add_argument(
        '--device',
        type=str,
        default=None,
        help='Device to use (cpu, cuda, mps). Auto-detect if not specified'
    )
    
    parser.add_argument(
        '--name',
        type=str,
        default=None,
        help='Experiment name'
    )
    
    parser.add_argument(
        '--resume',
        type=str,
        default=None,
        help='Resume training from checkpoint'
    )
    
    parser.add_argument(
        '--pretrained',
        action='store_true',
        default=True,
        help='Use pretrained weights'
    )
    
    return parser.parse_args()


def train(args):
    """
    Train YOLO model on dataset
    
    Args:
        args: Command line arguments
    """
    logger.info("="*80)
    logger.info("LUNAS AI - Model Training")
    logger.info("="*80)
    
    # Determine device
    device = args.device or config.get_device()
    logger.info(f"Using device: {device}")
    
    # Dataset path
    dataset_path = config.DATASET_PATH / args.dataset / 'data.yaml'
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset configuration not found: {dataset_path}")
    
    logger.info(f"Dataset: {dataset_path}")
    
    # Load model
    if args.resume:
        logger.info(f"Resuming from checkpoint: {args.resume}")
        model = YOLO(args.resume)
    else:
        model_name = f"{args.model}.pt"
        logger.info(f"Loading base model: {model_name}")
        model = YOLO(model_name)
    
    # Training configuration
    train_config = {
        'data': str(dataset_path),
        'epochs': args.epochs,
        'batch': args.batch,
        'imgsz': args.imgsz,
        'device': device,
        'name': args.name or f"{args.dataset}_{args.model}",
        'pretrained': args.pretrained,
        'patience': 50,
        'save_period': 10,
        'cache': False,  # Set to True if you have enough RAM
        'workers': 4,
        'project': 'runs/train',
        'exist_ok': True,
        
        # Optimizer
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
        'copy_paste': 0.0
    }
    
    logger.info("Training configuration:")
    for key, value in train_config.items():
        logger.info(f"  {key}: {value}")
    
    # Start training
    logger.info("="*80)
    logger.info("Starting training...")
    logger.info("="*80)
    
    try:
        results = model.train(**train_config)
        
        logger.info("="*80)
        logger.info("Training completed!")
        logger.info("="*80)
        
        # Save best model
        best_model_path = Path(results.save_dir) / 'weights' / 'best.pt'
        output_path = config.BASE_DIR / 'models' / f"{args.model}-{args.dataset}-best.pt"
        
        if best_model_path.exists():
            import shutil
            shutil.copy(best_model_path, output_path)
            logger.info(f"✅ Best model saved to: {output_path}")
        
        # Validation metrics
        logger.info("\nFinal Metrics:")
        logger.info(f"  mAP@0.5: {results.results_dict.get('metrics/mAP50(B)', 'N/A')}")
        logger.info(f"  mAP@0.5:0.95: {results.results_dict.get('metrics/mAP50-95(B)', 'N/A')}")
        logger.info(f"  Precision: {results.results_dict.get('metrics/precision(B)', 'N/A')}")
        logger.info(f"  Recall: {results.results_dict.get('metrics/recall(B)', 'N/A')}")
        
        return True
        
    except Exception as e:
        logger.error(f"Training failed: {e}")
        raise


def validate(args):
    """
    Validate trained model
    
    Args:
        args: Command line arguments
    """
    logger.info("="*80)
    logger.info("Model Validation")
    logger.info("="*80)
    
    model_path = config.BASE_DIR / 'models' / f"{args.model}-{args.dataset}-best.pt"
    
    if not model_path.exists():
        raise FileNotFoundError(f"Trained model not found: {model_path}")
    
    logger.info(f"Loading model: {model_path}")
    model = YOLO(str(model_path))
    
    dataset_path = config.DATASET_PATH / args.dataset / 'data.yaml'
    logger.info(f"Validating on dataset: {dataset_path}")
    
    # Run validation
    metrics = model.val(data=str(dataset_path))
    
    logger.info("\nValidation Results:")
    logger.info(f"  mAP@0.5: {metrics.box.map50:.3f}")
    logger.info(f"  mAP@0.5:0.95: {metrics.box.map:.3f}")
    logger.info(f"  Precision: {metrics.box.mp:.3f}")
    logger.info(f"  Recall: {metrics.box.mr:.3f}")
    
    return metrics


def main():
    """Main entry point"""
    args = parse_args()
    
    try:
        # Train model
        train(args)
        
        # Validate model
        logger.info("\n" + "="*80)
        validate(args)
        
        logger.info("\n" + "="*80)
        logger.info("✅ Training and validation completed successfully!")
        logger.info("="*80)
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        raise


if __name__ == '__main__':
    main()
