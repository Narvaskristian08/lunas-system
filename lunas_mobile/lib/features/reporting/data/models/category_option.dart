import 'package:lunas_mobile/core/utils/display_labels.dart';

class CategoryOption {
  const CategoryOption({
    required this.code,
    required this.label,
    required this.description,
  });

  final String code;
  final String label;
  final String description;

  factory CategoryOption.fromJson(Object? value) {
    if (value is String) return categoryFromCode(value);
    final json = value is Map<String, dynamic>
        ? value
        : value is Map
        ? Map<String, dynamic>.from(value)
        : <String, dynamic>{};
    final code =
        (json['code'] ?? json['value'] ?? json['id'] ?? json['name'] ?? '')
            .toString();
    final fallback = categoryFromCode(code);
    return CategoryOption(
      code: code.isEmpty ? fallback.code : code,
      label: code == 'road'
          ? 'Road Damage'
          : _categoryTitle(
              (json['label'] ?? json['name'] ?? fallback.label).toString(),
            ),
      description: (json['description'] ?? fallback.description).toString(),
    );
  }
}

const supportedReportCategories = <CategoryOption>[
  CategoryOption(
    code: 'road',
    label: 'Road Damage',
    description: 'Potholes, damaged roads, and unsafe walkways.',
  ),
  CategoryOption(
    code: 'drainage',
    label: 'Drainage',
    description: 'Visible garbage blocking roadside drains, gutters, or canals.',
  ),
  CategoryOption(
    code: 'electrical',
    label: 'Electrical',
    description: 'Damaged public electrical infrastructure.',
  ),
  CategoryOption(
    code: 'water',
    label: 'Water',
    description: 'Visible water leaks or damaged water infrastructure.',
  ),
  CategoryOption(
    code: 'streetlight',
    label: 'Streetlight',
    description: 'Broken, missing, or unlit public streetlights.',
  ),
  CategoryOption(
    code: 'other',
    label: 'Other Infrastructure Concern',
    description: 'An infrastructure issue not listed above.',
  ),
];

CategoryOption categoryFromCode(String code) {
  return supportedReportCategories.firstWhere(
    (category) => category.code == code,
    orElse: () => CategoryOption(
      code: code,
      label: humanizeCodeLabel(code, fallback: 'Other Infrastructure Concern'),
      description: 'Infrastructure concern',
    ),
  );
}

String _categoryTitle(String label) {
  const smallWords = {'and', 'or', 'of', 'the', 'for', 'in', 'to'};
  var first = true;
  return label.replaceAllMapped(RegExp(r'[A-Za-z]+'), (match) {
    final word = match.group(0)!;
    final keepLowercase = !first && smallWords.contains(word.toLowerCase());
    first = false;
    if (keepLowercase) return word.toLowerCase();
    return '${word[0].toUpperCase()}${word.substring(1)}';
  });
}
