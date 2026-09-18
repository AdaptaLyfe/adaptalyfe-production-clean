import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/layout/responsive.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../bloc/resources_bloc.dart';
import '../bloc/resources_event.dart';
import '../bloc/resources_state.dart';
import '../models/resource_models.dart';
import '../../medical/models/medical_models.dart';

class ResourcesScreen extends StatefulWidget {
  const ResourcesScreen({super.key});

  @override
  State<ResourcesScreen> createState() => _ResourcesScreenState();
}

class _ResourcesScreenState extends State<ResourcesScreen> {
  Timer? _breathingTimer;
  bool _breathingActive = false;
  int _breathingPhaseIndex = 0;
  double _breathingProgress = 0;
  int _breathingCycle = 0;

  static const _breathingPhases = ['inhale', 'hold', 'exhale'];

  String get _breathingPhase => _breathingPhases[_breathingPhaseIndex];

  void _startBreathing() {
    if (_breathingActive) return;
    _breathingTimer?.cancel();
    setState(() {
      _breathingActive = true;
      _breathingPhaseIndex = 0;
      _breathingProgress = 0;
      _breathingCycle = 0;
    });
    _breathingTimer = Timer.periodic(const Duration(milliseconds: 100), (_) {
      if (!mounted || !_breathingActive) return;
      setState(() {
        _breathingProgress += 0.025;
        if (_breathingProgress >= 1) {
          _breathingProgress = 0;
          _breathingPhaseIndex =
              (_breathingPhaseIndex + 1) % _breathingPhases.length;
          if (_breathingPhaseIndex == 0) _breathingCycle++;
        }
      });
    });
  }

  void _stopBreathing() {
    _breathingTimer?.cancel();
    _breathingTimer = null;
    if (!mounted) return;
    setState(() {
      _breathingActive = false;
      _breathingPhaseIndex = 0;
      _breathingProgress = 0;
    });
  }

  void _restartBreathing() {
    _stopBreathing();
    Future<void>.delayed(const Duration(milliseconds: 100), () {
      if (mounted) _startBreathing();
    });
  }

  @override
  void dispose() {
    _breathingTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ResourcesBloc, ResourcesState>(
      listener: (context, state) {
        if (state.sessionInvalid) {
          context.read<AuthBloc>().add(const CheckAuthentication());
          return;
        }

        final message = state.actionMessage ?? state.errorMessage;
        if (message == null || message.isEmpty) return;
        final messenger = ScaffoldMessenger.maybeOf(context);
        messenger
          ?..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: state.errorMessage != null
                  ? const Color(0xFFB91C1C)
                  : null,
            ),
          );
      },
      builder: (context, state) => Scaffold(
        appBar: AppBar(
          title: const Text('Resources'),
          actions: [
            IconButton(
              tooltip: 'Refresh resources',
              onPressed: () =>
                  context.read<ResourcesBloc>().add(const RefreshResources()),
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        body: _ResourcesBody(
          state: state,
          breathingActive: _breathingActive,
          breathingPhase: _breathingPhase,
          breathingProgress: _breathingProgress,
          breathingCycle: _breathingCycle,
          onStartBreathing: _startBreathing,
          onStopBreathing: _stopBreathing,
          onRestartBreathing: _restartBreathing,
        ),
      ),
    );
  }
}

class _ResourcesBody extends StatelessWidget {
  const _ResourcesBody({
    required this.state,
    required this.breathingActive,
    required this.breathingPhase,
    required this.breathingProgress,
    required this.breathingCycle,
    required this.onStartBreathing,
    required this.onStopBreathing,
    required this.onRestartBreathing,
  });

  final ResourcesState state;
  final bool breathingActive;
  final String breathingPhase;
  final double breathingProgress;
  final int breathingCycle;
  final VoidCallback onStartBreathing;
  final VoidCallback onStopBreathing;
  final VoidCallback onRestartBreathing;

  @override
  Widget build(BuildContext context) {
    if (state.isLoading && !state.hasResources) {
      return const _ResourcesLoading();
    }

    if (state.status == ResourcesStatus.failure && !state.hasResources) {
      return _ResourcesError(
        message: state.errorMessage ?? 'Unable to load your resources.',
        onRetry: () =>
            context.read<ResourcesBloc>().add(const RefreshResources()),
      );
    }

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
        onRefresh: () => _refreshResources(context),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: AppResponsive.pagePadding(context).copyWith(
            top: 18,
            bottom: 32,
          ),
          children: [
            if (state.isLoading) const LinearProgressIndicator(),
            const _ResourcesIntro(),
            const SizedBox(height: 22),
            _EmergencyContactsSection(state: state),
            const SizedBox(height: 22),
            const _TrustedContactsSection(),
            const SizedBox(height: 22),
            _WellbeingToolsSection(
              breathingActive: breathingActive,
              breathingPhase: breathingPhase,
              breathingProgress: breathingProgress,
              breathingCycle: breathingCycle,
              onStartBreathing: onStartBreathing,
              onStopBreathing: onStopBreathing,
              onRestartBreathing: onRestartBreathing,
            ),
            const SizedBox(height: 22),
            const _EducationalResourcesSection(),
            const SizedBox(height: 22),
            _EmergencyResourcesPanel(state: state),
            const SizedBox(height: 22),
            _PersonalResourcesPanel(state: state),
          ],
        ),
      ),
    );
  }
}

Future<void> _refreshResources(BuildContext context) async {
  final bloc = context.read<ResourcesBloc>();
  final completion = bloc.stream.firstWhere(
    (nextState) =>
        (nextState.status == ResourcesStatus.loaded ||
            nextState.status == ResourcesStatus.failure) &&
        nextState.busyKey == null,
  );
  bloc.add(const RefreshResources());
  await completion;
}

class _ResourcesIntro extends StatelessWidget {
  const _ResourcesIntro();

  @override
  Widget build(BuildContext context) {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Helpful Resources',
          style: TextStyle(
            color: Color(0xFF111827),
            fontSize: 28,
            fontWeight: FontWeight.w800,
          ),
        ),
        SizedBox(height: 8),
        Text(
          'Tools and resources to support your daily wellbeing and personal growth.',
          style: TextStyle(color: Color(0xFF4B5563), fontSize: 16, height: 1.35),
        ),
      ],
    );
  }
}

class _EmergencyContactsSection extends StatelessWidget {
  const _EmergencyContactsSection({required this.state});

  final ResourcesState state;

  @override
  Widget build(BuildContext context) {
    final emergencyContacts = state.emergencyContacts
        .where((contact) => contact.isEmergencyContact && !contact.isPrimary)
        .toList();
    final primaryContacts =
        state.emergencyContacts.where((contact) => contact.isPrimary).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Card(
          color: const Color(0xFFFFF1F2),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: const BorderSide(color: Color(0xFFFECACA)),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded,
                        size: 20, color: Color(0xFF991B1B)),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Emergency Quick Dial',
                        style: TextStyle(
                          color: Color(0xFF991B1B),
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    _StatusPill(
                      label: 'Emergency',
                      color: const Color(0xFFDC2626),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                if (emergencyContacts.isEmpty)
                  Column(
                    children: [
                      const Icon(Icons.warning_amber_rounded,
                          size: 48, color: Color(0xFFF87171)),
                      const SizedBox(height: 8),
                      const Text(
                        'No emergency contacts set up yet',
                        style: TextStyle(color: Color(0xFFB91C1C)),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      FilledButton.icon(
                        onPressed: () => _showEmergencyContactEditor(context),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFFDC2626),
                        ),
                        icon: const Icon(Icons.person_add_alt_1),
                        label: const Text('Add Emergency Contact'),
                      ),
                    ],
                  )
                else
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final columns = constraints.maxWidth >= 620 ? 2 : 1;
                      final width =
                          (constraints.maxWidth - (columns - 1) * 8) / columns;
                      return Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: emergencyContacts
                            .take(4)
                            .map(
                              (contact) => SizedBox(
                                width: width,
                                child: FilledButton(
                                  onPressed: () => _callContact(contact),
                                  style: FilledButton.styleFrom(
                                    minimumSize: const Size.fromHeight(52),
                                    backgroundColor: const Color(0xFFDC2626),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.phone_rounded, size: 18),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              contact.name,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                            Text(
                                              contact.phoneNumber,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                fontSize: 12,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            )
                            .toList(),
                      );
                    },
                  ),
              ],
            ),
          ),
        ),
        if (primaryContacts.isNotEmpty) ...[
          const SizedBox(height: 16),
          _ContactGroup(
            title: 'Primary Contacts',
            icon: Icons.star_rounded,
            iconColor: const Color(0xFFEAB308),
            contacts: primaryContacts,
            state: state,
          ),
        ],
        const SizedBox(height: 16),
        _ContactGroup(
          title: 'All Contacts',
          icon: Icons.phone_rounded,
          contacts: state.emergencyContacts,
          state: state,
          showAddButton: true,
        ),
      ],
    );
  }
}

