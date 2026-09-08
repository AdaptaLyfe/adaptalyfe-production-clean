import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../models/user_model.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../../auth/bloc/auth_state.dart';
import '../bloc/home_bloc.dart';
import '../bloc/home_event.dart';
import '../bloc/home_state.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<HomeBloc, HomeState>(
      listener: (context, state) {
        if (state is HomeError) {
          if (state.sessionInvalid) {
            context.read<AuthBloc>().add(const CheckAuthentication());
            return;
          }

          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(
              SnackBar(
                content: Text(state.message),
                action: SnackBarAction(
                  label: 'Retry',
                  onPressed: () {
                    context.read<HomeBloc>().add(const RefreshHome());
                  },
                ),
              ),
            );
        }
      },
      builder: (context, state) {
        return Scaffold(
          appBar: const _HomeAppBar(),
          drawer: const _HomeDrawer(),
          body: _HomeBody(state: state),
          bottomNavigationBar: const _MobileBottomNavigation(),
        );
      },
    );
  }
}

class _HomeAppBar extends StatelessWidget implements PreferredSizeWidget {
  const _HomeAppBar();

  @override
  Size get preferredSize => const Size.fromHeight(64);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.white,
      foregroundColor: const Color(0xFF111827),
      elevation: 2,
      shadowColor: const Color(0x18000000),
      titleSpacing: 8,
      title: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(9),
            child: Image.asset(
              'assets/adaptalyfe-icon.png',
              width: 36,
              height: 36,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 10),
          const Text(
            'Adaptalyfe',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          tooltip: 'Open notifications',
          onPressed: () => context.push('/notifications'),
          icon: const Icon(Icons.notifications_none_rounded),
        ),
        IconButton(
          tooltip: 'Refresh dashboard',
          onPressed: () {
            context.read<HomeBloc>().add(const RefreshHome());
          },
          icon: const Icon(Icons.refresh_rounded),
        ),
        Builder(
          builder: (context) => IconButton(
            tooltip: 'Open menu',
            onPressed: () => Scaffold.of(context).openDrawer(),
            icon: const Icon(Icons.menu_rounded),
          ),
        ),
        const SizedBox(width: 4),
      ],
    );
  }
}

class _HomeBody extends StatelessWidget {
  const _HomeBody({required this.state});

  final HomeState state;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0xFFEFF6FF),
            Color(0xFFF5F3FF),
            Color(0xFFF0FDFA),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: RefreshIndicator(
        onRefresh: () async {
          final bloc = context.read<HomeBloc>();
          bloc.add(const RefreshHome());
          await bloc.stream.firstWhere(
            (nextState) => nextState is HomeLoaded || nextState is HomeError,
          );
        },
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
          children: [
            if (state is HomeInitial || state is HomeLoading)
              const _HomeLoadingCard()
            else if (state is HomeLoaded)
              _UserGreetingCard(user: (state as HomeLoaded).user)
            else if (state is HomeError)
              _HomeErrorCard(
                message: (state as HomeError).message,
                onRetry: () {
                  context.read<HomeBloc>().add(const RefreshHome());
                },
              ),
            const SizedBox(height: 20),
            const _DashboardShellCard(),
          ],
        ),
      ),
    );
  }
}

class _UserGreetingCard extends StatelessWidget {
  const _UserGreetingCard({required this.user});

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    final displayName = user.name?.trim().isNotEmpty == true
        ? user.name!.trim()
        : user.username;
    final email = user.email?.trim();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF2DD4BF),
          width: 2,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x22000000),
            blurRadius: 8,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: Image.asset(
                  'assets/adaptalyfe-icon.png',
                  width: 28,
                  height: 28,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(width: 8),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Adaptalyfe',
                    style: TextStyle(
                      color: Color(0xFF2DD4BF),
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    'Grow with Guidance. Thrive with Confidence.',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            '${_greeting()}, $displayName! ★',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 25,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _UserInfoPill(
                label: 'Username',
                value: '@${user.username}',
              ),
              if (email != null && email.isNotEmpty)
                _UserInfoPill(
                  label: 'Email',
                  value: email,
                ),
            ],
          ),
        ],
      ),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }
}

class _UserInfoPill extends StatelessWidget {
  const _UserInfoPill({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 280),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: const Color(0x80374151),
        borderRadius: BorderRadius.circular(9),
        border: Border.all(color: const Color(0x662DD4BF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFFE5E7EB),
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF2DD4BF),
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _DashboardShellCard extends StatelessWidget {
  const _DashboardShellCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Your Dashboard',
            style: TextStyle(
              color: Color(0xFF111827),
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Your daily tasks, progress, and guidance will appear here.',
            style: TextStyle(
              color: Color(0xFF4B5563),
              fontSize: 14,
            ),
          ),
          SizedBox(height: 16),
          _ModulePlaceholder(
            icon: Icons.dashboard_customize_outlined,
            title: 'Dashboard modules',
            subtitle: 'Additional mobile dashboard modules are coming next.',
          ),
        ],
      ),
    );
  }
}

class _ModulePlaceholder extends StatelessWidget {
  const _ModulePlaceholder({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF2563EB), size: 26),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF1F2937),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Color(0xFF6B7280),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HomeLoadingCard extends StatelessWidget {
  const _HomeLoadingCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 220,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF2DD4BF),
          width: 2,
        ),
      ),
      child: const Center(
        child: CircularProgressIndicator(
          color: Color(0xFF2DD4BF),
        ),
      ),
    );
  }
}

