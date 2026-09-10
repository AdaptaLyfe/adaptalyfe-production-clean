import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../../auth/bloc/auth_state.dart';
import '../../calendar/bloc/calendar_bloc.dart';
import '../../calendar/bloc/calendar_event.dart';
import '../../daily_tasks/bloc/daily_tasks_bloc.dart';
import '../../daily_tasks/bloc/daily_tasks_event.dart';
import '../../financial/bloc/financial_bloc.dart';
import '../../financial/bloc/financial_event.dart';
import '../../mood/bloc/mood_bloc.dart';
import '../../mood/bloc/mood_event.dart';
import '../../subscription/bloc/subscription_bloc.dart';
import '../../subscription/bloc/subscription_event.dart';
import '../bloc/home_bloc.dart';
import '../bloc/home_event.dart';
import '../bloc/home_state.dart';
import 'home_dashboard_widgets.dart';
import 'home_extended_widgets.dart';

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
          body: HomeDashboardBody(
            homeState: state,
            onRefresh: () => _refreshDashboard(context),
          ),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () => showModalBottomSheet<void>(
              context: context,
              isScrollControlled: true,
              showDragHandle: true,
              builder: (_) => const HomeChatSheet(),
            ),
            backgroundColor: const Color(0xFF059669),
            foregroundColor: Colors.white,
            icon: const Icon(Icons.auto_awesome_rounded),
            label: const Text('AdaptAI'),
          ),
          floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
        );
      },
    );
  }

  Future<void> _refreshDashboard(BuildContext context) async {
    final homeBloc = context.read<HomeBloc>();
    homeBloc.add(const RefreshHome());
    context.read<DailyTasksBloc>().add(const RefreshDailyTasks());
    context.read<MoodBloc>().add(const RefreshMood());
    context.read<FinancialBloc>().add(const RefreshFinancial());
    context.read<CalendarBloc>().add(const RefreshCalendar());
    context.read<SubscriptionBloc>().add(const RefreshSubscription());

    await homeBloc.stream.firstWhere(
      (nextState) => nextState is HomeLoaded || nextState is HomeError,
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
      leading: IconButton(
        tooltip: 'Open menu',
        onPressed: () {
          context.findRootAncestorStateOfType<ScaffoldState>()?.openDrawer();
        },
        icon: const Icon(Icons.menu_rounded),
      ),
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
        const SizedBox(width: 4),
      ],
    );
  }
}