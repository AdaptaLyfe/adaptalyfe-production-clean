import 'dart:ui' as ui;

import 'package:flutter/material.dart';

class PrivacyModeScope extends InheritedWidget {
  const PrivacyModeScope({
    required this.enabled,
    required super.child,
    super.key,
  });

  final bool enabled;

  static bool enabledFor(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<PrivacyModeScope>()?.enabled ??
      false;

  @override
  bool updateShouldNotify(PrivacyModeScope oldWidget) =>
      enabled != oldWidget.enabled;
}

/// Visually obscures a value while this user's on-device Privacy Mode is active.
class PrivacySensitive extends StatelessWidget {
  const PrivacySensitive({
    required this.child,
    this.blurSigma = 7,
    super.key,
  });

  final Widget child;
  final double blurSigma;

  @override
  Widget build(BuildContext context) {
    if (!PrivacyModeScope.enabledFor(context)) return child;

    return ClipRect(
      child: ImageFiltered(
        imageFilter: ui.ImageFilter.blur(
          sigmaX: blurSigma,
          sigmaY: blurSigma,
        ),
        child: child,
      ),
    );
  }
}
