import 'package:lunas_mobile/core/network/api_client.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/features/reporting/data/models/category_option.dart';

class CategoryLoadResult {
  const CategoryLoadResult({
    required this.categories,
    this.usingConfiguredFallback = false,
  });

  final List<CategoryOption> categories;
  final bool usingConfiguredFallback;
}

class CategoryService {
  const CategoryService({required ApiClient apiClient})
    : _apiClient = apiClient;

  final ApiClient _apiClient;

  Future<CategoryLoadResult> getCategories() async {
    try {
      final payload = await _apiClient.get('/categories');
      final data = payload['data'];
      final rawCategories = data is List
          ? data
          : data is Map && data['categories'] is List
          ? data['categories'] as List
          : const [];
      final categories = rawCategories
          .map(CategoryOption.fromJson)
          .where((category) => category.code.isNotEmpty)
          .toList(growable: false);
      if (categories.isNotEmpty) {
        return CategoryLoadResult(categories: categories);
      }
    } on ApiException catch (error) {
      if (error.isUnauthorized || error.isForbidden) rethrow;
    }
    // These are the backend's supported incident category values, not demo
    // data. They keep manual reporting available if the category API is down.
    return const CategoryLoadResult(
      categories: supportedReportCategories,
      usingConfiguredFallback: true,
    );
  }
}
