import 'package:flutter/widgets.dart';

abstract final class AppSpacing {
  static const double xxs = 4;
  static const double xs = 8;
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 20;
  static const double xl = 24;
  static const double xxl = 32;
  static const double xxxl = 48;
  static const double hero = 64;

  static const pagePadding = EdgeInsets.symmetric(horizontal: xl);
  static const cardPadding = EdgeInsets.all(lg);
}
