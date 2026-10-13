import 'package:flutter/material.dart';

class AppTextStyles {
  static const String uiFontFamily = 'Inter';
  static const String technicalFontFamily = 'RobotoMono';

  // Page Titles / Primary Dashboard Metrics
  static const TextStyle displayLarge = TextStyle(
    fontFamily: uiFontFamily,
    fontSize: 32.0,
    fontWeight: FontWeight.w700, // Inter-Bold
    letterSpacing: -0.8,
    height: 1.2,
  );

  // Section Headers / Card Titles
  static const TextStyle headlineMedium = TextStyle(
    fontFamily: uiFontFamily,
    fontSize: 20.0,
    fontWeight: FontWeight.w600, // Inter-SemiBold
    letterSpacing: -0.4,
    height: 1.3,
  );

  // Standard Body Text
  static const TextStyle bodyLarge = TextStyle(
    fontFamily: uiFontFamily,
    fontSize: 16.0,
    fontWeight: FontWeight.w400, // Inter-Regular
    letterSpacing: 0.1,
    height: 1.5,
  );

  // Metadata / Field Labels / Secondary Captions
  static const TextStyle bodySmall = TextStyle(
    fontFamily: uiFontFamily,
    fontSize: 13.0,
    fontWeight: FontWeight.w400, // Inter-Regular
    height: 1.4,
  );

  // Instructional Text / Placeholder Hints
  static const TextStyle bodySmallItalic = TextStyle(
    fontFamily: uiFontFamily,
    fontSize: 13.0,
    fontWeight: FontWeight.w400,
    fontStyle: FontStyle.italic, // Inter-Italic
  );

  // Interactive Elements (Buttons, Tabs, Chips)
  static const TextStyle labelButton = TextStyle(
    fontFamily: uiFontFamily,
    fontSize: 14.0,
    fontWeight: FontWeight.w600, // Inter-SemiBold
    letterSpacing: 0.2,
    height: 1.3,
  );

  // Service Level Agreement (SLA) Countdown Timers
  static const TextStyle technicalTimer = TextStyle(
    fontFamily: technicalFontFamily,
    fontSize: 18.0,
    fontWeight: FontWeight.w500, // RobotoMono-Medium
    letterSpacing: -0.5,
  );

  // Blockchain Hashes / Incident IDs / GPS Coordinates
  static const TextStyle technicalHash = TextStyle(
    fontFamily: technicalFontFamily,
    fontSize: 12.0,
    fontWeight: FontWeight.w400, // RobotoMono-Regular
    height: 1.4,
  );

  /// Automated System Audit Logs
  static const TextStyle technicalLog = TextStyle(
    fontFamily: technicalFontFamily,
    fontSize: 11.0,
    fontWeight: FontWeight.w400,
    fontStyle: FontStyle.italic, // RobotoMono-Italic
  );
}