class _ContactGroup extends StatelessWidget {
  const _ContactGroup({
    required this.title,
    required this.icon,
    required this.contacts,
    required this.state,
    this.iconColor,
    this.showAddButton = false,
  });

  final String title;
  final IconData icon;
  final Color? iconColor;
  final List<EmergencyContactModel> contacts;
  final ResourcesState state;
  final bool showAddButton;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(icon, size: 20, color: iconColor ?? const Color(0xFF374151)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      color: Color(0xFF111827),
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                if (showAddButton)
                  FilledButton.icon(
                    onPressed: () => _showEmergencyContactEditor(context),
                    icon: const Icon(Icons.person_add_alt_1, size: 17),
                    label: const Text('Add Contact'),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            if (contacts.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 18),
                child: Column(
                  children: [
                    Icon(Icons.phone_disabled_outlined,
                        size: 42, color: Color(0xFF9CA3AF)),
                    SizedBox(height: 8),
                    Text('No contacts added yet',
                        style: TextStyle(color: Color(0xFF4B5563))),
                  ],
                ),
              )
            else
              ...contacts.map(
                (contact) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _EmergencyContactRow(contact: contact, state: state),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _EmergencyContactRow extends StatelessWidget {
  const _EmergencyContactRow({required this.contact, required this.state});

  final EmergencyContactModel contact;
  final ResourcesState state;

  @override
  Widget build(BuildContext context) {
    final busy = state.busyKey == 'contact-${contact.id}';
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFE5E7EB)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(_relationshipIcon(contact.relationship),
              color: _relationshipColor(contact.relationship), size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    Text(contact.name,
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    if (contact.isPrimary)
                      const _StatusPill(
                          label: 'Primary', color: Color(0xFF6B7280)),
                    if (contact.isEmergencyContact)
                      const _StatusPill(
                          label: 'Emergency', color: Color(0xFFDC2626)),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  '${contact.relationship ?? 'Contact'} • ${contact.phoneNumber}',
                  style: const TextStyle(
                      color: Color(0xFF4B5563), fontSize: 13),
                ),
                if (contact.email?.isNotEmpty == true)
                  Text(contact.email!,
                      style: const TextStyle(
                          color: Color(0xFF6B7280), fontSize: 13)),
                if (contact.notes?.isNotEmpty == true)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(contact.notes!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            color: Color(0xFF6B7280), fontSize: 12)),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Wrap(
            spacing: 2,
            children: [
              IconButton(
                tooltip: 'Call ${contact.name}',
                onPressed: busy ? null : () => _callContact(contact),
                icon: const Icon(Icons.phone_rounded, color: Color(0xFF16A34A)),
              ),
              IconButton(
                tooltip: 'Edit ${contact.name}',
                onPressed: busy
                    ? null
                    : () => _showEmergencyContactEditor(context, contact: contact),
                icon: const Icon(Icons.edit_outlined),
              ),
              IconButton(
                tooltip: 'Delete ${contact.name}',
                onPressed: busy
                    ? null
                    : () => _confirmDelete(
                          context,
                          title: 'Delete contact?',
                          message:
                              'This will remove "${contact.name}" from your contacts.',
                          onConfirm: () => context
                              .read<ResourcesBloc>()
                              .add(DeleteEmergencyContact(contact.id)),
                        ),
                icon: const Icon(Icons.delete_outline_rounded),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        child: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 11,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

IconData _relationshipIcon(String? relationship) {
  switch (relationship?.toLowerCase()) {
    case 'parent':
    case 'guardian':
      return Icons.favorite_rounded;
    case 'sibling':
      return Icons.group_add_rounded;
    case 'doctor':
    case 'therapist':
      return Icons.shield_outlined;
    case 'crisis_hotline':
    case 'emergency':
      return Icons.warning_amber_rounded;
    default:
      return Icons.phone_rounded;
  }
}

Color _relationshipColor(String? relationship) {
  switch (relationship?.toLowerCase()) {
    case 'parent':
    case 'guardian':
      return const Color(0xFFEF4444);
    case 'sibling':
      return const Color(0xFF3B82F6);
    case 'doctor':
    case 'therapist':
      return const Color(0xFF16A34A);
    case 'crisis_hotline':
    case 'emergency':
      return const Color(0xFFF97316);
    default:
      return const Color(0xFF6B7280);
  }
}

Future<void> _callContact(EmergencyContactModel contact) async {
  final uri = Uri(scheme: 'tel', path: contact.phoneNumber);
  await launchUrl(uri);
}

class _TrustedContactsSection extends StatelessWidget {
  const _TrustedContactsSection();

  @override
  Widget build(BuildContext context) {
    const contacts = [
      ('Crisis Text Line', 'Text HOME to 741741', '24/7', Color(0xFFEF4444)),
      ('National Suicide Prevention Lifeline', 'Call 988', '24/7',
          Color(0xFFDC2626)),
      ('SAMHSA National Helpline', '1-800-662-4357', '24/7', Color(0xFFB91C1C)),
    ];
    return Card(
      color: Colors.white,
      shape: const RoundedRectangleBorder(
        border: Border(top: BorderSide(color: Color(0xFFEF4444), width: 4)),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 15, 16, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Row(
              children: [
                Icon(Icons.phone_rounded, color: Color(0xFFB91C1C)),
                SizedBox(width: 10),
                Text('Trusted Contacts',
                    style: TextStyle(
                        color: Color(0xFFB91C1C),
                        fontSize: 19,
                        fontWeight: FontWeight.w700)),
              ],
            ),
            const SizedBox(height: 10),
            const Text(
              'If you\'re in crisis or having thoughts of self-harm, please reach out for help immediately.',
              style: TextStyle(color: Color(0xFF4B5563), height: 1.35),
            ),
            const SizedBox(height: 14),
            LayoutBuilder(
              builder: (context, constraints) {
                final columns = constraints.maxWidth >= 760
                    ? 3
                    : constraints.maxWidth >= 460
                        ? 2
                        : 1;
                final width =
                    (constraints.maxWidth - (columns - 1) * 10) / columns;
                return Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: contacts
                      .map(
                        (contact) => SizedBox(
                          width: width,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: contact.$4,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(contact.$1,
                                      style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w700)),
                                  const SizedBox(height: 5),
                                  Text(contact.$2,
                                      style: const TextStyle(
                                          color: Colors.white, fontSize: 13)),
                                  const SizedBox(height: 2),
                                  Text(contact.$3,
                                      style: const TextStyle(
                                          color: Colors.white70, fontSize: 12)),
                                ],
                              ),
                            ),
                          ),
                        ),
                      )
                      .toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _WellbeingToolsSection extends StatelessWidget {
  const _WellbeingToolsSection({
    required this.breathingActive,
    required this.breathingPhase,
    required this.breathingProgress,
    required this.breathingCycle,
    required this.onStartBreathing,
    required this.onStopBreathing,
    required this.onRestartBreathing,
  });

  final bool breathingActive;
  final String breathingPhase;
  final double breathingProgress;
  final int breathingCycle;
  final VoidCallback onStartBreathing;
  final VoidCallback onStopBreathing;
  final VoidCallback onRestartBreathing;

  @override
  Widget build(BuildContext context) {
    final breathing = Card(
      color: Colors.white,
      shape: const RoundedRectangleBorder(
        border: Border(top: BorderSide(color: Color(0xFF9333EA), width: 4)),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 15, 14, 18),
        child: Column(
          children: [
            const Row(
              children: [
                Icon(Icons.air_rounded, color: Color(0xFF9333EA)),
                SizedBox(width: 10),
                Text('Breathing Exercise',
                    style:
                        TextStyle(fontSize: 19, fontWeight: FontWeight.w700)),
              ],
            ),
            const SizedBox(height: 20),
            AnimatedContainer(
              duration: const Duration(milliseconds: 900),
              width: breathingPhase == 'exhale' ? 104 : 126,
              height: breathingPhase == 'exhale' ? 104 : 126,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: breathingPhase == 'inhale'
                    ? const Color(0xFFBFDBFE)
                    : breathingPhase == 'hold'
                        ? const Color(0xFFE9D5FF)
                        : const Color(0xFFBBF7D0),
              ),
              alignment: Alignment.center,
              child: Text(
                breathingPhase == 'inhale'
                    ? 'Breathe In'
                    : breathingPhase == 'hold'
                        ? 'Hold'
                        : 'Breathe Out',
                textAlign: TextAlign.center,
                style: const TextStyle(
                    color: Color(0xFF374151),
                    fontSize: 17,
                    fontWeight: FontWeight.w700),
              ),
            ),
            const SizedBox(height: 18),
            LinearProgressIndicator(
              value: breathingActive ? breathingProgress : 0,
              minHeight: 7,
              borderRadius: BorderRadius.circular(8),
              color: const Color(0xFF9333EA),
              backgroundColor: const Color(0xFFEDE9FE),
            ),
            const SizedBox(height: 12),
            Text(
              breathingActive
                  ? 'Cycle ${breathingCycle + 1} • $breathingPhase'
                  : '4-4-4 Breathing Pattern',
              style: const TextStyle(color: Color(0xFF4B5563)),
            ),
            const SizedBox(height: 14),
            Wrap(
              alignment: WrapAlignment.center,
              spacing: 10,
              runSpacing: 8,
              children: [
                if (!breathingActive)
                  FilledButton.icon(
                    onPressed: onStartBreathing,
                    style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF9333EA)),
                    icon: const Icon(Icons.play_arrow_rounded),
                    label: const Text('Start Breathing'),
                  )
                else ...[
                  OutlinedButton.icon(
                    onPressed: onStopBreathing,
                    icon: const Icon(Icons.pause_rounded),
                    label: const Text('Stop'),
                  ),
                  OutlinedButton.icon(
                    onPressed: onRestartBreathing,
                    icon: const Icon(Icons.restart_alt_rounded),
                    label: const Text('Restart'),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );

    final coping = Card(
      color: Colors.white,
      shape: const RoundedRectangleBorder(
        border: Border(top: BorderSide(color: Color(0xFF16A34A), width: 4)),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 15, 14, 18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Row(
              children: [
                Icon(Icons.lightbulb_outline_rounded, color: Color(0xFF16A34A)),
                SizedBox(width: 10),
                Text('Coping Strategies',
                    style:
                        TextStyle(fontSize: 19, fontWeight: FontWeight.w700)),
              ],
            ),
            const SizedBox(height: 14),
            ..._copingStrategies.map(
              (strategy) => Padding(
                padding: const EdgeInsets.only(bottom: 9),
                child: OutlinedButton(
                  onPressed: () => _showCopingStrategy(context, strategy),
                  style: OutlinedButton.styleFrom(
                    alignment: Alignment.centerLeft,
                    padding: const EdgeInsets.all(12),
                    side: const BorderSide(color: Color(0xFFE5E7EB), width: 2),
                  ),
                  child: Row(
                    children: [
                      DecoratedBox(
                        decoration: BoxDecoration(
                          color: strategy.color,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Padding(
                          padding: EdgeInsets.all(7),
                          child: Icon(Icons.favorite_rounded,
                              color: Colors.white, size: 16),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(strategy.title,
                                style: const TextStyle(
                                    color: Color(0xFF111827),
                                    fontWeight: FontWeight.w700)),
                            const SizedBox(height: 3),
                            Text(strategy.description,
                                style: const TextStyle(
                                    color: Color(0xFF6B7280), fontSize: 13)),
                          ],
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
    );

    return LayoutBuilder(
      builder: (context, constraints) => constraints.maxWidth >= 760
          ? Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: breathing),
                const SizedBox(width: 18),
                Expanded(child: coping),
              ],
            )
          : Column(children: [breathing, const SizedBox(height: 18), coping]),
    );
  }
}

class _CopingStrategy {
  const _CopingStrategy({
    required this.title,
    required this.description,
    required this.steps,
    required this.color,
  });

  final String title;
  final String description;
  final List<String> steps;
  final Color color;
}

const _copingStrategies = [
  _CopingStrategy(
    title: '5-4-3-2-1 Grounding Technique',
    description: 'Use your senses to ground yourself in the present moment',
    steps: [
      'Notice 5 things you can see around you',
      'Notice 4 things you can touch',
      'Notice 3 things you can hear',
      'Notice 2 things you can smell',
      'Notice 1 thing you can taste',
    ],
    color: Color(0xFF16A34A),
  ),
  _CopingStrategy(
    title: 'Progressive Muscle Relaxation',
    description: 'Tense and relax different muscle groups to reduce stress',
    steps: [
      'Start with your toes - tense for 5 seconds, then relax',
      'Move to your calves - tense and relax',
      'Continue with thighs, abdomen, hands, arms',
      'Finish with shoulders, neck, and face',
      'Take deep breaths throughout the process',
    ],
    color: Color(0xFF9333EA),
  ),
  _CopingStrategy(
    title: 'Positive Self-Talk',
    description: 'Replace negative thoughts with encouraging ones',
    steps: [
      'Notice when you\'re being self-critical',
      'Ask yourself: "What would I tell a friend?"',
      'Replace negative thoughts with realistic, kind ones',
      'Use affirmations: "I am capable and strong"',
      'Practice daily to build this habit',
    ],
    color: Color(0xFFF97316),
  ),
  _CopingStrategy(
    title: 'Mindful Moment',
    description: 'Take a pause to reconnect with the present',
    steps: [
      'Stop what you\'re doing and sit comfortably',
      'Close your eyes or soften your gaze',
      'Notice your breath without changing it',
      'When your mind wanders, gently return to your breath',
      'Continue for 2-5 minutes',
    ],
    color: Color(0xFF0D9488),
  ),
];

Future<void> _showCopingStrategy(
  BuildContext context,
  _CopingStrategy strategy,
) async {
  await showDialog<void>(
    context: context,
    builder: (context) => AlertDialog(
      title: Row(
        children: [
          DecoratedBox(
            decoration: BoxDecoration(
              color: strategy.color,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Padding(
              padding: EdgeInsets.all(7),
              child: Icon(Icons.favorite_rounded,
                  color: Colors.white, size: 16),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(strategy.title)),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(strategy.description,
                style: const TextStyle(color: Color(0xFF4B5563))),
            const SizedBox(height: 16),
            const Text('Steps:',
                style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            ...strategy.steps.asMap().entries.map(
                  (entry) => Padding(
                    padding: const EdgeInsets.only(bottom: 9),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          radius: 11,
                          backgroundColor: strategy.color,
                          child: Text('${entry.key + 1}',
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 12)),
                        ),
                        const SizedBox(width: 8),
                        Expanded(child: Text(entry.value)),
                      ],
                    ),
                  ),
                ),
          ],
        ),
      ),
    ),
  );
}

class _EducationalResourcesSection extends StatelessWidget {
  const _EducationalResourcesSection();

  @override
  Widget build(BuildContext context) {
    const items = [
      (
        'Understanding Anxiety',
        'Learn about anxiety symptoms and healthy ways to manage anxious feelings.',
        Color(0xFFFFF7ED),
        Color(0xFFF97316),
        'anxiety',
      ),
      (
        'Building Resilience',
        'Discover strategies to bounce back from challenges and build emotional strength.',
        Color(0xFFEFF6FF),
        Color(0xFF2563EB),
        'resilience',
      ),
      (
        'Healthy Habits',
        'Simple daily practices that support your wellbeing.',
        Color(0xFFF0FDF4),
        Color(0xFF16A34A),
        'habits',
      ),
    ];
    return Card(
      color: Colors.white,
      shape: const RoundedRectangleBorder(
        border: Border(top: BorderSide(color: Color(0xFFF97316), width: 4)),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 15, 14, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Row(
              children: [
                Icon(Icons.menu_book_rounded, color: Color(0xFFF97316)),
                SizedBox(width: 10),
                Text('Educational Resources',
                    style:
                        TextStyle(fontSize: 19, fontWeight: FontWeight.w700)),
              ],
            ),
            const SizedBox(height: 14),
            LayoutBuilder(
              builder: (context, constraints) {
                final columns = constraints.maxWidth >= 760
                    ? 3
                    : constraints.maxWidth >= 460
                        ? 2
                        : 1;
                final width =
                    (constraints.maxWidth - (columns - 1) * 10) / columns;
                return Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: items
                      .map(
                        (item) => SizedBox(
                          width: width,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: item.$3,
                              border: Border.all(
                                  color: item.$4.withOpacity(.25)),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.$1,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w700)),
                                  const SizedBox(height: 7),
                                  Text(item.$2,
                                      style: const TextStyle(
                                          color: Color(0xFF4B5563),
                                          fontSize: 13,
                                          height: 1.3)),
                                  const SizedBox(height: 12),
                                  OutlinedButton(
                                    onPressed: () =>
                                        _showEducationalContent(context, item.$5),
                                    style: OutlinedButton.styleFrom(
                                        foregroundColor: item.$4,
                                        side: BorderSide(color: item.$4)),
                                    child: const Text('Learn More'),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      )
                      .toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _EmergencyResourcesPanel extends StatelessWidget {
  const _EmergencyResourcesPanel({required this.state});

  final ResourcesState state;

  @override
  Widget build(BuildContext context) {
    return _ResourcesPanel(
      title: 'Emergency Resources',
      subtitle:
          'Keep crisis lines, counselors, hospitals, and support services easy to find.',
      icon: Icons.emergency_outlined,
      color: const Color(0xFFDC2626),
      addLabel: 'Add Resource',
      onAdd: () => _showEmergencyEditor(context),
      child: state.emergencyResources.isEmpty
          ? const _EmptyCard(
              icon: Icons.emergency_outlined,
              title: 'No emergency resources yet',
              message: 'Add a crisis line, hospital, counselor, or support group.',
            )
          : Column(
              children: state.emergencyResources
                  .map(
                    (resource) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _EmergencyResourceCard(
                        resource: resource,
                        isBusy: state.busyKey == 'emergency-${resource.id}',
                      ),
                    ),
                  )
                  .toList(),
            ),
    );
  }
}

class _PersonalResourcesPanel extends StatelessWidget {
  const _PersonalResourcesPanel({required this.state});

  final ResourcesState state;

  @override
  Widget build(BuildContext context) {
    return _ResourcesPanel(
      title: 'My Personal Resources',
      subtitle:
          'Save and access your favorite links for relaxation, music, videos, and more.',
      icon: Icons.bookmark_outline_rounded,
      color: const Color(0xFF2563EB),
      addLabel: 'Add Resource',
      onAdd: () => _showPersonalEditor(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _CategoryChips(state: state),
          const SizedBox(height: 14),
          if (state.visiblePersonalResources.isEmpty)
            const _EmptyCard(
              icon: Icons.public_rounded,
              title: 'No resources saved yet',
              message:
                  'Add your favorite websites, music, videos, and apps to access them quickly.',
            )
          else
            ...state.visiblePersonalResources.map(
              (resource) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _PersonalResourceCard(
                  resource: resource,
                  isBusy: state.busyKey == 'personal-${resource.id}',
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ResourcesPanel extends StatelessWidget {
  const _ResourcesPanel({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.addLabel,
    required this.onAdd,
    required this.child,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final String addLabel;
  final VoidCallback onAdd;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final titleContent = Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color),
            const SizedBox(width: 9),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
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
        );
        final addButton = FilledButton.icon(
          onPressed: onAdd,
          style: FilledButton.styleFrom(backgroundColor: color),
          icon: const Icon(Icons.add_rounded, size: 17),
          label: Text(addLabel),
        );
        final header = constraints.maxWidth < 600
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  titleContent,
                  const SizedBox(height: 10),
                  Align(alignment: Alignment.centerRight, child: addButton),
                ],
              )
            : Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: titleContent),
                  const SizedBox(width: 8),
                  addButton,
                ],
              );

        return Card(
          color: Colors.white,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 15, 14, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                header,
                const SizedBox(height: 16),
                child,
              ],
            ),
          ),
        );
      },
    );
  }
}

Future<void> _showEducationalContent(BuildContext context, String id) async {
  final content = switch (id) {
    'anxiety' => (
        title: 'Understanding Anxiety',
        subtitle:
            'Learn about anxiety symptoms and healthy ways to manage anxious feelings',
        intro:
            'Anxiety is a feeling of worry, nervousness, or fear. Everyone experiences anxiety sometimes, especially during new or stressful situations.',
        sections: const [
          (
            'Common Signs of Anxiety',
            'Racing thoughts, feeling tense or restless, stomach discomfort, trouble focusing, and wanting to avoid certain situations.'
          ),
          (
            'Helpful Coping Tools',
            'Slow breathing exercises, grounding techniques (naming things you see, hear, or feel), creating calming routines, and preparing for situations ahead of time.'
          ),
          (
            'When Anxiety Feels Overwhelming',
            'It\'s okay to ask for support. Talking to a trusted person can help. Learning coping strategies takes time.'
          ),
        ],
        tip:
            'Everyone experiences anxiety sometimes. Learning to manage it is a skill that improves with practice.',
        color: Color(0xFFF97316),
        tipIcon: '💡',
      ),
    'resilience' => (
        title: 'Building Resilience',
        subtitle:
            'Strategies to bounce back from challenges and build emotional strength',
        intro:
            'Resilience is the ability to cope with change, stress, and setbacks. Everyone struggles sometimes — resilience helps you recover, adapt, and keep moving forward.',
        sections: const [
          (
            'Understanding Challenges',
            'Change and unexpected events can feel overwhelming. Learning that struggles are not failures is an important first step.'
          ),
          (
            'Coping Strategies',
            'Taking breaks during stressful moments, using grounding techniques (deep breathing, sensory tools), and breaking big problems into smaller steps.'
          ),
          (
            'Self-Talk',
            'Recognize negative thoughts and replace harsh self-talk with supportive language. Be kind to yourself the way you would be to a friend.'
          ),
          (
            'Asking for Support',
            'Know when to ask for help. Reach out to family, caregivers, or trusted adults. Asking for help is a strength, not a weakness.'
          ),
        ],
        tip:
            'Resilience grows over time. Each challenge you face helps build confidence for the next one.',
        color: Color(0xFF2563EB),
        tipIcon: '💪',
      ),
    _ => (
        title: 'Healthy Habits',
        subtitle: 'Simple daily practices that support your wellbeing',
        intro:
            'Healthy habits are small, everyday actions that help create structure, balance, and stability. Building routines can make daily life feel more predictable, manageable, and less overwhelming.',
        sections: const [
          (
            'Daily Routines',
            'Consistent routines can reduce stress and decision fatigue. Examples include morning routines, bedtime routines, and transition routines. Start small and build gradually.'
          ),
          (
            'Basic Self-Care',
            'Drink enough water, eat regular meals, get enough rest, and take breaks when feeling overwhelmed.'
          ),
          (
            'Body Awareness',
            'Try gentle movement like stretching, walking, or light exercise. Notice signs of fatigue, hunger, or stress. Learn when your body needs rest.'
          ),
          (
            'Habit Tracking',
            'Tracking habits can increase motivation. Use checklists or reminders. Celebrate small wins instead of aiming for perfection.'
          ),
        ],
        tip:
            'Healthy habits don\'t have to be perfect. Progress matters more than consistency.',
        color: Color(0xFF16A34A),
        tipIcon: '🌱',
      ),
  };

  await showDialog<void>(
    context: context,
    builder: (context) => AlertDialog(
      title: Row(
        children: [
          Icon(Icons.favorite_rounded, color: content.color, size: 20),
          const SizedBox(width: 8),
          Expanded(child: Text(content.title)),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(content.subtitle,
                style: const TextStyle(color: Color(0xFF6B7280))),
            const SizedBox(height: 12),
            _EducationBlock(
                text: content.intro, color: content.color.withOpacity(.12)),
            const SizedBox(height: 12),
            ...content.sections.map(
              (section) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _EducationBlock(
                  title: section.$1,
                  text: section.$2,
                  color: content.color.withOpacity(.06),
                ),
              ),
            ),
            _EducationBlock(
              text: '${content.tipIcon} ${content.tip}',
              color: content.color.withOpacity(.18),
              bold: true,
            ),
          ],
        ),
      ),
    ),
  );
}

class _EducationBlock extends StatelessWidget {
  const _EducationBlock({
    required this.text,
    required this.color,
    this.title,
    this.bold = false,
  });

  final String? title;
  final String text;
  final Color color;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(9),
      ),
      child: Padding(
        padding: const EdgeInsets.all(11),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (title != null) ...[
              Text(title!,
                  style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
            ],
            Text(text,
                style: TextStyle(
                    color: const Color(0xFF374151),
                    fontSize: 13,
                    height: 1.35,
                    fontWeight: bold ? FontWeight.w700 : FontWeight.normal)),
          ],
        ),
      ),
    );
  }
}

Future<void> _showEmergencyContactEditor(
  BuildContext context, {
  EmergencyContactModel? contact,
}) async {
  final result = await showDialog<EmergencyContactInput>(
    context: context,
    builder: (_) => _EmergencyContactDialog(contact: contact),
  );
  if (!context.mounted || result == null) return;
  final bloc = context.read<ResourcesBloc>();
  if (contact == null) {
    bloc.add(CreateEmergencyContact(result));
  } else {
    bloc.add(UpdateEmergencyContact(contact.id, result));
  }
}

class _EmergencyContactDialog extends StatefulWidget {
  const _EmergencyContactDialog({this.contact});

  final EmergencyContactModel? contact;

  @override
  State<_EmergencyContactDialog> createState() => _EmergencyContactDialogState();
}

class _EmergencyContactDialogState extends State<_EmergencyContactDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _emailController;
  late final TextEditingController _notesController;
  late String? _relationship;
  late bool _isPrimary;
  late bool _isEmergency;

  static const _relationships = [
    'parent',
    'guardian',
    'sibling',
    'caregiver',
    'doctor',
    'therapist',
    'crisis_hotline',
    'friend',
    'other',
  ];

  @override
  void initState() {
    super.initState();
    final contact = widget.contact;
    _nameController = TextEditingController(text: contact?.name);
    _phoneController = TextEditingController(text: contact?.phoneNumber);
    _emailController = TextEditingController(text: contact?.email);
    _notesController = TextEditingController(text: contact?.notes);
    _relationship = contact?.relationship;
    _isPrimary = contact?.isPrimary ?? false;
    _isEmergency = contact?.isEmergencyContact ?? true;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.contact != null;
    return AlertDialog(
      title: Text(isEditing ? 'Edit Contact' : 'Add Contact'),
      content: SizedBox(
        width: AppResponsive.dialogWidth(context),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: AppResponsive.dialogMaxHeight(context),
          ),
          child: Form(
            key: _formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _field(_nameController, 'Name', required: true),
                  DropdownButtonFormField<String>(
                    value: _relationship,
                    decoration: const InputDecoration(
                      labelText: 'Relationship',
                      border: OutlineInputBorder(),
                    ),
                    hint: const Text('Select relationship'),
                    items: _relationships
                        .map((value) => DropdownMenuItem(
                              value: value,
                              child: Text(_displayRelationship(value)),
                            ))
                        .toList(),
                    onChanged: (value) => setState(() => _relationship = value),
                  ),
                  const SizedBox(height: 12),
                  _field(_phoneController, 'Phone Number',
                      required: true, keyboardType: TextInputType.phone),
                  _field(_emailController, 'Email',
                      keyboardType: TextInputType.emailAddress),
                  SwitchListTile.adaptive(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Primary contact'),
                    value: _isPrimary,
                    onChanged: (value) => setState(() => _isPrimary = value),
                  ),
                  SwitchListTile.adaptive(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Emergency contact'),
                    value: _isEmergency,
                    onChanged: (value) => setState(() => _isEmergency = value),
                  ),
                  _field(_notesController, 'Notes', maxLines: 3),
                ],
              ),
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel')),
        FilledButton(
          onPressed: _save,
          child: Text(isEditing ? 'Update' : 'Save Contact'),
        ),
      ],
    );
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    bool required = false,
    TextInputType? keyboardType,
    int maxLines = 1,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        maxLines: maxLines,
        validator: required
            ? (value) =>
                value == null || value.trim().isEmpty ? 'Required' : null
            : null,
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
        ),
      ),
    );
  }

  void _save() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    Navigator.pop(
      context,
      EmergencyContactInput(
        name: _nameController.text,
        relationship: _relationship,
        phoneNumber: _phoneController.text,
        email: _emailController.text,
        isPrimary: _isPrimary,
        isEmergencyContact: _isEmergency,
        notes: _notesController.text,
      ),
    );
  }
}

String _displayRelationship(String value) {
  return value
      .split('_')
      .map((part) => part.isEmpty
          ? part
          : '${part[0].toUpperCase()}${part.substring(1)}')
      .join(' ');
}

class _PersonalResourcesTab extends StatelessWidget {
  const _PersonalResourcesTab({required this.state});

