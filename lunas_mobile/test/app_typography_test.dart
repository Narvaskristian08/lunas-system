import 'package:flutter_test/flutter_test.dart';
import 'package:lunas_mobile/core/theme/app_theme.dart';
import 'package:lunas_mobile/core/theme/text_styles.dart';

void main() {
  test('mobile themes use bundled Inter for interface text', () {
    for (final theme in [AppTheme.light, AppTheme.dark]) {
      expect(
        theme.textTheme.bodyMedium?.fontFamily,
        AppTextStyles.uiFontFamily,
      );
      expect(
        theme.textTheme.titleLarge?.fontFamily,
        AppTextStyles.uiFontFamily,
      );
      expect(
        theme.textTheme.labelLarge?.fontFamily,
        AppTextStyles.uiFontFamily,
      );
      expect(
        theme.navigationBarTheme.labelTextStyle?.resolve({})?.fontFamily,
        AppTextStyles.uiFontFamily,
      );
    }
  });

  test('technical styles use bundled Roboto Mono', () {
    expect(
      AppTextStyles.technicalTimer.fontFamily,
      AppTextStyles.technicalFontFamily,
    );
    expect(
      AppTextStyles.technicalHash.fontFamily,
      AppTextStyles.technicalFontFamily,
    );
    expect(
      AppTextStyles.technicalLog.fontFamily,
      AppTextStyles.technicalFontFamily,
    );
  });
}
