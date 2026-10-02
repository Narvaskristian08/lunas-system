"""Privacy-region detection for backend-owned image redaction.

The service returns only normalized regions. The Node backend applies the
actual blur and owns the persisted image, so the detector never writes a raw
or redacted upload to disk.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np
from PIL import Image

from ..utils.config import config
from ..utils.logger import logger


class PrivacyService:
    """Detect faces and license plates using bundled OpenCV cascades."""

    def __init__(self):
        privacy_config = config.config.get('privacy', {})
        self.face_cascade = self._load_cascade(
            privacy_config.get('face_cascade', 'haarcascade_frontalface_default.xml')
        )
        self.plate_cascade = self._load_cascade(
            privacy_config.get('plate_cascade', 'haarcascade_russian_plate_number.xml')
        )
        self.face_min_neighbors = int(privacy_config.get('face_min_neighbors', 5))
        self.plate_min_neighbors = int(privacy_config.get('plate_min_neighbors', 4))

    @staticmethod
    def _load_cascade(filename: str) -> Optional[cv2.CascadeClassifier]:
        candidates = [
            Path(filename),
            Path(cv2.data.haarcascades) / filename,
        ]
        for candidate in candidates:
            if not candidate.is_file():
                continue
            cascade = cv2.CascadeClassifier(str(candidate))
            if not cascade.empty():
                return cascade
        logger.error('Privacy cascade unavailable: %s', filename)
        return None

    @staticmethod
    def _normalized_box(
        x: int,
        y: int,
        width: int,
        height: int,
        image_width: int,
        image_height: int,
    ) -> Dict[str, float]:
        return {
            'x1': max(0.0, min(1.0, x / image_width)),
            'y1': max(0.0, min(1.0, y / image_height)),
            'x2': max(0.0, min(1.0, (x + width) / image_width)),
            'y2': max(0.0, min(1.0, (y + height) / image_height)),
        }

    @staticmethod
    def _dedupe_boxes(boxes: List[Tuple[int, int, int, int]]) -> List[Tuple[int, int, int, int]]:
        """Remove contained/near-duplicate cascade boxes deterministically."""
        result: List[Tuple[int, int, int, int]] = []
        for candidate in sorted(boxes, key=lambda item: item[2] * item[3], reverse=True):
            cx, cy, cw, ch = candidate
            overlaps = False
            for x, y, width, height in result:
                intersection_width = max(0, min(cx + cw, x + width) - max(cx, x))
                intersection_height = max(0, min(cy + ch, y + height) - max(cy, y))
                intersection = intersection_width * intersection_height
                candidate_area = max(1, cw * ch)
                if intersection / candidate_area >= 0.65:
                    overlaps = True
                    break
            if not overlaps:
                result.append(candidate)
        return result

    def detect(self, image: Image.Image) -> Dict[str, Any]:
        """Return privacy regions in normalized coordinates."""
        if self.face_cascade is None or self.plate_cascade is None:
            return {
                'success': False,
                'status': 'unavailable',
                'model_available': False,
                'model': 'opencv-haar-privacy-v1',
                'detections': [],
                'detected_regions': 0,
                'error': 'Face and license-plate privacy detectors are unavailable',
            }

        rgb = np.asarray(image.convert('RGB'))
        image_height, image_width = rgb.shape[:2]
        gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        gray = cv2.equalizeHist(gray)

        face_boxes = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=self.face_min_neighbors,
            minSize=(24, 24),
        )
        plate_boxes = self.plate_cascade.detectMultiScale(
            gray,
            scaleFactor=1.05,
            minNeighbors=self.plate_min_neighbors,
            minSize=(36, 12),
        )

        detections: List[Dict[str, Any]] = []
        for label, boxes in (
            ('face', self._dedupe_boxes(list(face_boxes))),
            ('license_plate', self._dedupe_boxes(list(plate_boxes))),
        ):
            for x, y, width, height in boxes:
                detections.append({
                    'label': label,
                    'bbox': self._normalized_box(
                        int(x), int(y), int(width), int(height), image_width, image_height
                    ),
                })

        return {
            'success': True,
            'status': 'completed',
            'model_available': True,
            'model': 'opencv-haar-privacy-v1',
            'detected': bool(detections),
            'detections': detections,
            'detected_regions': len(detections),
        }


privacy_service = PrivacyService()