  final ResourcesState state;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () => _refresh(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: AppResponsive.pagePadding(context).copyWith(top: 18, bottom: 32),
        children: [
          if (state.isLoading) const LinearProgressIndicator(),
          if (state.isLoading) const SizedBox(height: 12),
          const Text(
            'Your saved resources',
            style: TextStyle(
              color: Color(0xFF111827),
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 5),
          const Text(
            'Keep helpful websites, guides, and support links close at hand.',
            style: TextStyle(color: Color(0xFF6B7280), fontSize: 14),
          ),
          const SizedBox(height: 16),
          TextField(
            onChanged: (query) => context
                .read<ResourcesBloc>()
                .add(SearchPersonalResources(query)),
            decoration: InputDecoration(
              hintText: 'Search your resources',
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon: state.searchQuery.isEmpty
                  ? null
                  : IconButton(
                      tooltip: 'Clear search',
                      onPressed: () => context
                          .read<ResourcesBloc>()
                          .add(const SearchPersonalResources('')),
                      icon: const Icon(Icons.clear_rounded),
                    ),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
              ),
            ),
          ),
          const SizedBox(height: 12),
          _CategoryChips(state: state),
          const SizedBox(height: 14),
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 12,
            runSpacing: 8,
            children: [
              Text(
                '${state.visiblePersonalResources.length} resource'
                '${state.visiblePersonalResources.length == 1 ? '' : 's'}',
                style: const TextStyle(
                  color: Color(0xFF4B5563),
                  fontWeight: FontWeight.w600,
                ),
              ),
              FilledButton.icon(
                onPressed: () => _showPersonalEditor(context),
                icon: const Icon(Icons.add_rounded),
                label: const Text('Add'),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (state.visiblePersonalResources.isEmpty)
            const _EmptyCard(
              icon: Icons.bookmark_add_outlined,
              title: 'No saved resources yet',
              message: 'Add a trusted website, guide, or support link here.',
            )
          else
            ...state.visiblePersonalResources.map(
              (resource) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _PersonalResourceCard(
                  resource: resource,
                  isBusy: state.busyKey == 'personal-${resource.id}',
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _refresh(BuildContext context) async {
    final bloc = context.read<ResourcesBloc>();
    final completion = bloc.stream.firstWhere(
      (nextState) =>
          (nextState.status == ResourcesStatus.loaded ||
              nextState.status == ResourcesStatus.failure) &&
          nextState.busyKey == null,
    );
    bloc.add(const RefreshResources());
    await completion;
  }
}

class _CategoryChips extends StatelessWidget {
  const _CategoryChips({required this.state});

  final ResourcesState state;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: state.categories.map((category) {
          final selected = category == state.selectedCategory;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(_displayCategory(category)),
              selected: selected,
              onSelected: (_) => context
                  .read<ResourcesBloc>()
                  .add(FilterPersonalResources(category)),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _PersonalResourceCard extends StatelessWidget {
  const _PersonalResourceCard({
    required this.resource,
    required this.isBusy,
  });

  final PersonalResourceModel resource;
  final bool isBusy;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: isBusy ? null : () => _openPersonalResource(context, resource),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 14, 8, 14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ResourceIcon(
                icon: _personalResourceIcon(resource.category),
                color: const Color(0xFF2563EB),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            resource.title,
                            style: const TextStyle(
                              color: Color(0xFF111827),
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        IconButton(
                          tooltip: resource.isFavorite
                              ? 'Remove favorite'
                              : 'Add favorite',
                          onPressed: isBusy
                              ? null
                              : () => context
                                  .read<ResourcesBloc>()
                                  .add(TogglePersonalFavorite(resource)),
                          icon: isBusy
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child:
                                      CircularProgressIndicator(strokeWidth: 2),
                                )
                              : Icon(
                                  resource.isFavorite
                                      ? Icons.star_rounded
                                      : Icons.star_border_rounded,
                                  color: resource.isFavorite
                                      ? const Color(0xFFF59E0B)
                                      : const Color(0xFF9CA3AF),
                                ),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(
                            minWidth: 34,
                            minHeight: 34,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    if (resource.description?.trim().isNotEmpty == true) ...[
                      Text(
                        resource.description!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF6B7280),
                          fontSize: 13,
                          height: 1.35,
                        ),
                      ),
                      const SizedBox(height: 9),
                    ],
                    _Tag(text: _displayCategory(resource.category)),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                tooltip: 'Resource actions',
                onSelected: (action) => _handlePersonalAction(
                  context,
                  resource,
                  action,
                ),
                itemBuilder: (context) => const [
                  PopupMenuItem(value: 'open', child: Text('Open link')),
                  PopupMenuItem(value: 'delete', child: Text('Delete')),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handlePersonalAction(
    BuildContext context,
    PersonalResourceModel resource,
    String action,
  ) async {
    if (action == 'open') {
      await _openPersonalResource(context, resource);
    } else if (action == 'delete') {
      await _confirmDelete(
        context,
        title: 'Delete resource?',
        message: 'This will remove "${resource.title}" from your resources.',
        onConfirm: () => context
            .read<ResourcesBloc>()
            .add(DeletePersonalResource(resource.id)),
      );
    }
  }
}

class _EmergencyResourcesTab extends StatelessWidget {
  const _EmergencyResourcesTab({required this.state});

  final ResourcesState state;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () => _refresh(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: AppResponsive.pagePadding(context).copyWith(top: 18, bottom: 32),
        children: [
          if (state.isLoading) const LinearProgressIndicator(),
          if (state.isLoading) const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7ED),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFFED7AA)),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.shield_outlined, color: Color(0xFFC2410C)),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'If you are in immediate danger, contact your local emergency service. These saved contacts are for quick access to support.',
                    style: TextStyle(
                      color: Color(0xFF9A3412),
                      fontSize: 13,
                      height: 1.35,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 12,
            runSpacing: 8,
            children: [
              const Text(
                'Saved support contacts',
                style: TextStyle(
                  color: Color(0xFF111827),
                  fontSize: 21,
                  fontWeight: FontWeight.w700,
                ),
              ),
              FilledButton.icon(
                onPressed: () => _showEmergencyEditor(context),
                icon: const Icon(Icons.add_rounded),
                label: const Text('Add'),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (state.emergencyResources.isEmpty)
            const _EmptyCard(
              icon: Icons.emergency_outlined,
              title: 'No emergency resources saved',
              message: 'Add a crisis line, clinic, trusted service, or address.',
            )
          else
            ...state.emergencyResources.map(
              (resource) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _EmergencyResourceCard(resource: resource),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _refresh(BuildContext context) async {
    final bloc = context.read<ResourcesBloc>();
    final completion = bloc.stream.firstWhere(
      (nextState) =>
          (nextState.status == ResourcesStatus.loaded ||
              nextState.status == ResourcesStatus.failure) &&
          nextState.busyKey == null,
    );
    bloc.add(const RefreshResources());
    await completion;
  }
}

class _EmergencyResourceCard extends StatelessWidget {
  const _EmergencyResourceCard({
    required this.resource,
    this.isBusy = false,
  });

  final EmergencyResourceModel resource;
  final bool isBusy;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _showEmergencyDetails(context, resource),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _ResourceIcon(
                    icon: Icons.emergency_rounded,
                    color: const Color(0xFFDC2626),
                    background: const Color(0xFFFEF2F2),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          resource.name,
                          style: const TextStyle(
                            color: Color(0xFF111827),
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _displayCategory(resource.resourceType),
                          style: const TextStyle(
                            color: Color(0xFF6B7280),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  PopupMenuButton<String>(
                    tooltip: 'Resource actions',
                    enabled: !isBusy,
                    onSelected: (action) async {
                      if (action == 'edit') {
                        await _showEmergencyEditor(
                          context,
                          resource: resource,
                        );
                      } else if (action == 'delete') {
                        await _confirmDelete(
                          context,
                          title: 'Delete emergency resource?',
                          message:
                              'This will remove "${resource.name}" from your saved contacts.',
                          onConfirm: () => context
                              .read<ResourcesBloc>()
                              .add(DeleteEmergencyResource(resource.id)),
                        );
                      }
                    },
                    itemBuilder: (context) => const [
                      PopupMenuItem(value: 'edit', child: Text('Edit')),
                      PopupMenuItem(value: 'delete', child: Text('Delete')),
                    ],
                  ),
                ],
              ),
              if (resource.phoneNumber != null ||
                  resource.address != null ||
                  resource.website != null ||
                  resource.availabilityHours != null ||
                  resource.isEmergencyOnly ||
                  resource.isAvailable24_7) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    if (resource.phoneNumber != null)
                      _Tag(
                        text: resource.phoneNumber!,
                        color: const Color(0xFFEFF6FF),
                        textColor: const Color(0xFF1D4ED8),
                      ),
                    if (resource.isAvailable24_7)
                      const _Tag(
                        text: 'Available 24/7',
                        color: Color(0xFFECFDF5),
                        textColor: Color(0xFF047857),
                      ),
                    if (resource.isEmergencyOnly)
                      const _Tag(
                        text: 'Emergency only',
                        color: Color(0xFFFFF1F2),
                        textColor: Color(0xFFBE123C),
                      ),
                    if (resource.availabilityHours != null)
                      _Tag(
                        text: resource.availabilityHours!,
                        color: const Color(0xFFF3F4F6),
                        textColor: const Color(0xFF4B5563),
                      ),
                  ],
                ),
              ],
              if (resource.description?.trim().isNotEmpty == true) ...[
                const SizedBox(height: 10),
                Text(
                  resource.description!,
                  style: const TextStyle(
                    color: Color(0xFF4B5563),
                    fontSize: 13,
                    height: 1.35,
                  ),
                ),
              ],
              if (resource.address?.trim().isNotEmpty == true) ...[
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.location_on_outlined,
                      size: 17,
                      color: Color(0xFF6B7280),
                    ),
                    const SizedBox(width: 5),
                    Expanded(
                      child: Text(
                        resource.address!,
                        style: const TextStyle(
                          color: Color(0xFF6B7280),
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
              if (resource.website?.trim().isNotEmpty == true) ...[
                const SizedBox(height: 8),
                InkWell(
                  onTap: () => _openExternalLink(context, resource.website!),
                  child: Row(
                    children: [
                      const Icon(Icons.language_rounded,
                          size: 17, color: Color(0xFF2563EB)),
                      const SizedBox(width: 5),
                      Expanded(
                        child: Text(
                          resource.website!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: Color(0xFF2563EB), fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _WellbeingTab extends StatelessWidget {
  const _WellbeingTab();

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: AppResponsive.pagePadding(context).copyWith(top: 18, bottom: 32),
      children: const [
        Text(
          'Self-guided support',
          style: TextStyle(
            color: Color(0xFF111827),
            fontSize: 24,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(height: 5),
        Text(
          'Small practices you can use when you need a reset or a little extra support.',
          style: TextStyle(color: Color(0xFF6B7280), fontSize: 14),
        ),
        SizedBox(height: 16),
        _WellbeingCard(
          icon: Icons.air_rounded,
          color: Color(0xFF2563EB),
          title: 'Box breathing',
          description:
              'Breathe in for 4 seconds, hold for 4, breathe out for 4, and hold for 4. Repeat for four rounds.',
          steps: ['Inhale', 'Hold', 'Exhale', 'Hold'],
        ),
        SizedBox(height: 12),
        _WellbeingCard(
          icon: Icons.self_improvement_rounded,
          color: Color(0xFF7C3AED),
          title: 'Grounding with your senses',
          description:
              'Name five things you see, four things you feel, three things you hear, two things you smell, and one thing you taste.',
          steps: ['5 see', '4 feel', '3 hear', '2 smell', '1 taste'],
        ),
        SizedBox(height: 12),
        _WellbeingCard(
          icon: Icons.favorite_outline_rounded,
          color: Color(0xFF059669),
          title: 'A kinder next step',
          description:
              'Choose one small action that supports you: drink water, message someone safe, step outside, or rest for five minutes.',
          steps: ['Pause', 'Choose one step', 'Be gentle'],
        ),
      ],
    );
  }
}

class _WellbeingCard extends StatelessWidget {
  const _WellbeingCard({
    required this.icon,
    required this.color,
    required this.title,
    required this.description,
    required this.steps,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String description;
  final List<String> steps;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.white,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _ResourceIcon(icon: icon, color: color),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      color: Color(0xFF111827),
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              description,
              style: const TextStyle(
                color: Color(0xFF4B5563),
                height: 1.4,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 7,
              runSpacing: 6,
              children: steps
                  .map(
                    (step) => _Tag(
                      text: step,
                      color: color.withOpacity(0.10),
                      textColor: color,
                    ),
                  )
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }
}

class _ResourceIcon extends StatelessWidget {
  const _ResourceIcon({
    required this.icon,
    required this.color,
    this.background,
  });

  final IconData icon;
  final Color color;
  final Color? background;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: background ?? color.withOpacity(0.11),
        borderRadius: BorderRadius.circular(13),
      ),
      child: Icon(icon, color: color, size: 23),
    );
  }
}

class _Tag extends StatelessWidget {
  const _Tag({
    required this.text,
    this.color = const Color(0xFFEFF6FF),
    this.textColor = const Color(0xFF1D4ED8),
  });

  final String text;
  final Color color;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textColor,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.8),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 42, color: const Color(0xFF9CA3AF)),
          const SizedBox(height: 12),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF374151),
              fontWeight: FontWeight.w700,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFF6B7280), fontSize: 13),
          ),
        ],
      ),
    );
  }
}

class _ResourcesLoading extends StatelessWidget {
  const _ResourcesLoading();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFEFF6FF), Color(0xFFF5F3FF)],
        ),
      ),
      child: const Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}

class _ResourcesError extends StatelessWidget {
  const _ResourcesError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off_rounded,
              size: 48,
              color: Color(0xFF9CA3AF),
            ),
            const SizedBox(height: 12),
            const Text(
              'Resources are unavailable',
              style: TextStyle(
                color: Color(0xFF111827),
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF6B7280)),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }
}

Future<void> _showPersonalEditor(
  BuildContext context, {
  PersonalResourceModel? resource,
}) async {
  final result = await showDialog<Object?>(
    context: context,
    builder: (_) => _PersonalResourceDialog(resource: resource),
  );
  if (!context.mounted || result == null) return;
  final bloc = context.read<ResourcesBloc>();
  if (result is PersonalResourceInput) {
    bloc.add(CreatePersonalResource(result));
  } else if (result is Map<String, dynamic> && resource != null) {
    bloc.add(UpdatePersonalResource(resource.id, result));
  }
}

Future<void> _showEmergencyEditor(
  BuildContext context, {
  EmergencyResourceModel? resource,
}) async {
  final result = await showDialog<EmergencyResourceInput>(
    context: context,
    builder: (_) => _EmergencyResourceDialog(resource: resource),
  );
  if (!context.mounted || result == null) return;
  if (resource == null) {
    context.read<ResourcesBloc>().add(CreateEmergencyResource(result));
  } else {
    context
        .read<ResourcesBloc>()
        .add(UpdateEmergencyResource(resource.id, result));
  }
}

Future<void> _showPersonalDetails(
  BuildContext context,
  PersonalResourceModel resource,
) async {
  await showDialog<void>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: Text(resource.title),
      content: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            _DetailLine(label: 'Category', value: _displayCategory(resource.category)),
            _DetailLine(label: 'Link', value: resource.url),
            if (resource.description != null)
              _DetailLine(label: 'Description', value: resource.description!),
            if (resource.tags != null)
              _DetailLine(label: 'Tags', value: resource.tags!),
            _DetailLine(
              label: 'Visits',
              value: resource.accessCount.toString(),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(dialogContext),
          child: const Text('Close'),
        ),
        FilledButton.icon(
          onPressed: () async {
            Navigator.pop(dialogContext);
            await _openPersonalResource(context, resource);
          },
          icon: const Icon(Icons.open_in_new_rounded),
          label: const Text('Open link'),
        ),
      ],
    ),
  );
}

Future<void> _showEmergencyDetails(
  BuildContext context,
  EmergencyResourceModel resource,
) async {
  await showDialog<void>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: Text(resource.name),
      content: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            _DetailLine(
              label: 'Type',
              value: _displayCategory(resource.resourceType),
            ),
            if (resource.phoneNumber != null)
              _DetailLine(label: 'Phone', value: resource.phoneNumber!),
            if (resource.address != null)
              _DetailLine(label: 'Address', value: resource.address!),
            if (resource.website != null)
              _DetailLine(label: 'Website', value: resource.website!),
            if (resource.description != null)
              _DetailLine(label: 'Description', value: resource.description!),
            _DetailLine(
              label: 'Availability',
              value: resource.isAvailable24_7
                  ? 'Available 24/7'
                  : resource.availabilityHours ?? 'As listed',
            ),
            if (resource.isEmergencyOnly)
              const _DetailLine(label: 'Access', value: 'Emergency only'),
          ],
        ),
      ),
      actions: [
        if (resource.phoneNumber != null)
          TextButton.icon(
            onPressed: () async {
              final uri = Uri(scheme: 'tel', path: resource.phoneNumber);
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri);
              }
            },
            icon: const Icon(Icons.phone_outlined),
            label: const Text('Call'),
          ),
        TextButton(
          onPressed: () => Navigator.pop(dialogContext),
          child: const Text('Close'),
        ),
      ],
    ),
  );
}

