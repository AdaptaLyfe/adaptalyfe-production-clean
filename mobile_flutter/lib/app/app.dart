import 'package:flutter/material.dart';

import 'routes.dart';

class AdaptalyfeApp extends StatelessWidget {
  const AdaptalyfeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Adaptalyfe',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2E7D6B)),
        useMaterial3: true,
      ),
      routerConfig: appRouter,
    );
  }
}