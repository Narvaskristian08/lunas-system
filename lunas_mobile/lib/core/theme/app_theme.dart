import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/text_styles.dart';

abstract final class AppTheme {
  static ThemeData get light => _build(
    brightness: Brightness.light,
    background: AppColorsLight.background,
    surface: AppColorsLight.surface,
    primary: AppColorsLight.brandBase,
    text: AppColorsLight.textPrimary,
    secondaryText: AppColorsLight.textSecondary,
    outline: AppColorsLight.divider,
    error: AppColorsLight.critical,
    alert: AppColorsLight.alert,
  );

  static ThemeData get dark => _build(
    brightness: Brightness.dark,
    background: AppColorsDark.background,
    surface: AppColorsDark.surface,
    primary: AppColorsDark.brandBase,
    text: AppColorsDark.textPrimary,
    secondaryText: AppColorsDark.textSecondary,
    outline: AppColorsDark.divider,
    error: AppColorsDark.critical,
    alert: AppColorsDark.alert,
  );

  static ThemeData _build({
    required Brightness brightness,
    required Color background,
    required Color surface,
    required Color primary,
    required Color text,
    required Color secondaryText,
    required Color outline,
    required Color error,
    required Color alert,
  }) {
    final dark = brightness == Brightness.dark;
    final scheme = ColorScheme(
      brightness: brightness,
      primary: primary,
      onPrimary: dark ? const Color(0xFF05297A) : Colors.white,
      primaryContainer: dark
          ? const Color(0xFF1E3A8A)
          : const Color(0xFFDCE6FF),
      onPrimaryContainer: dark ? const Color(0xFF90A8FF) : text,
      secondary: dark ? const Color(0xFFB7C8E1) : const Color(0xFF4B5E78),
      onSecondary: dark ? const Color(0xFF213145) : Colors.white,
      error: error,
      onError: dark ? const Color(0xFF690005) : Colors.white,
      surface: surface,
      onSurface: text,
      onSurfaceVariant: secondaryText,
      outline: outline,
      outlineVariant: outline,
      tertiary: alert,
      onTertiary: dark ? const Color(0xFF472A00) : Colors.white,
      tertiaryContainer: dark
          ? const Color(0xFF5C3800)
          : const Color(0xFFFFDDB8),
      onTertiaryContainer: dark ? const Color(0xFFFFDDB8) : text,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: background,
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: scheme.primaryContainer,
        foregroundColor: scheme.onPrimaryContainer,
        elevation: 3,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        sizeConstraints: const BoxConstraints.tightFor(width: 56, height: 56),
        extendedSizeConstraints: const BoxConstraints.tightFor(height: 56),
      ),
      fontFamily: AppTextStyles.uiFontFamily,
      textTheme: TextTheme(
        displayLarge: AppTextStyles.displayLarge.copyWith(
          fontSize: 48,
          color: text,
        ),
        displayMedium: AppTextStyles.displayLarge.copyWith(
          fontSize: 40,
          color: text,
        ),
        displaySmall: AppTextStyles.displayLarge.copyWith(
          fontSize: 36,
          color: text,
        ),
        headlineLarge: AppTextStyles.displayLarge.copyWith(color: text),
        headlineMedium: AppTextStyles.displayLarge.copyWith(
          fontSize: 28,
          color: text,
        ),
        headlineSmall: AppTextStyles.headlineMedium.copyWith(
          fontSize: 24,
          color: text,
        ),
        titleLarge: AppTextStyles.headlineMedium.copyWith(color: text),
        titleMedium: AppTextStyles.bodyLarge.copyWith(
          color: text,
          fontWeight: FontWeight.w600,
          height: 1.4,
        ),
        titleSmall: AppTextStyles.bodySmall.copyWith(
          fontSize: 14,
          color: text,
          fontWeight: FontWeight.w600,
        ),
        bodyLarge: AppTextStyles.bodyLarge.copyWith(color: text),
        bodyMedium: AppTextStyles.bodySmall.copyWith(
          fontSize: 14,
          height: 1.5,
          color: secondaryText,
        ),
        bodySmall: AppTextStyles.bodySmall.copyWith(color: secondaryText),
        labelLarge: AppTextStyles.labelButton.copyWith(color: text),
        labelMedium: AppTextStyles.labelButton.copyWith(
          fontSize: 12,
          color: text,
        ),
        labelSmall: AppTextStyles.labelButton.copyWith(
          fontSize: 11,
          color: secondaryText,
          letterSpacing: .2,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: surface,
        foregroundColor: text,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      cardTheme: CardThemeData(
        color: surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: AppRadius.card),
      ),
      dividerTheme: DividerThemeData(color: outline, thickness: 1),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        indicatorColor: primary,
        indicatorShape: const StadiumBorder(),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => AppTextStyles.bodySmall.copyWith(
            fontSize: 10,
            height: 1.2,
            letterSpacing: 0,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w600
                : FontWeight.w500,
            color: states.contains(WidgetState.selected)
                ? primary
                : secondaryText,
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: surface,
        selectedColor: primary.withValues(alpha: .1),
        side: BorderSide(color: outline),
        shape: RoundedRectangleBorder(borderRadius: AppRadius.input),
        labelStyle: AppTextStyles.bodySmall.copyWith(
          color: text,
          fontWeight: FontWeight.w600,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: dark ? const Color(0xFF222A3D) : surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 18,
        ),
        border: _border(outline.withValues(alpha: .45)),
        enabledBorder: _border(outline.withValues(alpha: .45)),
        focusedBorder: _border(primary, width: 1.5),
        errorBorder: _border(error),
        focusedErrorBorder: _border(error, width: 1.5),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(textStyle: AppTextStyles.labelButton),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(textStyle: AppTextStyles.labelButton),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size(48, 54),
          elevation: 0,
          textStyle: AppTextStyles.labelButton.copyWith(
            fontWeight: FontWeight.w700,
          ),
          shape: RoundedRectangleBorder(borderRadius: AppRadius.button),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
          textStyle: AppTextStyles.labelButton.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: AppRadius.input),
      ),
    );
  }

  static OutlineInputBorder _border(Color color, {double width = 1}) {
    return OutlineInputBorder(
      borderRadius: AppRadius.input,
      borderSide: BorderSide(color: color, width: width),
    );
  }
}
