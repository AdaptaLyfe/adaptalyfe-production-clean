import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../app/app_route_observer.dart';
import '../../../core/layout/responsive.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../../auth/bloc/auth_state.dart';
import '../../calendar/bloc/calendar_bloc.dart';
import '../../calendar/bloc/calendar_event.dart';
import '../../daily_tasks/bloc/daily_tasks_bloc.dart';
import '../../daily_tasks/bloc/daily_tasks_event.dart';
import '../../financial/bloc/financial_bloc.dart';
import '../../financial/bloc/financial_event.dart';
import '../../medical/bloc/medical_bloc.dart';
import '../../medical/bloc/medical_event.dart';
import '../../mood/bloc/mood_bloc.dart';
import '../../mood/bloc/mood_event.dart';
import '../../rewards/bloc/rewards_bloc.dart';
import '../../rewards/bloc/rewards_event.dart';
import '../../caregiver/bloc/caregiver_bloc.dart';
import '../../caregiver/bloc/caregiver_event.dart';
import '../../subscription/bloc/subscription_bloc.dart';
import '../../subscription/bloc/subscription_event.dart';
import '../bloc/home_bloc.dart';
import '../bloc/home_event.dart';
import '../bloc/home_state.dart';
import 'home_dashboard_widgets.dart';
import 'home_extended_widgets.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with RouteAware {
  ModalRoute<void>? _route;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final route = ModalRoute.of(context);
    if (route != null && route != _route) {
      if (_route != null) {
        appRouteObserver.unsubscribe(this);
      }
      _route = route;
      appRouteObserver.subscribe(this, route);
    }
  }

  @override
  void dispose() {
    appRouteObserver.unsubscribe(this);
    super.dispose();
  }

  @override
  void didPopNext() {
    if (mounted) {
      context.read<HomeBloc>().add(const RefreshHome());
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<HomeBloc, HomeState>(
      listener: (context, state) {
        if (state is HomeLoaded &&
            state.chatActionStatus == HomeChatActionStatus.completed) {
          _refreshFeatureBlocs(context, state.user.id);
        }
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
              builder: (_) => BlocProvider.value(
                value: context.read<HomeBloc>(),
                child: const HomeChatSheet(),
              ),
            ),
            backgroundColor: const Color(0xFF059669),
            foregroundColor: Colors.white,
            icon: const Icon(Icons.auto_awesome_rounded),
             label: Text(AppResponsive.isCompact(context) ? 'AI' : 'AdaptAI'),
          ),
          floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
        );
      },
    );
  }

  Future<void> _refreshDashboard(BuildContext context) async {
    final homeBloc = context.read<HomeBloc>();
    homeBloc.add(const RefreshHome());
    final homeState = homeBloc.state;
    final userId = homeState is HomeLoaded ? homeState.user.id : null;
    _refreshFeatureBlocs(context, userId);

    await homeBloc.stream.firstWhere(
      (nextState) => nextState is HomeLoaded || nextState is HomeError,
    );
  }

  void _refreshFeatureBlocs(BuildContext context, int? userId) {
    context.read<DailyTasksBloc>().add(const RefreshDailyTasks());
    context.read<MoodBloc>().add(const RefreshMood());
    context.read<FinancialBloc>().add(const RefreshFinancial());
    context.read<CalendarBloc>().add(const RefreshCalendar());
    context.read<SubscriptionBloc>().add(const RefreshSubscription());
    context.read<MedicalBloc>().add(const RefreshMedical());
    context.read<RewardsBloc>().add(const RefreshRewards());
    if (userId != null) {
      context
          .read<CaregiverBloc>()
          .add(CaregiverStarted(userId));
    }
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
      automaticallyImplyLeading: false,
      titleSpacing: 14,
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
           const Flexible(
             child: Text(
               'AdaptaLyfe',
               overflow: TextOverflow.ellipsis,
               style: TextStyle(
                 fontSize: 20,
                 fontWeight: FontWeight.w700,
               ),
            ),
          ),
        ],
      ),
      actions: [
        Container(
          margin: const EdgeInsets.only(right: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFF3F4F6),
            borderRadius: BorderRadius.circular(12),
          ),
          child: IconButton(
            tooltip: 'Open menu',
            onPressed: () {
              context.findRootAncestorStateOfType<ScaffoldState>()?.openDrawer();
            },
            icon: const Icon(Icons.menu_rounded),
          ),
        ),
      ],
    );
  }
}