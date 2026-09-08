import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/app_exception.dart';
import 'auth_cubit.dart';

class SplashPage extends StatelessWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthCubit, AuthState>(
      builder: (context, state) {
        return Scaffold(
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.asset(
                    'assets/brand/adaptalyfe-icon.png',
                    width: 88,
                    height: 88,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'AdaptaLyfe',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 20),
                  if (state is AuthFailure) ...[
                    _FailureNotice(error: state.error),
                    FilledButton(
                      onPressed: () => context.read<AuthCubit>().restore(),
                      child: const Text('Try again'),
                    ),
                  ] else
                    const CircularProgressIndicator(),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _form = GlobalKey<FormState>();
  final _username = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _username.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _AuthScaffold(
      title: 'Welcome back',
      subtitle: 'Sign in to continue your journey.',
      child: BlocBuilder<AuthCubit, AuthState>(
        builder: (context, state) {
          return Form(
            key: _form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (state
                    case AuthUnauthenticated(
                      message: final String message,
                    ))
                  _Notice(message, Colors.green),
                if (state
                    case AuthUnauthenticated(
                      logoutError: final AppException error,
                    ))
                  _Notice(
                    'You are signed out. ${error.message}',
                    Colors.orange,
                  ),
                if (state is AuthFailure) _FailureNotice(error: state.error),
                TextFormField(
                  controller: _username,
                  decoration: const InputDecoration(labelText: 'Username'),
                  textInputAction: TextInputAction.next,
                  validator: _required,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _password,
                  decoration: const InputDecoration(labelText: 'Password'),
                  obscureText: true,
                  textInputAction: TextInputAction.done,
                  validator: _required,
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: state is AuthLoading
                      ? null
                      : () {
                          if (_form.currentState!.validate()) {
                            context.read<AuthCubit>().signIn(
                                  _username.text.trim(),
                                  _password.text,
                                );
                          }
                        },
                  child: state is AuthLoading
                      ? const SizedBox.square(
                          dimension: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Sign in'),
                ),
                TextButton(
                  onPressed:
                      state is AuthLoading ? null : () => context.go('/signup'),
                  child: const Text('Create an account'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  String? _required(String? value) {
    return value == null || value.trim().isEmpty ? 'Required' : null;
  }
}

class SignupPage extends StatefulWidget {
  const SignupPage({super.key});

  @override
  State<SignupPage> createState() => _SignupPageState();
}

class _SignupPageState extends State<SignupPage> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _username = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _username.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _AuthScaffold(
      title: 'Create your account',
      subtitle: 'Start building independence, one step at a time.',
      child: BlocBuilder<AuthCubit, AuthState>(
        builder: (context, state) {
          return Form(
            key: _form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (state is AuthFailure) _FailureNotice(error: state.error),
                TextFormField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Name'),
                  textInputAction: TextInputAction.next,
                  validator: _required,
                ),
                TextFormField(
                  controller: _username,
                  decoration: const InputDecoration(labelText: 'Username'),
                  textInputAction: TextInputAction.next,
                  validator: _required,
                ),
                TextFormField(
                  controller: _email,
                  decoration: const InputDecoration(
                    labelText: 'Email (optional)',
                  ),
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                ),
                TextFormField(
                  controller: _password,
                  decoration: const InputDecoration(
                    labelText: 'Password (8+ characters)',
                  ),
                  obscureText: true,
                  textInputAction: TextInputAction.done,
                  validator: (value) {
                    return value == null || value.length < 8
                        ? 'Use at least 8 characters'
                        : null;
                  },
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: state is AuthLoading
                      ? null
                      : () {
                          if (_form.currentState!.validate()) {
                            context.read<AuthCubit>().signUp(
                                  name: _name.text.trim(),
                                  username: _username.text.trim(),
                                  password: _password.text,
                                  email: _email.text.trim(),
                                );
                          }
                        },
                  child: state is AuthLoading
                      ? const SizedBox.square(
                          dimension: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Create account'),
                ),
                TextButton(
                  onPressed:
                      state is AuthLoading ? null : () => context.go('/login'),
                  child: const Text('Already have an account? Sign in'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  String? _required(String? value) {
    return value == null || value.trim().isEmpty ? 'Required' : null;
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  static const _modules = [
    ('Daily Tasks', Icons.check_circle_outline, Color(0xff168f49)),
    ('Health & Medication', Icons.medical_services_outlined, Color(0xffe53935)),
    ('Learning & Skills', Icons.school_outlined, Color(0xff4285f4)),
    (
      'Money & Budget',
      Icons.account_balance_wallet_outlined,
      Color(0xffd89613)
    ),
    ('Mood Tracking', Icons.favorite_outline, Color(0xff7544d5)),
    ('Caregiver Support', Icons.people_outline, Color(0xffe0408a)),
    ('Meals & Grocery', Icons.restaurant_outlined, Color(0xff168f49)),
    ('Calendar', Icons.calendar_month_outlined, Color(0xff4285f4)),
    ('AdaptAI', Icons.auto_awesome_outlined, Color(0xff7544d5)),
  ];

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthCubit, AuthState>(
      builder: (context, state) {
        if (state is! AuthAuthenticated) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: const Text('AdaptaLyfe'),
            actions: [
              IconButton(
                tooltip: 'Sign out',
                onPressed: () => context.read<AuthCubit>().signOut(),
                icon: const Icon(Icons.logout),
              ),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                'Hi, ${state.user.name}',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 4),
              const Text('What would you like to work on today?'),
              const SizedBox(height: 20),
              if (_modules.isEmpty)
                const _EmptyModules()
              else
                GridView.count(
                  crossAxisCount: 2,
                  childAspectRatio: 1.15,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  children: [
                    for (final module in _modules)
                      Card(
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  '${module.$1} is coming to mobile soon.',
                                ),
                              ),
                            );
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(
                                  module.$2,
                                  color: module.$3,
                                  size: 29,
                                ),
                                const Spacer(),
                                Text(
                                  module.$1,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
            ],
          ),
        );
      },
    );
  }
}

class _EmptyModules extends StatelessWidget {
  const _EmptyModules();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          Icon(Icons.apps_outlined, size: 40),
          SizedBox(height: 12),
          Text('No modules are available yet.'),
        ],
      ),
    );
  }
}

class _AuthScaffold extends StatelessWidget {
  const _AuthScaffold({
    required this.title,
    required this.subtitle,
    required this.child,
  });

  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Image.asset(
                      'assets/brand/adaptalyfe-icon.png',
                      width: 64,
                      height: 64,
                    ),
                  ),
                  const SizedBox(height: 32),
                  Text(title,
                      style: Theme.of(context).textTheme.headlineMedium),
                  const SizedBox(height: 8),
                  Text(subtitle),
                  const SizedBox(height: 28),
                  child,
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Notice extends StatelessWidget {
  const _Notice(this.message, this.color);

  final String message;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(message),
    );
  }
}

class _FailureNotice extends StatelessWidget {
  const _FailureNotice({required this.error});

  final AppException error;

  @override
  Widget build(BuildContext context) {
    final label = switch (error) {
      NetworkException() => 'Network issue',
      InvalidSessionException() => 'Session issue',
      ServerException() => 'Server issue',
      InvalidResponseException() => 'Response issue',
    };
    return _Notice('$label: ${error.message}', Colors.red);
  }
}
