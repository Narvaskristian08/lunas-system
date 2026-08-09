"""
Detection Service
Core infrastructure damage detection logic
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from PIL import Image
from ..models.model_manager import model_manager
from ..utils.config import config
from ..utils.logger import logger


class DetectionService:
    """
    Handles infrastructure damage detection using YOLO models
    """
    
    def __init__(self):
        self.model_manager = model_manager
    
    def detect_road_damage(
        self,
        image: Image.Image,
        confidence: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Detect road damage (potholes, cracks, manholes, sewer covers)
        
        Args:
            image: PIL Image object
            confidence: Confidence threshold (optional)
            
        Returns:
            Dictionary with detection results
        """
        try:
            # Load model
            model = self.model_manager.load_model('road_damage')
            
            # Get model config
            model_config = config.get_model_config('road_damage')
            conf_threshold = confidence or model_config.get('confidence_threshold', 0.25)
            iou_threshold = model_config.get('iou_threshold', 0.45)
            
            # Run inference
            logger.info("Running road damage detection...")
            results = model.predict(
                source=image,
                conf=conf_threshold,
                iou=iou_threshold,
                max_det=config.MAX_DETECTIONS,
                device=self.model_manager.device,
                verbose=False
            )
            
            # Parse results
            detections = self._parse_detection_results(results[0], model_config)
            
            # Calculate severity
            detections = self._estimate_severity(detections, image)
            
            return {
                'success': True,
                'model': 'road_damage',
                'detections': detections,
                'summary': self._create_summary(detections),
                'total_detections': len(detections)
            }
            
        except Exception as e:
            logger.error(f"Road damage detection failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'detections': [],
                'total_detections': 0
            }
    
    def detect_cracks(
        self,
        image: Image.Image,
        confidence: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Detect and segment cracks in pavement
        
        Args:
            image: PIL Image object
            confidence: Confidence threshold (optional)
            
        Returns:
            Dictionary with segmentation results
        """
        try:
            # Load segmentation model
            model = self.model_manager.load_model('crack_segmentation')
            
            # Get model config
            model_config = config.get_model_config('crack_segmentation')
            conf_threshold = confidence or model_config.get('confidence_threshold', 0.30)
            
            # Run inference
            logger.info("Running crack segmentation...")
            results = model.predict(
                source=image,
                conf=conf_threshold,
                device=self.model_manager.device,
                verbose=False
            )
            
            # Parse segmentation results
            detections = self._parse_segmentation_results(results[0], model_config)
            
            return {
                'success': True,
                'model': 'crack_segmentation',
                'detections': detections,
                'summary': f"Found {len(detections)} crack(s)",
                'total_detections': len(detections)
            }
            
        except Exception as e:
            logger.error(f"Crack detection failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'detections': [],
                'total_detections': 0
            }
    
    def detect_privacy_concerns(
        self,
        image: Image.Image,
        confidence: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Detect privacy-sensitive objects (people, vehicles)
        
        Args:
            image: PIL Image object
            confidence: Confidence threshold (optional)
            
        Returns:
            Dictionary with privacy detections
        """
        try:
            # Load privacy model
            model = self.model_manager.load_model('privacy_detection')
            
            # Get model config
            model_config = config.get_model_config('privacy_detection')
            conf_threshold = confidence or model_config.get('confidence_threshold', 0.40)
            
            # Run inference
            logger.info("Running privacy detection...")
            results = model.predict(
                source=image,
                conf=conf_threshold,
                device=self.model_manager.device,
                verbose=False
            )
            
            # Parse results
            detections = self._parse_detection_results(results[0], model_config)
            
            # Filter to privacy-relevant classes
            privacy_classes = ['person', 'car', 'truck', 'bus', 'motorcycle']
            privacy_detections = [
                d for d in detections 
                if d['class'] in privacy_classes
            ]
            
            return {
                'success': True,
                'has_privacy_concerns': len(privacy_detections) > 0,
                'detections': privacy_detections,
                'summary': f"Found {len(privacy_detections)} privacy-sensitive object(s)",
                'total_detections': len(privacy_detections)
            }
            
        except Exception as e:
            logger.error(f"Privacy detection failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'has_privacy_concerns': False,
                'detections': [],
                'total_detections': 0
            }
    
    def comprehensive_detection(
        self,
        image: Image.Image,
        category: str = 'road_pavement'
    ) -> Dict[str, Any]:
        """
        Run comprehensive detection based on category
        
        Args:
            image: PIL Image object
            category: Infrastructure category
            
        Returns:
            Combined detection results
        """
        logger.info(f"Running comprehensive detection for category: {category}")
        
        results = {
            'category': category,
            'road_damage': None,
            'cracks': None,
            'privacy': None,
            'ai_suggestion': None,
            'confidence_score': 0.0,
            'requires_manual_review': True
        }
        
        # Category-specific detection
        if category in ['road_pavement', 'Road/Pavement', 'ROAD']:
            results['road_damage'] = self.detect_road_damage(image)
            results['cracks'] = self.detect_cracks(image)
            
            # AI suggestion
            results['ai_suggestion'] = self._suggest_subcategory(
                results['road_damage'],
                results['cracks']
            )
            
            # Calculate overall confidence
            results['confidence_score'] = self._calculate_confidence(
                results['road_damage'],
                results['cracks']
            )
            
        elif category in ['drainage_sewage', 'Drainage/Sewage', 'DRAIN']:
            results['road_damage'] = self.detect_road_damage(image)
            # Filter to manholes and sewer covers only
            if results['road_damage']['success']:
                detections = results['road_damage']['detections']
                filtered = [
                    d for d in detections 
                    if d['class'] in ['manhole', 'sewer_cover']
                ]
                results['road_damage']['detections'] = filtered
                results['road_damage']['total_detections'] = len(filtered)
            
            results['confidence_score'] = self._calculate_confidence(results['road_damage'])
        
        # Always check privacy
        results['privacy'] = self.detect_privacy_concerns(image)
        
        # Determine if manual review needed
        results['requires_manual_review'] = results['confidence_score'] < 0.7
        
        return results
    
    def _parse_detection_results(
        self,
        result,
        model_config: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Parse YOLO detection results"""
        detections = []
        
        if result.boxes is None or len(result.boxes) == 0:
            return detections
        
        boxes = result.boxes
        class_names = model_config.get('classes', [])
        
        for i in range(len(boxes)):
            box = boxes[i]
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            bbox = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
            
            # Get class name
            if class_id < len(class_names):
                class_name = class_names[class_id]
            else:
                class_name = result.names.get(class_id, f"class_{class_id}")
            
            detections.append({
                'class': class_name,
                'class_id': class_id,
                'confidence': round(confidence, 3),
                'bbox': {
                    'x1': round(bbox[0], 2),
                    'y1': round(bbox[1], 2),
                    'x2': round(bbox[2], 2),
                    'y2': round(bbox[3], 2),
                    'width': round(bbox[2] - bbox[0], 2),
                    'height': round(bbox[3] - bbox[1], 2)
                },
                'area': round((bbox[2] - bbox[0]) * (bbox[3] - bbox[1]), 2)
            })
        
        return detections
    
    def _parse_segmentation_results(
        self,
        result,
        model_config: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Parse YOLO segmentation results"""
        detections = []
        
        if result.masks is None or len(result.masks) == 0:
            return detections
        
        boxes = result.boxes
        masks = result.masks
        class_names = model_config.get('classes', [])
        
        for i in range(len(boxes)):
            box = boxes[i]
            mask = masks[i]
            
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            bbox = box.xyxy[0].tolist()
            
            # Get class name
            if class_id < len(class_names):
                class_name = class_names[class_id]
            else:
                class_name = result.names.get(class_id, f"class_{class_id}")
            
            # Get mask polygon (if available)
            mask_polygon = None
            if hasattr(mask, 'xy') and len(mask.xy) > 0:
                mask_polygon = mask.xy[0].tolist()  # First contour
            
            detections.append({
                'class': class_name,
                'class_id': class_id,
                'confidence': round(confidence, 3),
                'bbox': {
                    'x1': round(bbox[0], 2),
                    'y1': round(bbox[1], 2),
                    'x2': round(bbox[2], 2),
                    'y2': round(bbox[3], 2)
                },
                'mask_polygon': mask_polygon,
                'mask_available': mask_polygon is not None
            })
        
        return detections
    
    def _estimate_severity(
        self,
        detections: List[Dict[str, Any]],
        image: Image.Image
    ) -> List[Dict[str, Any]]:
        """Estimate severity based on size"""
        image_area = image.width * image.height
        severity_config = config.config.get('severity_estimation', {})
        
        for detection in detections:
            class_name = detection['class']
            area = detection.get('area', 0)
            area_percentage = (area / image_area) * 100
            
            # Get thresholds for this class
            thresholds = severity_config.get(class_name, {
                'minor': 5,
                'moderate': 10,
                'severe': 15
            })
            
            # Determine severity
            if area_percentage > thresholds.get('severe', 15):
                severity = 'severe'
            elif area_percentage > thresholds.get('moderate', 10):
                severity = 'moderate'
            else:
                severity = 'minor'
            
            detection['severity'] = severity
            detection['area_percentage'] = round(area_percentage, 2)
        
        return detections
    
    def _create_summary(self, detections: List[Dict[str, Any]]) -> str:
        """Create human-readable summary"""
        if not detections:
            return "No damage detected"
        
        # Count by class
        class_counts = {}
        for d in detections:
            class_name = d['class']
            class_counts[class_name] = class_counts.get(class_name, 0) + 1
        
        # Build summary
        parts = [f"{count} {name}(s)" for name, count in class_counts.items()]
        return f"Detected: {', '.join(parts)}"
    
    def _suggest_subcategory(
        self,
        road_damage: Dict[str, Any],
        cracks: Dict[str, Any]
    ) -> Optional[str]:
        """Suggest specific subcategory based on detections"""
        suggestions = []
        
        if road_damage and road_damage['success']:
            for det in road_damage['detections']:
                if det['class'] == 'pothole':
                    suggestions.append('Road/Pavement - Pothole')
                elif 'crack' in det['class']:
                    suggestions.append('Road/Pavement - Crack')
        
        if cracks and cracks['success'] and cracks['total_detections'] > 0:
            suggestions.append('Road/Pavement - Crack')
        
        return suggestions[0] if suggestions else None
    
    def _calculate_confidence(self, *results) -> float:
        """Calculate overall confidence score"""
        confidences = []
        
        for result in results:
            if result and result.get('success') and result.get('detections'):
                for det in result['detections']:
                    confidences.append(det['confidence'])
        
        if not confidences:
            return 0.0
        
        # Return average confidence
        return round(sum(confidences) / len(confidences), 3)


# Global detection service instance
detection_service = DetectionService()