class _HomeErrorCard extends StatelessWidget {
  const _HomeErrorCard({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Column(
        children: [
          const Icon(
            Icons.cloud_off_rounded,
            color: Color(0xFFB91C1C),
            size: 38,
          ),
          const SizedBox(height: 10),
          const Text(
            'We could not load your dashboard.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFF991B1B),
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF6B7280),
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Try again'),
          ),
        ],
      ),
    );
  }
}

class _MobileBottomNavigation extends StatelessWidget {
  const _MobileBottomNavigation();

  @override
  Widget build(BuildContext context) {
    return BottomAppBar(
      color: Colors.white,
      elevation: 8,
      padding: EdgeInsets.zero,
      child: SizedBox(
        height: 64,
        child: Row(
          children: [
            _NavigationItem(
              icon: Icons.home_rounded,
              label: 'Home',
              active: true,
              activeColor: const Color(0xFF2563EB),
              onTap: () {},
            ),
            _NavigationItem(
              icon: Icons.check_box_outlined,
              label: 'Tasks',
              activeColor: const Color(0xFF16A34A),
              onTap: () => context.push('/daily-tasks'),
            ),
            _NavigationItem(
              icon: Icons.attach_money_rounded,
              label: 'Money',
              activeColor: const Color(0xFF2563EB),
              onTap: () => _showUnavailable(context),
            ),
            _NavigationItem(
              icon: Icons.favorite_outline_rounded,
              label: 'Mood',
              activeColor: const Color(0xFF9333EA),
              onTap: () => _showUnavailable(context),
            ),
            _NavigationItem(
              icon: Icons.menu_rounded,
              label: 'More',
              activeColor: const Color(0xFF111827),
              onTap: () => Scaffold.of(context).openDrawer(),
            ),
          ],
        ),
      ),
    );
  }

  void _showUnavailable(BuildContext context) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        const SnackBar(
          content: Text('This mobile dashboard section is coming next.'),
        ),
      );
  }
}

class _NavigationItem extends StatelessWidget {
  const _NavigationItem({
    required this.icon,
    required this.label,
    required this.activeColor,
    required this.onTap,
    this.active = false,
  });

  final IconData icon;
  final String label;
  final Color activeColor;
  final VoidCallback onTap;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 3, vertical: 5),
          decoration: BoxDecoration(
            color: active ? activeColor.withOpacity(0.12) : null,
            borderRadius: BorderRadius.circular(9),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 22,
                color: active ? activeColor : const Color(0xFF4B5563),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  color: active ? activeColor : const Color(0xFF4B5563),
                  fontSize: 11,
                  fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HomeDrawer extends StatelessWidget {
  const _HomeDrawer();

  @override
  Widget build(BuildContext context) {
    final isLoggingOut = context.select<AuthBloc, bool>(
      (state) => state is AuthLoading,
    );

    return Drawer(
      child: SafeArea(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Color(0xFF2563EB),
                    Color(0xFF7C3AED),
                  ],
                ),
              ),
              child: const Align(
                alignment: Alignment.bottomLeft,
                child: Text(
                  'Quick Access to All Features',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            const _DrawerItem(
              icon: Icons.home_rounded,
              label: 'Dashboard',
              active: true,
            ),
            _DrawerItem(
              icon: Icons.check_box_outlined,
              label: 'Daily Tasks',
              onTap: () {
                Navigator.of(context).pop();
                context.push('/daily-tasks');
              },
            ),
            _DrawerItem(
              icon: Icons.notifications_none_rounded,
              label: 'Notifications',
              onTap: () {
                Navigator.of(context).pop();
                context.push('/notifications');
              },
            ),
            _DrawerItem(
              icon: Icons.attach_money_rounded,
              label: 'Financial',
              onTap: () => _showUnavailable(context),
            ),
            _DrawerItem(
              icon: Icons.favorite_outline_rounded,
              label: 'Mood Check-ins',
              onTap: () => _showUnavailable(context),
            ),
            _DrawerItem(
              icon: Icons.calendar_month_outlined,
              label: 'Calendar',
              onTap: () => _showUnavailable(context),
            ),
            _DrawerItem(
              icon: Icons.medical_services_outlined,
              label: 'Health Records',
              onTap: () => _showUnavailable(context),
            ),
            _DrawerItem(
              icon: Icons.support_agent_rounded,
              label: 'Support',
              onTap: () => _showUnavailable(context),
            ),
            const Divider(height: 24),
            _DrawerItem(
              icon: Icons.logout_rounded,
              label: isLoggingOut ? 'Logging out…' : 'Log out',
              onTap: isLoggingOut
                  ? null
                  : () {
                      Navigator.of(context).pop();
                      context.read<AuthBloc>().add(
                            const LogoutRequested(),
                          );
                    },
            ),
          ],
        ),
      ),
    );
  }

  void _showUnavailable(BuildContext context) {
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('This mobile dashboard section is coming next.'),
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  const _DrawerItem({
    required this.icon,
    required this.label,
    this.active = false,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(
        icon,
        color: active ? const Color(0xFF2563EB) : const Color(0xFF4B5563),
      ),
      title: Text(
        label,
        style: TextStyle(
          color: active ? const Color(0xFF2563EB) : const Color(0xFF1F2937),
          fontWeight: active ? FontWeight.w700 : FontWeight.w500,
        ),
      ),
      selected: active,
      selectedTileColor: const Color(0xFFEFF6FF),
      onTap: onTap,
    );
  }
}