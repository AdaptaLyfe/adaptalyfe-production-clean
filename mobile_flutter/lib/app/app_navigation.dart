import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/bloc/auth_bloc.dart';
import '../features/auth/bloc/auth_event.dart';

/// App-wide navigation chrome for authenticated screens.
///
/// The route table remains the single source of truth for destinations. This
/// shell only renders the shared drawer/bottom navigation and delegates
/// navigation back to GoRouter.
class AppNavigationShell extends StatelessWidget {
  const AppNavigationShell({
    required this.location,
    required this.child,
    super.key,
  });

  final String location;
  final Widget child;

  static const _authPaths = {'/splash', '/login', '/signup'};

  @override
  Widget build(BuildContext context) {
    if (_authPaths.contains(location)) return child;

    return Scaffold(
      drawer: AppNavigationDrawer(location: location),
      body: child,
      bottomNavigationBar: AppBottomNavigation(location: location),
    );
  }
}

class AppBottomNavigation extends StatelessWidget {
  const AppBottomNavigation({
    required this.location,
    super.key,
  });

  final String location;

  static const _primaryItems = [
    _NavigationDestination(
      label: 'Home',
      route: '/home',
      icon: Icons.home_outlined,
      selectedIcon: Icons.home_rounded,
      color: Color(0xFF2563EB),
    ),
    _NavigationDestination(
      label: 'Tasks',
      route: '/daily-tasks',
      icon: Icons.check_box_outlined,
      selectedIcon: Icons.check_box_rounded,
      color: Color(0xFF16A34A),
    ),
    _NavigationDestination(
      label: 'Money',
      route: '/financial',
      icon: Icons.attach_money_rounded,
      selectedIcon: Icons.attach_money_rounded,
      color: Color(0xFF2563EB),
    ),
    _NavigationDestination(
      label: 'Mood',
      route: '/mood-tracking',
      icon: Icons.favorite_outline_rounded,
      selectedIcon: Icons.favorite_rounded,
      color: Color(0xFF9333EA),
    ),
  ];

  int get _selectedIndex {
    final primaryIndex = _primaryItems.indexWhere(
      (item) => location == item.route || location.startsWith('${item.route}/'),
    );
    return primaryIndex == -1 ? _primaryItems.length : primaryIndex;
  }

  @override
  Widget build(BuildContext context) {
    return NavigationBar(
      selectedIndex: _selectedIndex,
      onDestinationSelected: (index) {
        if (index == _primaryItems.length) {
          _showMoreMenu(context);
          return;
        }
        context.go(_primaryItems[index].route);
      },
      destinations: [
        ..._primaryItems.map(
          (item) => NavigationDestination(
            icon: Icon(item.icon),
            selectedIcon: Icon(item.selectedIcon, color: item.color),
            label: item.label,
          ),
        ),
        const NavigationDestination(
          icon: Icon(Icons.menu_rounded),
          selectedIcon: Icon(Icons.menu_open_rounded),
          label: 'More',
        ),
      ],
    );
  }

  Future<void> _showMoreMenu(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              GridView.count(
                shrinkWrap: true,
                crossAxisCount: 3,
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1.05,
                children: _moreDestinations
                    .map(
                      (item) => _MoreNavigationTile(
                        item: item,
                        active: location == item.route ||
                            location.startsWith('${item.route}/'),
                        onTap: () {
                          Navigator.of(sheetContext).pop();
                          context.go(item.route);
                        },
                      ),
                    )
                    .toList(),
              ),
              _MoreMenuFooter(
                onOpenMenu: () {
                  Navigator.of(sheetContext).pop();
                  Scaffold.of(context).openDrawer();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Kept as a separate action so the full drawer (including global logout)
  // remains reachable from every authenticated route.
}

class _MoreMenuFooter extends StatelessWidget {
  const _MoreMenuFooter({required this.onOpenMenu});

  final VoidCallback onOpenMenu;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: OutlinedButton.icon(
        onPressed: onOpenMenu,
        icon: const Icon(Icons.menu_open_rounded),
        label: const Text('Open full menu and account actions'),
      ),
    );
  }
}

class AppNavigationDrawer extends StatelessWidget {
  const AppNavigationDrawer({
    required this.location,
    super.key,
  });

