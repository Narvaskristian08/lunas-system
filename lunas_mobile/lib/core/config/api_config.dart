/// Runtime configuration for the LUNAS REST API.
///
/// Set this at build/run time instead of committing environment-specific URLs:
/// `--dart-define=LUNAS_API_BASE_URL=https://api.example.gov.ph/api/v1`.
/// The default is convenient for the Android emulator only.
abstract final class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'LUNAS_API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5000/api/v1',
  );

  static Uri uri(String path, [Map<String, String>? queryParameters]) {
    final normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    return Uri.parse('${baseUrl.replaceFirst(RegExp(r'/+$'), '')}/$normalizedPath')
        .replace(queryParameters: queryParameters);
  }
}
