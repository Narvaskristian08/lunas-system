const _displayAcronyms = <String>{
  'ai',
  'api',
  'gps',
  'id',
  'mfa',
  'otp',
  'qa',
  'sla',
  'url',
};

const _displaySmallWords = <String>{
  'and',
  'at',
  'by',
  'for',
  'in',
  'of',
  'or',
  'to',
};

/// Converts backend codes and enum-style values into readable interface text.
/// Identifiers and user-authored prose should not be passed through this.
String humanizeCodeLabel(String value, {String fallback = 'Unavailable'}) {
  final normalized = value
      .trim()
      .replaceAllMapped(
        RegExp(r'([a-z0-9])([A-Z])'),
        (match) => '${match.group(1)} ${match.group(2)}',
      )
      .replaceAll(RegExp(r'[_-]+'), ' ')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
  if (normalized.isEmpty) return fallback;

  final words = normalized.split(' ');
  return [
    for (var index = 0; index < words.length; index++)
      _displayWord(words[index], isFirst: index == 0),
  ].join(' ');
}

String _displayWord(String value, {required bool isFirst}) {
  final lower = value.toLowerCase();
  if (_displayAcronyms.contains(lower)) return lower.toUpperCase();
  if (!isFirst && _displaySmallWords.contains(lower)) return lower;
  return '${lower[0].toUpperCase()}${lower.substring(1)}';
}