  final String location;

  static const _items = [
    _NavigationDestination(
      label: 'Home',
      route: '/home',
      icon: Icons.home_outlined,
      selectedIcon: Icons.home_rounded,
    ),
    _NavigationDestination(
      label: 'Daily Tasks',
      route: '/daily-tasks',
      icon: Icons.check_box_outlined,
      selectedIcon: Icons.check_box_rounded,
    ),
    _NavigationDestination(
      label: 'Financial',
      route: '/financial',
      icon: Icons.attach_money_rounded,
      selectedIcon: Icons.attach_money_rounded,
    ),
    _NavigationDestination(
      label: 'Mood Tracking',
      route: '/mood-tracking',
      icon: Icons.favorite_outline_rounded,
      selectedIcon: Icons.favorite_rounded,
    ),
    _NavigationDestination(
      label: 'Notifications',
      route: '/notifications',
      icon: Icons.notifications_none_rounded,
      selectedIcon: Icons.notifications_rounded,
    ),
    _NavigationDestination(
      label: 'Medical Records',
      route: '/medical',
      icon: Icons.medical_services_outlined,
      selectedIcon: Icons.medical_services_rounded,
    ),
    _NavigationDestination(
      label: 'Meals & Shopping',
      route: '/meal-shopping',
      icon: Icons.restaurant_menu_outlined,
      selectedIcon: Icons.restaurant_menu_rounded,
    ),
    _NavigationDestination(
      label: 'Academic Planner',
      route: '/academic-planner',
      icon: Icons.school_outlined,
      selectedIcon: Icons.school_rounded,
    ),
    _NavigationDestination(
      label: 'Calendar',
      route: '/calendar',
      icon: Icons.calendar_month_outlined,
      selectedIcon: Icons.calendar_month_rounded,
    ),
    _NavigationDestination(
      label: 'Sleep Tracking',
      route: '/sleep-tracking',
      icon: Icons.bedtime_outlined,
      selectedIcon: Icons.bedtime_rounded,
    ),
    _NavigationDestination(
      label: 'Resources',
      route: '/resources',
      icon: Icons.menu_book_outlined,
      selectedIcon: Icons.menu_book_rounded,
    ),
    _NavigationDestination(
      label: 'Rewards & Points',
      route: '/rewards',
      icon: Icons.emoji_events_outlined,
      selectedIcon: Icons.emoji_events_rounded,
    ),
    _NavigationDestination(
      label: 'Subscription',
      route: '/subscription',
      icon: Icons.workspace_premium_outlined,
      selectedIcon: Icons.workspace_premium_rounded,
    ),
    _NavigationDestination(
      label: 'Settings',
      route: '/settings',
      icon: Icons.settings_outlined,
      selectedIcon: Icons.settings_rounded,
    ),
    _NavigationDestination(
      label: 'Caregiver Setup',
      route: '/caregiver-setup',
      icon: Icons.volunteer_activism_outlined,
      selectedIcon: Icons.volunteer_activism_rounded,
    ),
    _NavigationDestination(
      label: 'Caregiver Dashboard',
      route: '/caregiver-dashboard',
      icon: Icons.people_alt_outlined,
      selectedIcon: Icons.people_alt_rounded,
    ),
    _NavigationDestination(
      label: 'Accept Invitation',
      route: '/accept-invitation',
      icon: Icons.key_outlined,
      selectedIcon: Icons.key_rounded,
    ),
  ];

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
            const DrawerHeader(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF2563EB), Color(0xFF7C3AED)],
                ),
              ),
              child: Align(
                alignment: Alignment.bottomLeft,
                child: Text(
                  'Adaptalyfe',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
            ..._items.map(
              (item) => ListTile(
                leading: Icon(
                  location == item.route
                      ? item.selectedIcon
                      : item.icon,
                  color: location == item.route
                      ? const Color(0xFF2563EB)
                      : const Color(0xFF4B5563),
                ),
                title: Text(item.label),
                selected: location == item.route,
                selectedTileColor: const Color(0xFFEFF6FF),
                onTap: () {
                  Navigator.of(context).pop();
                  context.go(item.route);
                },
              ),
            ),
            const Divider(height: 24),
            ListTile(
              leading: const Icon(Icons.logout_rounded),
              title: Text(isLoggingOut ? 'Logging out…' : 'Log out'),
              enabled: !isLoggingOut,
              onTap: isLoggingOut
                  ? null
                  : () {
                      Navigator.of(context).pop();
                      context
                          .read<AuthBloc>()
                          .add(const LogoutRequested());
                    },
            ),
          ],
        ),
      ),
    );
  }
}

