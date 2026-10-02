import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:adaptalyfe_mobile/features/feature_catalog/presentation/features_screen.dart';

void main() {
  testWidgets('shows the wrapper catalog and filters features by plan',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: FeaturesScreen(),
      ),
    );

    expect(find.text('Adaptalyfe Features'), findsOneWidget);
    expect(find.text('All Features (28)'), findsOneWidget);
    expect(find.text('Daily Task Management'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.text('Meal Planning & Shopping Lists'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Meal Planning & Shopping Lists'), findsOneWidget);

    await tester.drag(
      find.byType(Scrollable).first,
      const Offset(0, 10000),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ChoiceChip, 'Basic Plan (7)'));
    await tester.pumpAndSettle();

    expect(find.text('Daily Task Management'), findsOneWidget);
    expect(find.text('Financial Tracking'), findsOneWidget);
    expect(find.text('Meal Planning & Shopping Lists'), findsNothing);
    expect(find.text('Up to 5 Individual User Profiles'), findsNothing);
  });
}