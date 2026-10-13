import 'package:flutter/services.dart';

String normalizePhilippineMobileNumber(String value) =>
    value.replaceAll(RegExp(r'\s+'), '');

String formatPhilippineMobileNumber(String value) {
  final normalized = normalizePhilippineMobileNumber(value.trim());
  if (RegExp(r'^09\d{9}$').hasMatch(normalized)) {
    return '${normalized.substring(0, 4)} '
        '${normalized.substring(4, 7)} '
        '${normalized.substring(7)}';
  }
  if (RegExp(r'^\+639\d{9}$').hasMatch(normalized)) {
    return '${normalized.substring(0, 3)} '
        '${normalized.substring(3, 6)} '
        '${normalized.substring(6, 9)} '
        '${normalized.substring(9)}';
  }
  return value.trim();
}

class PhilippineMobileInputFormatter extends TextInputFormatter {
  const PhilippineMobileInputFormatter();

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final startsWithPlus = newValue.text.trimLeft().startsWith('+');
    var digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    final maximumDigits = startsWithPlus ? 12 : 11;
    if (digits.length > maximumDigits) {
      digits = digits.substring(0, maximumDigits);
    }

    final formatted = startsWithPlus
        ? _formatInternational(digits)
        : _formatLocal(digits);
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }

  String _formatLocal(String digits) => _group(digits, const [4, 3, 4]);

  String _formatInternational(String digits) {
    if (digits.isEmpty) return '+';
    return '+${_group(digits, const [2, 3, 3, 4])}';
  }

  String _group(String value, List<int> sizes) {
    final parts = <String>[];
    var offset = 0;
    for (final size in sizes) {
      if (offset >= value.length) break;
      final end = (offset + size).clamp(0, value.length);
      parts.add(value.substring(offset, end));
      offset = end;
    }
    return parts.join(' ');
  }
}