Future<void> _openExternalLink(BuildContext context, String value) async {
  final uri = Uri.tryParse(value.trim());
  if (uri == null || (uri.scheme != 'http' && uri.scheme != 'https')) {
    _showMessage(context, 'This resource does not have a valid web link.');
    return;
  }
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  } else if (context.mounted) {
    _showMessage(context, 'Unable to open this link on your device.');
  }
}

Future<void> _openPersonalResource(
  BuildContext context,
  PersonalResourceModel resource,
) async {
  final uri = Uri.tryParse(resource.url.trim());
  if (uri == null || (uri.scheme != 'http' && uri.scheme != 'https')) {
    if (context.mounted) {
      _showMessage(context, 'This resource does not have a valid web link.');
    }
    return;
  }

  context.read<ResourcesBloc>().add(OpenPersonalResource(resource.id));
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  } else if (context.mounted) {
    _showMessage(context, 'Unable to open this link on your device.');
  }
}

Future<void> _confirmDelete(
  BuildContext context, {
  required String title,
  required String message,
  required VoidCallback onConfirm,
}) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(dialogContext, false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFFB91C1C),
          ),
          onPressed: () => Navigator.pop(dialogContext, true),
          child: const Text('Delete'),
        ),
      ],
    ),
  );
  if (confirmed == true && context.mounted) onConfirm();
}