class _MoreNavigationTile extends StatelessWidget {
  const _MoreNavigationTile({
    required this.item,
    required this.active,
    required this.onTap,
  });

  final _NavigationDestination item;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = active ? const Color(0xFF2563EB) : const Color(0xFF4B5563);
    return Material(
      color: active ? const Color(0xFFEFF6FF) : const Color(0xFFF9FAFB),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(active ? item.selectedIcon : item.icon, color: color),
              const SizedBox(height: 5),
              Text(
                item.label,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: color,
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

class _NavigationDestination {
  const _NavigationDestination({
    required this.label,
    required this.route,
    required this.icon,
    required this.selectedIcon,
    this.color,
  });

  final String label;
  final String route;
  final IconData icon;
  final IconData selectedIcon;
  final Color? color;
}

const _moreDestinations = [
  _NavigationDestination(
    label: 'Meals',
    route: '/meal-shopping',
    icon: Icons.restaurant_menu_outlined,
    selectedIcon: Icons.restaurant_menu_rounded,
  ),
  _NavigationDestination(
    label: 'Calendar',
    route: '/calendar',
    icon: Icons.calendar_month_outlined,
    selectedIcon: Icons.calendar_month_rounded,
  ),
  _NavigationDestination(
    label: 'Medical',
    route: '/medical',
    icon: Icons.medical_services_outlined,
    selectedIcon: Icons.medical_services_rounded,
  ),
  _NavigationDestination(
    label: 'Academic',
    route: '/academic-planner',
    icon: Icons.school_outlined,
    selectedIcon: Icons.school_rounded,
  ),
  _NavigationDestination(
    label: 'Sleep',
    route: '/sleep-tracking',
    icon: Icons.bedtime_outlined,
    selectedIcon: Icons.bedtime_rounded,
  ),
  _NavigationDestination(
    label: 'Resources',
    route: '/resources',
    icon: Icons.menu_book_outlined,
    selectedIcon: Icons.menu_book_rounded,
  ),
  _NavigationDestination(
    label: 'Rewards',
    route: '/rewards',
    icon: Icons.emoji_events_outlined,
    selectedIcon: Icons.emoji_events_rounded,
  ),
  _NavigationDestination(
    label: 'Caregiver',
    route: '/caregiver-dashboard',
    icon: Icons.people_alt_outlined,
    selectedIcon: Icons.people_alt_rounded,
  ),
  _NavigationDestination(
    label: 'Subscription',
    route: '/subscription',
    icon: Icons.workspace_premium_outlined,
    selectedIcon: Icons.workspace_premium_rounded,
  ),
  _NavigationDestination(
    label: 'Settings',
    route: '/settings',
    icon: Icons.settings_outlined,
    selectedIcon: Icons.settings_rounded,
  ),
];