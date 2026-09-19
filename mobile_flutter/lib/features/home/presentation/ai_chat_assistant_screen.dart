import 'package:flutter/material.dart';

import 'home_extended_widgets.dart';

class AIChatAssistantScreen extends StatelessWidget {
  const AIChatAssistantScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Chat Assistant'),
      ),
      body: const HomeChatSheet(page: true),
    );
  }
}