void _showMessage(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

String _displayCategory(String value) {
  if (value == 'all') return 'All Resources';
  return value
      .split(RegExp(r'[_-]'))
      .where((part) => part.isNotEmpty)
      .map(
        (part) => '${part[0].toUpperCase()}${part.substring(1).toLowerCase()}',
      )
      .join(' ');
}

IconData _personalResourceIcon(String category) {
  switch (category.toLowerCase()) {
    case 'music':
      return Icons.music_note_rounded;
    case 'videos':
      return Icons.ondemand_video_rounded;
    case 'apps':
      return Icons.book_outlined;
    case 'relaxation':
      return Icons.favorite_outline_rounded;
    case 'entertainment':
      return Icons.sentiment_satisfied_alt_rounded;
    default:
      return Icons.language_rounded;
  }
}

class _DetailLine extends StatelessWidget {
  const _DetailLine({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: RichText(
        text: TextSpan(
          style: const TextStyle(
            color: Color(0xFF4B5563),
            fontSize: 14,
            height: 1.35,
          ),
          children: [
            TextSpan(
              text: '$label\n',
              style: const TextStyle(
                color: Color(0xFF111827),
                fontWeight: FontWeight.w700,
              ),
            ),
            TextSpan(text: value),
          ],
        ),
      ),
    );
  }
}

class _PersonalResourceDialog extends StatefulWidget {
  const _PersonalResourceDialog({this.resource});

  final PersonalResourceModel? resource;

  @override
  State<_PersonalResourceDialog> createState() =>
      _PersonalResourceDialogState();
}

class _PersonalResourceDialogState extends State<_PersonalResourceDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _urlController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _tagsController;
  late String _category;
  late bool _isFavorite;

  static const _categories = [
    'music',
    'videos',
    'websites',
    'apps',
    'relaxation',
    'entertainment',
    'other',
  ];

  @override
  void initState() {
    super.initState();
    final resource = widget.resource;
    _titleController = TextEditingController(text: resource?.title);
    _urlController = TextEditingController(text: resource?.url);
    _category = _categories.contains(resource?.category)
        ? resource!.category
        : 'websites';
    _descriptionController =
        TextEditingController(text: resource?.description);
    _tagsController = TextEditingController(text: resource?.tags);
    _isFavorite = resource?.isFavorite ?? false;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _urlController.dispose();
    _descriptionController.dispose();
    _tagsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.resource != null;
    return AlertDialog(
      insetPadding: EdgeInsets.symmetric(
        horizontal: AppResponsive.isCompact(context) ? 12 : 24,
        vertical: 24,
      ),
      title: Text(isEditing ? 'Edit personal resource' : 'Add personal resource'),
      content: SizedBox(
        width: AppResponsive.dialogWidth(context),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: AppResponsive.dialogMaxHeight(context),
          ),
          child: Form(
            key: _formKey,
            child: SingleChildScrollView(
              child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _formField(
                controller: _titleController,
                label: 'Title',
                validator: (value) =>
                    value == null || value.trim().isEmpty ? 'Enter a title' : null,
              ),
              _formField(
                controller: _urlController,
                label: 'Web link',
                keyboardType: TextInputType.url,
                validator: (value) {
                  final uri = Uri.tryParse(value?.trim() ?? '');
                  if (value == null || value.trim().isEmpty) {
                    return 'Enter a web link';
                  }
                  if (uri == null ||
                      (uri.scheme != 'http' && uri.scheme != 'https')) {
                    return 'Use an http or https link';
                  }
                  return null;
                },
              ),
              DropdownButtonFormField<String>(
                value: _category,
                decoration: const InputDecoration(
                  labelText: 'Category',
                  border: OutlineInputBorder(),
                ),
                items: _categories
                    .map(
                      (category) => DropdownMenuItem(
                        value: category,
                        child: Text(_displayCategory(category)),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value != null) setState(() => _category = value);
                },
              ),
              const SizedBox(height: 12),
              _formField(
                controller: _descriptionController,
                label: 'Description',
                maxLines: 3,
              ),
              _formField(
                controller: _tagsController,
                label: 'Tags',
                helperText: 'Optional; separate tags with commas',
              ),
              if (isEditing)
                SwitchListTile.adaptive(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Favorite'),
                  value: _isFavorite,
                  onChanged: (value) => setState(() => _isFavorite = value),
                ),
            ],
              ),
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _save,
          child: Text(isEditing ? 'Save changes' : 'Add resource'),
        ),
      ],
    );
  }

  Widget _formField({
    required TextEditingController controller,
    required String label,
    String? helperText,
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        maxLines: maxLines,
        validator: validator,
        decoration: InputDecoration(
          labelText: label,
          helperText: helperText,
          border: const OutlineInputBorder(),
        ),
      ),
    );
  }

  void _save() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final input = PersonalResourceInput(
      title: _titleController.text,
      url: _urlController.text,
      category: _category,
      description: _descriptionController.text,
      tags: _tagsController.text,
      isFavorite: _isFavorite,
    );
    Navigator.pop(
      context,
      widget.resource == null ? input : input.toJson(),
    );
  }
}

