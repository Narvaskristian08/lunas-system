import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/features/profile/presentation/utils/phone_number_formatter.dart';

void main() {
  group('Philippine mobile number formatting', () {
    test('formats complete local and international numbers', () {
      expect(formatPhilippineMobileNumber('09990000003'), '0999 000 0003');
      expect(formatPhilippineMobileNumber('+639990000003'), '+63 999 000 0003');
      expect(normalizePhilippineMobileNumber('0999 000 0003'), '09990000003');
    });

    test('formats partial input and limits its normalized length', () {
      const formatter = PhilippineMobileInputFormatter();
      final local = formatter.formatEditUpdate(
        TextEditingValue.empty,
        const TextEditingValue(text: '09990000003123'),
      );
      final international = formatter.formatEditUpdate(
        TextEditingValue.empty,
        const TextEditingValue(text: '+639990000003123'),
      );

      expect(local.text, '0999 000 0003');
      expect(international.text, '+63 999 000 0003');
    });
  });
}
