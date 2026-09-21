import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Shared sizing rules for the mobile client.
///
/// The app remains mobile-first, but these helpers keep the same UI usable on
/// compact phones, large phones, split-screen layouts, and short landscape
/// viewports without duplicating breakpoint calculations in every feature.
abstract final class AppResponsive {
  static const compactBreakpoint = 380.0;
  static const mediumBreakpoint = 600.0;

  static double width(BuildContext context) => MediaQuery.sizeOf(context).width;

  static double height(BuildContext context) =>
      MediaQuery.sizeOf(context).height;

  static bool isCompact(BuildContext context) =>
      width(context) < compactBreakpoint;

  static bool isMediumOrWider(BuildContext context) =>
      width(context) >= mediumBreakpoint;

  static EdgeInsets pagePadding(
    BuildContext context, {
    double compact = 12,
    double regular = 16,
    double wide = 24,
  }) {
    final screenWidth = width(context);
    final horizontal = screenWidth < compactBreakpoint
        ? compact
        : screenWidth >= mediumBreakpoint
            ? wide
            : regular;
    return EdgeInsets.symmetric(horizontal: horizontal);
  }

  static double dialogWidth(
    BuildContext context, {
    double maxWidth = 440,
    double horizontalGutter = 32,
  }) {
    return math.min(
      maxWidth,
      math.max(0, width(context) - horizontalGutter),
    ).toDouble();
  }

  static double dialogMaxHeight(
    BuildContext context, {
    double fraction = .86,
    double minimum = 240,
  }) {
    final availableHeight = height(context) -
        MediaQuery.viewInsetsOf(context).vertical -
        24;
    final safeAvailableHeight = math.max(0, availableHeight).toDouble();
    return math.min(
      safeAvailableHeight,
      math.max(minimum, availableHeight * fraction),
    ).toDouble();
  }

  static int gridColumns(
    BuildContext context, {
    double? availableWidth,
    double minimumItemWidth = 160,
    int compactColumns = 1,
    int mediumColumns = 2,
    int wideColumns = 3,
    int? maxColumns,
  }) {
    return gridColumnsForWidth(
      availableWidth ?? width(context),
      minimumItemWidth: minimumItemWidth,
      compactColumns: compactColumns,
      mediumColumns: mediumColumns,
      wideColumns: wideColumns,
      maxColumns: maxColumns,
    );
  }

  static int gridColumnsForWidth(
    double availableWidth, {
    double minimumItemWidth = 160,
    int compactColumns = 1,
    int mediumColumns = 2,
    int wideColumns = 3,
    int? maxColumns,
  }) {
    final screenWidth = availableWidth;
    final columns = screenWidth < compactBreakpoint
        ? compactColumns
        : screenWidth < mediumBreakpoint
            ? mediumColumns
            : math.min(
                wideColumns,
                math.max(1, (screenWidth / minimumItemWidth).floor()),
              ).toInt();
    return maxColumns == null ? columns : math.min(columns, maxColumns).toInt();
  }
}