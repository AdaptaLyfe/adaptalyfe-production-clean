import 'package:adaptalyfe_mobile/core/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('theme preference maps to light, dark, and system modes', () {
    expect(AppTheme.modeForPreference('light'), ThemeMode.light);
    expect(AppTheme.modeForPreference('dark'), ThemeMode.dark);
    expect(AppTheme.modeForPreference('auto'), ThemeMode.system);
    expect(AppTheme.modeForPreference('system'), ThemeMode.system);
    expect(AppTheme.modeForPreference(null), ThemeMode.light);
  });

  test('font preference maps to a bounded scale around 16px', () {
    expect(AppTheme.textScaleForPreference(12), 0.75);
    expect(AppTheme.textScaleForPreference(16), 1);
    expect(AppTheme.textScaleForPreference(24), 1.5);
    expect(AppTheme.textScaleForPreference(100), 1.5);
  });

  test('dark and high-contrast themes use their intended brightness', () {
    expect(AppTheme.dark.brightness, Brightness.dark);
    expect(AppTheme.highContrastLight.brightness, Brightness.light);
    expect(AppTheme.highContrastDark.brightness, Brightness.dark);
  });
}