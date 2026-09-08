import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/bloc/auth_bloc.dart';
import 'routes.dart';

class AdaptalyfeApp extends StatefulWidget {
  const AdaptalyfeApp({super.key});

  @override
  State<AdaptalyfeApp> createState() => _AdaptalyfeAppState();
}

class _AdaptalyfeAppState extends State<AdaptalyfeApp> {
  late final AuthBloc _authBloc;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _authBloc = AuthBloc(createAuthRepository());
    _router = createAppRouter(_authBloc);
  }

  @override
  void dispose() {
    _router.dispose();
    _authBloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _authBloc,
      child: MaterialApp.router(
        title: 'Adaptalyfe',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF2E7D6B),
          ),
          useMaterial3: true,
        ),
        routerConfig: _router,
      ),
    );
  }
}