"""Handler/config unit checks without Flask or model loading; not live inference."""
import ast
import copy
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import Mock

import yaml

BASE = Path(__file__).parent


def handlers():
    tree = ast.parse((BASE / 'src/api/routes.py').read_text(encoding='utf-8'))
    names = {'detect_privacy', '_run_category_detection', 'detect_surface_drainage',
             'detect_electrical_damage', 'comprehensive_detection'}
    functions = [copy.deepcopy(node) for node in tree.body
                 if isinstance(node, ast.FunctionDef) and node.name in names]
    assert {node.name for node in functions} == names
    for node in functions:
        node.decorator_list = []
    namespace = {
        'jsonify': lambda value: value,
        'request': SimpleNamespace(files={'image': object()}, form={'category': 'road'}),
        'validate_image': Mock(return_value=(True, None, 'decoded-image')),
        'detection_service': Mock(), 'privacy_service': Mock(), 'logger': Mock(),
        'time': SimpleNamespace(time=lambda: 0),
        'CANONICAL_CATEGORIES': {'road', 'drainage', 'electrical', 'water', 'gas', 'streetlight', 'other'}
    }
    exec(compile(ast.Module(body=functions, type_ignores=[]), '<route-handlers>', 'exec'), namespace)
    return namespace


class PrivacyScopeTests(unittest.TestCase):
    def test_privacy_endpoint_validates_and_returns_detector_regions(self):
        scope = handlers()
        scope['privacy_service'].detect.return_value = {
            'success': True,
            'status': 'completed',
            'model_available': True,
            'detections': [{'label': 'face'}],
            'detected_regions': 1,
        }
        payload, status = scope['detect_privacy']()
        self.assertEqual(status, 200)
        self.assertEqual(payload['status'], 'completed')
        self.assertEqual(payload['detected_regions'], 1)
        scope['validate_image'].assert_called_once()
        scope['privacy_service'].detect.assert_called_once_with('decoded-image')

    def test_all_hazard_categories_still_validate_images_and_use_category_inference(self):
        for category in ('road', 'drainage', 'electrical', 'water', 'gas', 'streetlight', 'other'):
            with self.subTest(category=category):
                scope = handlers()
                scope['detection_service'].comprehensive_detection.return_value = {'analysis_status': 'completed'}
                payload, status = scope['_run_category_detection'](category)
                self.assertEqual(status, 200)
                self.assertIs(payload['success'], True)
                scope['validate_image'].assert_called_once()
                scope['detection_service'].comprehensive_detection.assert_called_once_with('decoded-image', category)

    def test_fixed_and_generic_hazard_endpoints_keep_their_category_routes(self):
        for name, category in [('detect_surface_drainage', 'drainage'),
                               ('detect_electrical_damage', 'electrical'),
                               ('comprehensive_detection', 'road')]:
            with self.subTest(name=name):
                scope = handlers()
                scope['_run_category_detection'] = Mock(return_value='result')
                self.assertEqual(scope[name](), 'result')
                scope['_run_category_detection'].assert_called_once_with(category)

    def test_invalid_image_remains_rejected_before_hazard_inference(self):
        scope = handlers()
        scope['validate_image'].return_value = (False, 'Invalid image', None)
        payload, status = scope['_run_category_detection']('road')
        self.assertEqual(status, 400)
        self.assertEqual(payload['error'], 'Invalid image')
        scope['detection_service'].comprehensive_detection.assert_not_called()

    def test_privacy_detector_configuration_is_present(self):
        config = yaml.safe_load((BASE / 'config.yaml').read_text(encoding='utf-8'))
        self.assertEqual(config['privacy']['face_cascade'], 'haarcascade_frontalface_default.xml')
        self.assertEqual(config['privacy']['plate_cascade'], 'haarcascade_russian_plate_number.xml')
        expected = {'road': 'road_damage', 'drainage': 'surface_drainage',
                    'electrical': 'electrical_damage', 'water': 'water_leak',
                    'gas': 'gas_infrastructure_damage', 'streetlight': 'streetlight_damage',
                    'other': 'environmental_hazards'}
        self.assertEqual(config['category_models'], expected)
        for category, model in expected.items():
            self.assertIn(model, config['models'])
            if category != 'gas':
                self.assertTrue((BASE / config['models'][model]['path']).is_file(), category)


if __name__ == '__main__':
    unittest.main()