class _EmergencyResourceDialog extends StatefulWidget {
  const _EmergencyResourceDialog({this.resource});

  final EmergencyResourceModel? resource;

  @override
  State<_EmergencyResourceDialog> createState() =>
      _EmergencyResourceDialogState();
}

class _EmergencyResourceDialogState extends State<_EmergencyResourceDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _typeController;
  late final TextEditingController _phoneController;
  late final TextEditingController _addressController;
  late final TextEditingController _websiteController;
  late final TextEditingController _availabilityController;
  late final TextEditingController _descriptionController;
  late bool _isEmergencyOnly;
  late bool _isAvailable24_7;

  @override
  void initState() {
    super.initState();
    final resource = widget.resource;
    _nameController = TextEditingController(text: resource?.name);
    _typeController =
        TextEditingController(text: resource?.resourceType ?? 'crisis');
    _phoneController = TextEditingController(text: resource?.phoneNumber);
    _addressController = TextEditingController(text: resource?.address);
    _websiteController = TextEditingController(text: resource?.website);
    _availabilityController =
        TextEditingController(text: resource?.availabilityHours);
    _descriptionController =
        TextEditingController(text: resource?.description);
    _isEmergencyOnly = resource?.isEmergencyOnly ?? false;
    _isAvailable24_7 = resource?.isAvailable24_7 ?? false;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _typeController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _websiteController.dispose();
    _availabilityController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.resource != null;
    return AlertDialog(
      insetPadding: EdgeInsets.symmetric(
        horizontal: AppResponsive.isCompact(context) ? 12 : 24,
        vertical: 24,
      ),
      title: Text(
        isEditing ? 'Edit emergency resource' : 'Add emergency resource',
      ),
      content: SizedBox(
        width: AppResponsive.dialogWidth(context),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: AppResponsive.dialogMaxHeight(context),
          ),
          child: Form(
            key: _formKey,
            child: SingleChildScrollView(
              child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _formField(
                controller: _nameController,
                label: 'Name',
                validator: (value) =>
                    value == null || value.trim().isEmpty ? 'Enter a name' : null,
              ),
              _formField(
                controller: _typeController,
                label: 'Resource type',
                helperText: 'For example: crisis line, clinic, or community',
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Enter a resource type'
                    : null,
              ),
              _formField(
                controller: _phoneController,
                label: 'Phone number',
                keyboardType: TextInputType.phone,
              ),
              _formField(
                controller: _addressController,
                label: 'Address',
                maxLines: 2,
              ),
              _formField(
                controller: _websiteController,
                label: 'Website',
                keyboardType: TextInputType.url,
              ),
              _formField(
                controller: _availabilityController,
                label: 'Availability hours',
                helperText: 'For example: Mon-Fri, 9am-5pm',
              ),
              _formField(
                controller: _descriptionController,
                label: 'Description',
                maxLines: 3,
              ),
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                title: const Text('Emergency only'),
                value: _isEmergencyOnly,
                onChanged: (value) =>
                    setState(() => _isEmergencyOnly = value),
              ),
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                title: const Text('Available 24/7'),
                value: _isAvailable24_7,
                onChanged: (value) => setState(() => _isAvailable24_7 = value),
              ),
            ],
              ),
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _save,
          child: Text(isEditing ? 'Save changes' : 'Add resource'),
        ),
      ],
    );
  }

  Widget _formField({
    required TextEditingController controller,
    required String label,
    String? helperText,
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        maxLines: maxLines,
        validator: validator,
        decoration: InputDecoration(
          labelText: label,
          helperText: helperText,
          border: const OutlineInputBorder(),
        ),
      ),
    );
  }

  void _save() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    Navigator.pop(
      context,
      EmergencyResourceInput(
        name: _nameController.text,
        resourceType: _typeController.text,
        phoneNumber: _phoneController.text,
        address: _addressController.text,
        website: _websiteController.text,
        availabilityHours: _availabilityController.text,
        description: _descriptionController.text,
        isEmergencyOnly: _isEmergencyOnly,
        isAvailable24_7: _isAvailable24_7,
      ),
    );
  }
}