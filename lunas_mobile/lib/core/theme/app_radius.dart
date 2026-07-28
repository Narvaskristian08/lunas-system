import 'package:flutter/widgets.dart';

abstract final class AppRadius {
  static const double xs = 8;
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 18;
  static const double xl = 20;
  static const double pill = 999;

  static final input = BorderRadius.circular(sm);
  static final button = BorderRadius.circular(sm);
  static final card = BorderRadius.circular(md);
}
