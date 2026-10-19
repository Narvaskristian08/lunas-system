import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/core/utils/display_labels.dart';

void main() {
  test('humanizes backend codes, camel case, and acronyms', () {
    expect(humanizeCodeLabel('repair_personnel'), 'Utility Personnel');
    expect(
      humanizeCodeLabel('cityCorrectionRequired'),
      'City Correction Required',
    );
    expect(
      humanizeCodeLabel('awaiting_city_engineering_review'),
      'Awaiting City Engineering Review',
    );
    expect(
      humanizeCodeLabel('work_order_created_from_validated_incident'),
      'Work Order Created from Validated Incident',
    );
    expect(humanizeCodeLabel('sla_overdue'), 'SLA Overdue');
    expect(humanizeCodeLabel('ai-model_v2'), 'AI Model V2');
  });

  test('uses a readable fallback for an empty code', () {
    expect(humanizeCodeLabel(''), 'Unavailable');
    expect(
      humanizeCodeLabel('  ', fallback: 'Status Unavailable'),
      'Status Unavailable',
    );
  });
}
