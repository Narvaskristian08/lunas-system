import 'package:flutter/material.dart';

abstract final class AppShadows {
  static const card = [
    BoxShadow(color: Color(0x0D0F172A), blurRadius: 12, offset: Offset(0, 3)),
  ];

  static const elevated = [
    BoxShadow(color: Color(0x1A005EA8), blurRadius: 20, offset: Offset(0, 8)),
  ];
}
