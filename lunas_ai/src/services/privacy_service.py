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

try:
    from ultralytics import YOLO
except ImportError:  # pragma: no cover - runtime image includes ultralytics
    YOLO = None


class PrivacyService:
    """Detect faces and license plates using bundled privacy models.

    YuNet is used for faces because the previous Haar cascade produced false
    positives on traffic scenes. A dedicated YOLO model is used for plates.
    """

    def __init__(self):
        privacy_config = config.config.get('privacy', {})
        self.face_model_confidence = float(privacy_config.get('face_model_confidence', 0.75))
        self.face_nms_threshold = float(privacy_config.get('face_nms_threshold', 0.3))
        self.face_model = self._load_face_model(
            privacy_config.get('face_model_path'),
            self.face_model_confidence,
            self.face_nms_threshold,
        )
        self.face_cascade = self._load_cascade(
            privacy_config.get('face_cascade', 'haarcascade_frontalface_default.xml')
        )
        self.plate_cascade = self._load_cascade(
            privacy_config.get('plate_cascade', 'haarcascade_russian_plate_number.xml')
        )
        self.plate_model = self._load_plate_model(privacy_config.get('plate_model_path'))
        self.plate_model_confidence = float(privacy_config.get('plate_model_confidence', 0.45))
        self.plate_tile_size = int(privacy_config.get('plate_tile_size', 640))
        self.plate_tile_overlap = float(privacy_config.get('plate_tile_overlap', 0.2))
        self.face_min_neighbors = int(privacy_config.get('face_min_neighbors', 5))
        self.plate_min_neighbors = int(privacy_config.get('plate_min_neighbors', 4))
        self.face_scales = tuple(float(value) for value in privacy_config.get('face_upscale_factors', [1.0, 1.5, 2.0]))
        self.face_tile_size = int(privacy_config.get('face_tile_size', 960))
        self.face_tile_overlap = float(privacy_config.get('face_tile_overlap', 0.35))
        self.face_tile_scales = tuple(
            float(value) for value in privacy_config.get('face_tile_upscale_factors', [1.5, 2.0])
        )
        self.plate_scales = tuple(float(value) for value in privacy_config.get('plate_upscale_factors', [1.0, 1.5, 2.0]))
        self.max_detection_dimension = int(privacy_config.get('max_detection_dimension', 1600))

    @staticmethod
    def _load_face_model(path: Optional[str], confidence: float, nms_threshold: float):
        """Load the explicit YuNet face detector when OpenCV supports it."""
        if not path:
            return None
        model_path = Path(path)
        if not model_path.is_file():
            logger.warning('YuNet face model unavailable: %s', path)
            return None
        try:
            if hasattr(cv2, 'FaceDetectorYN_create'):
                return cv2.FaceDetectorYN_create(
                    str(model_path), '', (320, 320), confidence, nms_threshold, 5000
                )
            if hasattr(cv2, 'FaceDetectorYN'):
                return cv2.FaceDetectorYN.create(
                    str(model_path), '', (320, 320), confidence, nms_threshold, 5000
                )
        except Exception as error:
            logger.error('YuNet face model failed to load: %s', error)
            return None
        logger.error('This OpenCV build does not provide FaceDetectorYN')
        return None

    @staticmethod
    def _load_plate_model(path: Optional[str]):
        """Load only an explicitly supplied, approved plate model weight."""
        if not path or YOLO is None:
            return None
        model_path = Path(path)
        if not model_path.is_file():
            logger.warning('Dedicated plate model unavailable: %s', path)
            return None
        try:
            return YOLO(str(model_path))
        except Exception as error:
            logger.error('Dedicated plate model failed to load: %s', error)
            return None

    @staticmethod
    def _load_cascade(filename: Optional[str]) -> Optional[cv2.CascadeClassifier]:
        if not filename:
            return None
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

    @staticmethod
    def _plate_geometry(box: Tuple[int, int, int, int]) -> bool:
        """Reject cascade hits that cannot be a rectangular license plate."""
        x, y, width, height = box
        if x < 0 or y < 0 or width <= 0 or height <= 0:
            return False
        if width < 24 or height < 8:
            return False
        aspect_ratio = width / max(1, height)
        return 1.2 <= aspect_ratio <= 8.0

    @staticmethod
    def _clip_plate_box(
        box: Tuple[int, int, int, int],
        image_width: int,
        image_height: int,
    ) -> Optional[Tuple[int, int, int, int]]:
        """Clip a tile detection and reject boxes with no visible area.

        Tiled inference can return a box that extends beyond the source image.
        Letting that box reach normalized coordinates produces zero-area boxes
        at x/y == 1.0 and makes the privacy count misleading. A clipped box is
        kept only when a real, geometrically plausible region remains.
        """
        x, y, width, height = box
        left = max(0, min(image_width, int(x)))
        top = max(0, min(image_height, int(y)))
        right = max(left, min(image_width, int(x + width)))
        bottom = max(top, min(image_height, int(y + height)))
        clipped = (left, top, right - left, bottom - top)
        return clipped if PrivacyService._plate_geometry(clipped) else None

    @staticmethod
    def _detect_scaled(
        cascade: cv2.CascadeClassifier,
        gray: np.ndarray,
        scales: Tuple[float, ...],
        scale_factor: float,
        min_neighbors: int,
        min_size: Tuple[int, int],
    ) -> List[Tuple[int, int, int, int]]:
        """Detect on upscaled copies so small distant regions remain visible."""
        detections: List[Tuple[int, int, int, int]] = []
        for upscale in scales:
            if upscale <= 0:
                continue
            scaled = gray if upscale == 1.0 else cv2.resize(
                gray, None, fx=upscale, fy=upscale, interpolation=cv2.INTER_CUBIC
            )
            boxes = cascade.detectMultiScale(
                scaled,
                scaleFactor=scale_factor,
                minNeighbors=min_neighbors,
                minSize=(max(8, int(min_size[0] * upscale)), max(8, int(min_size[1] * upscale))),
            )
            for x, y, width, height in boxes:
                detections.append((
                    int(round(x / upscale)),
                    int(round(y / upscale)),
                    int(round(width / upscale)),
                    int(round(height / upscale)),
                ))
        return detections

    def _detect_faces(
        self,
        rgb: np.ndarray,
        image_width: int,
        image_height: int,
        detection_scale: float,
    ) -> List[Tuple[int, int, int, int]]:
        """Detect faces with YuNet, including tiled passes for small faces."""
        if self.face_model is None:
            return []
        # OpenCV's FaceDetectorYN expects an OpenCV/BGR image. The public
        # service keeps the decoded image in RGB for PIL/YOLO, so convert only
        # this detector input to avoid coordinate/color mismatches.
        boxes: List[Tuple[int, int, int, int]] = []

        def detect_pass(
            detection_image: np.ndarray,
            offset_x: int = 0,
            offset_y: int = 0,
            image_scale: float = 1.0,
        ) -> None:
            detection_height, detection_width = detection_image.shape[:2]
            if detection_width < 8 or detection_height < 8:
                return
            self.face_model.setInputSize((detection_width, detection_height))
            _, faces = self.face_model.detect(detection_image)
            if faces is None:
                return
            for face in faces:
                confidence = float(face[14])
                if confidence < self.face_model_confidence:
                    continue
                x, y, width, height = [int(round(value)) for value in face[:4]]
                x = int(round(offset_x + x / image_scale))
                y = int(round(offset_y + y / image_scale))
                width = int(round(width / image_scale))
                height = int(round(height / image_scale))
                x = max(0, min(image_width - 1, x))
                y = max(0, min(image_height - 1, y))
                width = min(width, image_width - x)
                height = min(height, image_height - y)
                if width >= 8 and height >= 8:
                    boxes.append((x, y, width, height))

        source_image = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        full_image = source_image
        if detection_scale < 1.0:
            full_image = cv2.resize(
                source_image, None, fx=detection_scale, fy=detection_scale,
                interpolation=cv2.INTER_AREA
            )
        detect_pass(full_image, image_scale=detection_scale)

        # A full-frame detector has too few pixels for distant faces. Run
        # overlapping crops at a larger scale so small faces are represented
        # by enough pixels for YuNet. Extra privacy blur is safer than leaving
        # a face exposed, so this pass intentionally favors recall.
        tile_size = max(640, self.face_tile_size)
        overlap = max(0.0, min(0.8, self.face_tile_overlap))
        stride = max(320, int(tile_size * (1.0 - overlap)))
        x_positions = list(range(0, max(1, image_width - tile_size + 1), stride))
        y_positions = list(range(0, max(1, image_height - tile_size + 1), stride))
        if not x_positions or x_positions[-1] != max(0, image_width - tile_size):
            x_positions.append(max(0, image_width - tile_size))
        if not y_positions or y_positions[-1] != max(0, image_height - tile_size):
            y_positions.append(max(0, image_height - tile_size))

        for tile_y in y_positions:
            for tile_x in x_positions:
                tile = source_image[
                    tile_y:min(image_height, tile_y + tile_size),
                    tile_x:min(image_width, tile_x + tile_size),
                ]
                for upscale in self.face_tile_scales:
                    if upscale <= 0:
                        continue
                    scaled_tile = cv2.resize(
                        tile, None, fx=upscale, fy=upscale, interpolation=cv2.INTER_CUBIC
                    )
                    detect_pass(scaled_tile, tile_x, tile_y, upscale)

        return self._dedupe_boxes(boxes)

    def detect(self, image: Image.Image) -> Dict[str, Any]:
        """Return privacy regions in normalized coordinates."""
        if self.face_model is None or self.plate_model is None:
            return {
                'success': False,
                'status': 'unavailable',
                'model_available': False,
                'model': 'opencv-yunet-face+dedicated-plate-yolo-v1',
                'detections': [],
                'detected_regions': 0,
                'error': 'Face and dedicated license-plate privacy detectors are unavailable',
            }

        rgb = np.asarray(image.convert('RGB'))
        image_height, image_width = rgb.shape[:2]
        detection_scale = min(1.0, self.max_detection_dimension / max(image_width, image_height))
        face_boxes = self._detect_faces(rgb, image_width, image_height, detection_scale)
        plate_boxes: List[Tuple[int, int, int, int]] = []
        try:
            rgb_image = image.convert('RGB')
            tile_size = max(320, self.plate_tile_size)
            stride = max(160, int(tile_size * (1.0 - self.plate_tile_overlap)))
            x_positions = list(range(0, max(1, image_width - tile_size + 1), stride))
            y_positions = list(range(0, max(1, image_height - tile_size + 1), stride))
            if not x_positions or x_positions[-1] != max(0, image_width - tile_size):
                x_positions.append(max(0, image_width - tile_size))
            if not y_positions or y_positions[-1] != max(0, image_height - tile_size):
                y_positions.append(max(0, image_height - tile_size))
            for tile_y in y_positions:
                for tile_x in x_positions:
                    tile = rgb_image.crop((tile_x, tile_y, min(image_width, tile_x + tile_size), min(image_height, tile_y + tile_size)))
                    results = self.plate_model.predict(
                        source=np.asarray(tile),
                        imgsz=tile_size,
                        conf=self.plate_model_confidence,
                        device='cpu',
                        verbose=False,
                        max_det=20,
                    )
                    for result in results:
                        for box in result.boxes.xyxy.cpu().numpy().tolist():
                            x1, y1, x2, y2 = [int(round(value)) for value in box[:4]]
                            candidate = self._clip_plate_box(
                                (tile_x + x1, tile_y + y1, max(0, x2 - x1), max(0, y2 - y1)),
                                image_width,
                                image_height,
                            )
                            if candidate is not None:
                                plate_boxes.append(candidate)
            plate_boxes = self._dedupe_boxes(plate_boxes)
        except Exception as error:
            logger.error('Dedicated plate detection failed: %s', error)

        detections: List[Dict[str, Any]] = []
        for label, boxes in (
            ('face', self._dedupe_boxes(list(face_boxes))),
            ('license_plate', self._dedupe_boxes(list(plate_boxes))),
        ):
            for x, y, width, height in boxes:
                # _detect_faces already maps YuNet boxes back to the original
                # image coordinates. Plate boxes come from tiled images at
                # the original resolution. Do not scale either result again;
                # a second face conversion shifts blur regions away from the
                # actual faces when the source exceeds the detection limit.
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
            'model': 'opencv-yunet-face+dedicated-plate-yolo-v1',
            'detected': bool(detections),
            'detections': detections,
            'detected_regions': len(detections),
        }


privacy_service = PrivacyService()
