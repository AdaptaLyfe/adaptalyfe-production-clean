import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../core/layout/responsive.dart';
import '../features/auth/bloc/auth_bloc.dart';
import '../features/auth/bloc/auth_event.dart';
import '../features/auth/bloc/auth_state.dart';

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

class AppBottomNavigation extends StatefulWidget {
  const AppBottomNavigation({
    required this.location,
    super.key,
  });

  final String location;

  @override
  State<AppBottomNavigation> createState() => _AppBottomNavigationState();
}

class _AppBottomNavigationState extends State<AppBottomNavigation> {
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
      (item) =>
          widget.location == item.route ||
          widget.location.startsWith('${item.route}/'),
    );
    return primaryIndex == -1 ? _primaryItems.length : primaryIndex;
  }

  bool _isRouteActive(String location, String route) {
    return route.isNotEmpty &&
        (location == route || location.startsWith('$route/'));
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    return Material(
      color: Colors.white,
      elevation: 8,
      child: Padding(
        padding: EdgeInsets.only(bottom: bottomInset),
        child: SizedBox(
          height: 56,
          child: Row(
            children: [
              ..._primaryItems.map(
                (item) => Expanded(
                  child: _BottomNavigationButton(
                    item: item,
                    active: _selectedIndex == _primaryItems.indexOf(item),
                    onTap: () => context.go(item.route),
                  ),
                ),
              ),
              Expanded(
                child: _BottomNavigationButton(
                  item: const _NavigationDestination(
                    label: 'More',
                    route: '',
                    icon: Icons.menu_rounded,
                    selectedIcon: Icons.menu_rounded,
                    color: Color(0xFF111827),
                  ),
                  active: _selectedIndex == _primaryItems.length,
                  onTap: () => _showMoreMenu(context),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _showMoreMenu(BuildContext context) {
    return showGeneralDialog<void>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Close More menu',
      barrierColor: const Color(0x66000000),
      transitionDuration: const Duration(milliseconds: 180),
      pageBuilder: (dialogContext, animation, secondaryAnimation) {
        final bottomInset = MediaQuery.paddingOf(dialogContext).bottom;
        return Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: EdgeInsets.fromLTRB(8, 0, 8, 72 + bottomInset),
            child: Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: GridView.count(
                  shrinkWrap: true,
                  crossAxisCount: 2,
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                  childAspectRatio: 2.05,
                  children: _moreDestinations
                      .map(
                        (item) => _MoreNavigationTile(
                          item: item,
                          active: _isRouteActive(widget.location, item.route),
                          onTap: () {
                            Navigator.of(dialogContext).pop();
                            context.go(item.route);
                          },
                        ),
                      )
                      .toList(),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class AppNavigationDrawer extends StatelessWidget {
  const AppNavigationDrawer({
    required this.location,
    super.key,
  });

  final String location;

  static const _coreItems = [
    _DrawerDestination(
      label: 'Dashboard',
      route: '/home',
      icon: Icons.home_outlined,
      color: Color(0xFF2563EB),
    ),
    _DrawerDestination(
      label: 'Daily Tasks',
      route: '/daily-tasks',
      icon: Icons.check_box_outlined,
      color: Color(0xFF16A34A),
    ),
    _DrawerDestination(
      label: 'Financial',
      route: '/financial',
      icon: Icons.attach_money_rounded,
      color: Color(0xFF16A34A),
    ),
    _DrawerDestination(
      label: 'Mood Check-ins',
      route: '/mood-tracking',
      icon: Icons.psychology_outlined,
      color: Color(0xFF9333EA),
    ),
    _DrawerDestination(
      label: 'Sleep Routine',
      route: '/sleep-tracking',
      icon: Icons.nightlight_outlined,
      color: Color(0xFF4F46E5),
    ),
    _DrawerDestination(
      label: 'Health Records',
      route: '/medical',
      icon: Icons.medical_services_outlined,
      color: Color(0xFF2563EB),
    ),
    _DrawerDestination(
      label: 'Medication List',
      route: '/pharmacy',
      icon: Icons.medication_outlined,
      color: Color(0xFFDB2777),
    ),
    _DrawerDestination(
      label: 'Meals & Shopping',
      route: '/meal-shopping',
      icon: Icons.shopping_cart_outlined,
      color: Color(0xFFEA580C),
    ),
    _DrawerDestination(
      label: 'Calendar',
      route: '/calendar',
      icon: Icons.calendar_month_outlined,
      color: Color(0xFF4F46E5),
    ),
    _DrawerDestination(
      label: 'Student Planner',
      route: '/academic-planner',
      icon: Icons.school_outlined,
      color: Color(0xFF9333EA),
    ),
    _DrawerDestination(
      label: 'Life Skills',
      route: '/skills-milestones',
      icon: Icons.track_changes_outlined,
      color: Color(0xFF2563EB),
    ),
    _DrawerDestination(
      label: 'Personal Documents',
      route: '/personal-documents',
      icon: Icons.description_outlined,
      color: Color(0xFF2563EB),
    ),
    _DrawerDestination(
      label: 'Support Network',
      route: '/caregiver',
      icon: Icons.person_outline_rounded,
      color: Color(0xFF0F766E),
    ),
    _DrawerDestination(
      label: '🔐 Caregiver Dashboard',
      route: '/caregiver-dashboard',
      icon: Icons.shield_outlined,
      color: Color(0xFFDC2626),
    ),
    _DrawerDestination(
      label: '🎯 Caregiver Setup',
      route: '/caregiver-setup',
      icon: Icons.person_add_alt_outlined,
      color: Color(0xFF9333EA),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final isLoggingOut = authState is AuthLoading;
    final user = authState is Authenticated ? authState.user : null;
    final displayName = user?.name?.trim().isNotEmpty == true
        ? user!.name!.trim()
        : user?.username ?? 'Loading...';
    final email = user?.email?.trim() ?? '';

    return Drawer(
      width: AppResponsive.isMediumOrWider(context)
          ? AppResponsive.dialogWidth(context, maxWidth: 420, horizontalGutter: 0)
          : AppResponsive.width(context) * .88,
      child: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                children: [
                  const Padding(
                    padding: EdgeInsets.only(bottom: 10),
                    child: Text(
                      'Quick Access to All Features',
                      style: TextStyle(
                        color: Color(0xFF374151),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _coreItems.length,
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: AppResponsive.gridColumnsForWidth(
                        AppResponsive.isMediumOrWider(context)
                            ? AppResponsive.dialogWidth(
                                context,
                                maxWidth: 420,
                                horizontalGutter: 0,
                              ) -
                                32
                            : (AppResponsive.width(context) * .88) - 32,
                        minimumItemWidth: 145,
                        compactColumns: 1,
                        mediumColumns: 2,
                        wideColumns: 2,
                      ),
                      mainAxisSpacing: 4,
                      crossAxisSpacing: 8,
                      mainAxisExtent: 48,
                    ),
                    itemBuilder: (context, index) {
                      final item = _coreItems[index];
                      return _DrawerGridItem(
                        item: item,
                        active: _isActive(item.route),
                        onTap: () => _openItem(context, item),
                      );
                    },
                  ),
                  const SizedBox(height: 4),
                  _DrawerWideItem(
                    item: const _DrawerDestination(
                      label: 'Resources',
                      route: '/resources',
                      icon: Icons.language_outlined,
                      color: Color(0xFFEA580C),
                    ),
                    active: _isActive('/resources'),
                    onTap: () => _openItem(
                      context,
                      const _DrawerDestination(
                        label: 'Resources',
                        route: '/resources',
                        icon: Icons.language_outlined,
                        color: Color(0xFFEA580C),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  _DrawerWideItem(
                    item: const _DrawerDestination(
                      label: '🏆 Rewards',
                      route: '/rewards',
                      icon: Icons.emoji_events_outlined,
                      color: Color(0xFFCA8A04),
                    ),
                    active: _isActive('/rewards'),
                    highlighted: true,
                    onTap: () => _openItem(
                      context,
                      const _DrawerDestination(
                        label: '🏆 Rewards',
                        route: '/rewards',
                        icon: Icons.emoji_events_outlined,
                        color: Color(0xFFCA8A04),
                      ),
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Divider(height: 1),
                  ),
                  _DrawerWideItem(
                    item: const _DrawerDestination(
                      label: 'Emergency Contacts',
                      route: '/resources',
                      icon: Icons.warning_amber_rounded,
                      color: Colors.white,
                    ),
                    background: const Color(0xFFDC2626),
                    foreground: Colors.white,
                    onTap: () => _openItem(
                      context,
                      const _DrawerDestination(
                        label: 'Emergency Contacts',
                        route: '/resources',
                        icon: Icons.warning_amber_rounded,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: _DrawerWideItem(
                          item: const _DrawerDestination(
                            label: 'Settings',
                            route: '/settings',
                            icon: Icons.settings_outlined,
                            color: Color(0xFF4B5563),
                          ),
                          active: _isActive('/settings'),
                          onTap: () => _openItem(
                            context,
                            const _DrawerDestination(
                              label: 'Settings',
                              route: '/settings',
                              icon: Icons.settings_outlined,
                              color: Color(0xFF4B5563),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _DrawerWideItem(
                          item: const _DrawerDestination(
                            label: 'Features',
                            icon: Icons.bolt_outlined,
                            color: Color(0xFF2563EB),
                          ),
                          background: const Color(0xFFEFF6FF),
                          borderColor: const Color(0xFFBFDBFE),
                          foreground: const Color(0xFF1D4ED8),
                          onTap: () => _showUnavailableFeature(context),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  _DrawerUserFooter(
                    displayName: displayName,
                    email: email,
                  ),
                  const SizedBox(height: 12),
                  Material(
                    color: const Color(0xFFFFF1F2),
                    borderRadius: BorderRadius.circular(8),
                    child: InkWell(
                      onTap: isLoggingOut
                          ? null
                          : () {
                              Navigator.of(context).pop();
                              context
                                  .read<AuthBloc>()
                                  .add(const LogoutRequested());
                            },
                      borderRadius: BorderRadius.circular(8),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 12,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.logout_rounded,
                              size: 17,
                              color: isLoggingOut
                                  ? const Color(0xFF9CA3AF)
                                  : const Color(0xFFB91C1C),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              isLoggingOut ? 'Logging out…' : 'Logout',
                              style: TextStyle(
                                color: isLoggingOut
                                    ? const Color(0xFF9CA3AF)
                                    : const Color(0xFFB91C1C),
                                fontSize: 13,
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
            ),
          ],
        ),
      ),
    );
  }

  bool _isActive(String? route) {
    return route != null &&
        (location == route || location.startsWith('$route/'));
  }

  void _openItem(BuildContext context, _DrawerDestination item) {
    if (item.route == null) {
      _showUnavailableFeature(context);
      return;
    }
    Navigator.of(context).pop();
    context.go(item.route!);
  }

  void _showUnavailableFeature(BuildContext context) {
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('This feature is not available in the Flutter app yet.'),
      ),
    );
  }
}

class _DrawerUserFooter extends StatelessWidget {
  const _DrawerUserFooter({
    required this.displayName,
    required this.email,
  });

  final String displayName;
  final String email;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [Color(0xFF2563EB), Color(0xFF9333EA)],
              ),
            ),
            child: const Icon(
              Icons.person_rounded,
              color: Colors.white,
              size: 16,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  displayName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF1F2937),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (email.isNotEmpty)
                  Text(
                    email,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 11,
                    ),
                  ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFF3E8FF),
              borderRadius: BorderRadius.circular(999),
            ),
            child: const Text(
              'Demo',
              style: TextStyle(
                color: Color(0xFF9333EA),
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DrawerGridItem extends StatelessWidget {
  const _DrawerGridItem({
    required this.item,
    required this.active,
    required this.onTap,
  });

  final _DrawerDestination item;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = item.color;
    return Material(
      color: active ? const Color(0xFFEFF6FF) : Colors.transparent,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            children: [
              Icon(item.icon, color: color, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  item.label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: const Color(0xFF374151),
                    fontSize: 11,
                    fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DrawerWideItem extends StatelessWidget {
  const _DrawerWideItem({
    required this.item,
    required this.onTap,
    this.active = false,
    this.highlighted = false,
    this.background = Colors.white,
    this.foreground = const Color(0xFF374151),
    this.borderColor = const Color(0xFFE5E7EB),
  });

  final _DrawerDestination item;
  final VoidCallback onTap;
  final bool active;
  final bool highlighted;
  final Color background;
  final Color foreground;
  final Color borderColor;

  @override
  Widget build(BuildContext context) {
    final iconColor = foreground == Colors.white ? Colors.white : item.color;
    return Material(
      color: background,
      borderRadius: BorderRadius.circular(12),
      child: Ink(
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: highlighted
                ? const Color(0xFFFDE68A)
                : active
                    ? item.color
                    : borderColor,
          ),
          gradient: highlighted
              ? const LinearGradient(
                  colors: [Color(0xFFFEF3C7), Color(0xFFFFEDD5)],
                )
              : null,
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                Icon(item.icon, color: iconColor, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    item.label,
                    style: TextStyle(
                      color: foreground,
                      fontSize: 12,
                      fontWeight: highlighted || active
                          ? FontWeight.w700
                          : FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DrawerDestination {
  const _DrawerDestination({
    required this.label,
    required this.icon,
    required this.color,
    this.route,
  });

  final String label;
  final String? route;
  final IconData icon;
  final Color color;
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

class _BottomNavigationButton extends StatelessWidget {
  const _BottomNavigationButton({
    required this.item,
    required this.active,
    required this.onTap,
  });

  final _NavigationDestination item;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = active ? item.color ?? const Color(0xFF2563EB) : const Color(0xFF6B7280);
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(active ? item.selectedIcon : item.icon, color: color, size: 21),
            const SizedBox(height: 2),
            Text(
              item.label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: color,
                fontSize: 10,
                fontWeight: active ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ],
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
    label: 'Skills',
    route: '/skills-milestones',
    icon: Icons.track_changes_outlined,
    selectedIcon: Icons.track_changes_rounded,
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