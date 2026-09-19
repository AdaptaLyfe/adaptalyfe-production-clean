import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/layout/responsive.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../../auth/bloc/auth_state.dart';
import '../bloc/medical_bloc.dart';
import '../bloc/medical_event.dart';
import '../bloc/medical_state.dart';
import '../models/medical_models.dart';

class MedicalScreen extends StatelessWidget {
  const MedicalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    if (!_hasMedicalAccess(context)) {
      return const _MedicalPremiumPrompt();
    }

    return BlocConsumer<MedicalBloc, MedicalState>(
      listener: (context, state) {
        if (state.sessionInvalid) {
          context.read<AuthBloc>().add(const CheckAuthentication());
          return;
        }
        final message = state.actionMessage ?? state.errorMessage;
        if (message == null || message.isEmpty) return;
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: state.errorMessage != null
                  ? const Color(0xFFB91C1C)
                  : null,
            ),
          );
      },
      builder: (context, state) {
        if (state.status == MedicalStatus.initial ||
            (state.isLoading && !state.hasData)) {
          return const Scaffold(
            appBar: _MedicalAppBar(),
            body: _MedicalLoading(),
          );
        }
        if (state.status == MedicalStatus.failure && !state.hasData) {
          return Scaffold(
            appBar: const _MedicalAppBar(),
            body: _MedicalError(
              message: state.errorMessage ?? 'Unable to load medical records.',
              onRetry: () =>
                  context.read<MedicalBloc>().add(const RefreshMedical()),
            ),
          );
        }

        return DefaultTabController(
          length: 6,
          child: Scaffold(
            appBar: AppBar(
              title: const Text('Health Records'),
              actions: [
                IconButton(
                  tooltip: 'Refresh medical records',
                  onPressed: () =>
                      context.read<MedicalBloc>().add(const RefreshMedical()),
                  icon: const Icon(Icons.refresh_rounded),
                ),
              ],
              bottom: TabBar(
                isScrollable: MediaQuery.of(context).size.width < 1000,
                tabs: [
                  const Tab(text: 'Sensitivities'),
                  const Tab(text: 'Notes'),
                  const Tab(text: 'Reactions'),
                  const Tab(text: 'Trusted Contacts'),
                  const Tab(text: 'Healthcare Contacts'),
                  const Tab(text: 'Personal Notes'),
                ],
              ),
            ),
            body: Column(
              children: [
                if (state.isLoading) const LinearProgressIndicator(minHeight: 2),
                Expanded(
                  child: TabBarView(
                    children: [
                      _AllergiesTab(state: state),
                      _ConditionsTab(state: state),
                      _AdverseMedicationsTab(state: state),
                      _ContactsTab(state: state),
                      _ProvidersTab(state: state),
                      _SymptomsTab(state: state),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class PharmacyScreen extends StatelessWidget {
  const PharmacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    if (!_hasMedicalAccess(context)) {
      return const _MedicalPremiumPrompt(
        title: 'Medication List',
        description:
            'Keep a personal list of medications for reference and reminders.',
      );
    }

    return BlocConsumer<MedicalBloc, MedicalState>(
      listener: (context, state) {
        if (state.sessionInvalid) {
          context.read<AuthBloc>().add(const CheckAuthentication());
          return;
        }
        final message = state.actionMessage ?? state.errorMessage;
        if (message == null || message.isEmpty) return;
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: state.errorMessage != null
                  ? const Color(0xFFB91C1C)
                  : null,
            ),
          );
      },
      builder: (context, state) {
        if (state.status == MedicalStatus.initial ||
            (state.isLoading && !state.hasData)) {
          return const Scaffold(
            appBar: _MedicalAppBar(title: 'Medication List'),
            body: _MedicalLoading(),
          );
        }
        if (state.status == MedicalStatus.failure && !state.hasData) {
          return Scaffold(
            appBar: const _MedicalAppBar(title: 'Medication List'),
            body: _MedicalError(
              message: state.errorMessage ?? 'Unable to load medications.',
              onRetry: () =>
                  context.read<MedicalBloc>().add(const RefreshMedical()),
            ),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: const Text('Medication List'),
            actions: [
              IconButton(
                tooltip: 'Refresh medications',
                onPressed: () =>
                    context.read<MedicalBloc>().add(const RefreshMedical()),
                icon: const Icon(Icons.refresh_rounded),
              ),
            ],
          ),
          body: Column(
            children: [
              if (state.isLoading) const LinearProgressIndicator(minHeight: 2),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 960),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'Keep a personal list of medications for reference and reminders.',
                          style: TextStyle(color: Color(0xFF4B5563)),
                        ),
                        const SizedBox(height: 10),
                        Card(
                          margin: EdgeInsets.zero,
                          color: const Color(0xFFEFF6FF),
                          child: const Padding(
                            padding: EdgeInsets.all(12),
                            child: Text(
                              'Disclaimer: Medication information is entered by the user and stored for personal reference only. This app does not provide medical advice or prescription services.',
                              style: TextStyle(
                                color: Color(0xFF1E40AF),
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Expanded(child: _MedicationsTab(state: state)),
            ],
          ),
        );
      },
    );
  }
}

bool _hasMedicalAccess(BuildContext context) {
  final authState = context.read<AuthBloc>().state;
  if (authState is! Authenticated) return false;

  final user = authState.user;
  final isAdmin = user.accountType == 'admin' || user.username == 'admin';
  if (isAdmin) return true;

  final tier = user.subscriptionTier?.toLowerCase();
  final status = user.subscriptionStatus?.toLowerCase();
  return (status == 'active' && (tier == 'premium' || tier == 'family')) ||
      status == 'trialing';
}

class _MedicalPremiumPrompt extends StatelessWidget {
  const _MedicalPremiumPrompt({
    this.title = 'Health Records',
    this.description =
        'Store personal health-related details such as sensitivities and trusted contacts for reference.',
  });

  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: SingleChildScrollView(
          padding: AppResponsive.pagePadding(context),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.workspace_premium_outlined,
                    size: 52,
                    color: Color(0xFFF97316),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    title,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    description,
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Color(0xFF4B5563)),
                  ),
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    onPressed: () => context.go('/subscription'),
                    icon: const Icon(Icons.lock_open_outlined),
                    label: const Text('View Subscription Options'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MedicalAppBar extends StatelessWidget implements PreferredSizeWidget {
  const _MedicalAppBar({this.title = 'Health Records'});

  final String title;

  @override
  Widget build(BuildContext context) => AppBar(title: Text(title));

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

class _ConditionsTab extends StatelessWidget {
  const _ConditionsTab({required this.state});

  final MedicalState state;

  @override
  Widget build(BuildContext context) {
    return _MedicalCollectionView(
      onRefresh: () => _refresh(context),
      emptyTitle: 'No notes recorded',
      emptySubtitle: 'Add a note to get started.',
      addLabel: 'Add Note',
      errorMessage: state.collectionErrors['conditions'],
      onAdd: () => _showConditionDialog(context),
      children: state.conditions
          .map(
            (item) => _MedicalCard(
              leading: Icons.medical_information_outlined,
              title: item.condition,
              badge: _BadgeData(
                item.status,
                _statusColor(item.status),
              ),
              details: [
                if (item.diagnosedDate != null)
                  'Diagnosed: ${_formatDate(item.diagnosedDate!)}',
                if (_hasText(item.notes)) item.notes!,
              ],
              onEdit: () => _showConditionDialog(context, item),
              onDelete: () => _confirmDelete(
                context,
                title: 'Delete condition?',
                message: 'This condition will be removed from your records.',
                onConfirm: () => context
                    .read<MedicalBloc>()
                    .add(DeleteCondition(item.id)),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _MedicationsTab extends StatelessWidget {
  const _MedicationsTab({required this.state});

  final MedicalState state;

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Column(
        children: [
          Material(
            color: Theme.of(context).scaffoldBackgroundColor,
            child: TabBar(
              isScrollable: MediaQuery.of(context).size.width < 700,
              tabs: const [
                Tab(text: 'Medication List'),
                Tab(text: 'Refill Reminders'),
                Tab(text: 'Reminder History'),
                Tab(text: 'Pharmacy Notes'),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              children: [
                _MedicationListTab(state: state),
                _RefillRemindersTab(state: state),
                _ReminderHistoryTab(state: state),
                _PharmacyNotesTab(state: state),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MedicationListTab extends StatelessWidget {
  const _MedicationListTab({required this.state});

  final MedicalState state;

  @override
  Widget build(BuildContext context) {
    return _MedicalCollectionView(
      onRefresh: () => _refresh(context),
      emptyTitle: 'No medications added yet',
      emptySubtitle: 'Add medications to keep your list available.',
      addLabel: 'Add Medication',
      errorMessage: state.collectionErrors['medications'],
      onAdd: () => _showMedicationDialog(context, state),
      children: state.medications
          .map(
            (item) => _MedicationCard(
              medication: item,
              busy: state.busySection == 'medication',
              onEdit: () => _showMedicationDialog(context, state, item),
              onDelete: () => _confirmDelete(
                context,
                title: 'Delete medication?',
                message: 'This medication will be removed from your list.',
                onConfirm: () => context
                    .read<MedicalBloc>()
                    .add(DeleteMedication(item.id)),
              ),
              onSetReminder: () => _setRefillReminder(context, item, state),
              linkedPharmacy: _pharmacyForMedication(item, state),
            ),
          )
          .toList(),
    );
  }
}

class _RefillRemindersTab extends StatelessWidget {
  const _RefillRemindersTab({required this.state});

  final MedicalState state;

  @override
  Widget build(BuildContext context) {
    return _MedicalCollectionView(
      onRefresh: () => _refresh(context),
      emptyTitle: 'No refills needed right now',
      emptySubtitle: 'Check back when medications are running low.',
      addLabel: 'Refresh',
      onAdd: () => context.read<MedicalBloc>().add(const RefreshMedical()),
      errorMessage: state.collectionErrors['medicationsDue'],
      children: state.medicationsDue
          .map(
            (item) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.warning_amber_rounded,
                        color: Color(0xFFEA580C)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.medicationName,
                              style:
                                  const TextStyle(fontWeight: FontWeight.w700)),
                          Text(
                            item.nextRefillDate == null
                                ? 'Due soon'
                                : 'Due: ${_formatDate(item.nextRefillDate!)}',
                            style: const TextStyle(color: Color(0xFFEA580C)),
                          ),
                          const SizedBox(height: 6),
                          _StatusBadge(
                            data: _BadgeData(
                              '${item.refillsRemaining} refills left',
                              const Color(0xFFEA580C),
                            ),
                          ),
                        ],
                      ),
                    ),
                    OutlinedButton(
                      onPressed: state.busySection == 'refillOrder'
                          ? null
                          : () => _setRefillReminder(context, item, state),
                      child: const Text('Set Reminder'),
                    ),
                  ],
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _ReminderHistoryTab extends StatelessWidget {
  const _ReminderHistoryTab({required this.state});

  final MedicalState state;

  @override
  Widget build(BuildContext context) {
    return _MedicalCollectionView(
      onRefresh: () => _refresh(context),
      emptyTitle: 'No reminders set yet',
      emptySubtitle: 'Your refill reminder history will appear here.',
      addLabel: 'Refresh',
      onAdd: () => context.read<MedicalBloc>().add(const RefreshMedical()),
      errorMessage: state.collectionErrors['refillOrders'],
      children: state.refillOrders
          .map(
            (order) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.refresh_rounded,
                        color: Color(0xFF2563EB)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            order.medication?.medicationName ??
                                'Medication #${order.medicationId}',
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          Text(order.pharmacy?.name ??
                              'Pharmacy #${order.pharmacyId}'),
                          if (order.orderDate != null)
                            Text(
                              'Ordered: ${_formatDate(order.orderDate!)}',
                              style:
                                  const TextStyle(color: Color(0xFF6B7280)),
                            ),
                          if (_hasText(order.orderNumber))
                            Text('Order #${order.orderNumber}',
                                style: const TextStyle(
                                    color: Color(0xFF6B7280))),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        _StatusBadge(
                          data: _BadgeData(
                            _titleCase(order.status),
                            _refillStatusColor(order.status),
                          ),
                        ),
                        if (order.readyDate != null)
                          Text(
                            'Ready: ${_formatDate(order.readyDate!)}',
                            style: const TextStyle(
                                color: Color(0xFF6B7280), fontSize: 12),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _PharmacyNotesTab extends StatelessWidget {
  const _PharmacyNotesTab({required this.state});

  final MedicalState state;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () => _refresh(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: AppResponsive.pagePadding(context).add(
          const EdgeInsets.only(top: 16, bottom: 32),
        ),
        children: [
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 960),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: Text('Your Pharmacies',
                          style: TextStyle(
                              fontSize: 19, fontWeight: FontWeight.w700)),
                    ),
                    OutlinedButton.icon(
                      onPressed: () => _showCreatePharmacyDialog(context),
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('Create Custom'),
                    ),
                    const SizedBox(width: 8),
                    FilledButton.icon(
                      onPressed: () => _showLinkPharmacyDialog(context, state),
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('Link Pharmacy'),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                if (state.collectionErrors['userPharmacies'] != null)
                  _MedicalInlineError(
                    message: state.collectionErrors['userPharmacies']!,
                    onRetry: () => _refresh(context),
                  ),
                if (state.userPharmacies.isEmpty)
                  const _MedicalEmpty(
                    title: 'No pharmacies linked yet',
                    subtitle: 'Add a pharmacy to start ordering refills.',
                  )
                else
                  ...state.userPharmacies.map(
                    (item) => _UserPharmacyCard(item: item),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AllergiesTab extends StatelessWidget {
  const _AllergiesTab({required this.state});

  final MedicalState state;

  @override
  Widget build(BuildContext context) {
    return _MedicalCollectionView(
      onRefresh: () => _refresh(context),
      emptyTitle: 'No sensitivities recorded',
      emptySubtitle: 'Add a sensitivity to get started.',
      addLabel: 'Add Sensitivity',
      errorMessage: state.collectionErrors['allergies'],
      onAdd: () => _showAllergyDialog(context),
      children: state.allergies
          .map(
            (item) => _MedicalCard(
              leading: Icons.warning_amber_rounded,
              title: item.allergen,
              badge: _BadgeData(
                item.severity,
                _severityColor(item.severity),
              ),
              details: [
                if (_hasText(item.reaction)) 'Reaction: ${item.reaction}',
                if (_hasText(item.notes)) item.notes!,
              ],
              onEdit: () => _showAllergyDialog(context, item),
              onDelete: () => _confirmDelete(
                context,
                title: 'Delete sensitivity?',
                message: 'This sensitivity will be removed from your records.',
                onConfirm: () =>
                    context.read<MedicalBloc>().add(DeleteAllergy(item.id)),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _AdverseMedicationsTab extends StatelessWidget {
  const _AdverseMedicationsTab({required this.state});

  final MedicalState state;

  @override
  Widget build(BuildContext context) {
    return _MedicalCollectionView(
      onRefresh: () => _refresh(context),
      emptyTitle: 'No reactions recorded',
      emptySubtitle: 'Add a reaction to get started.',
      addLabel: 'Add Reaction',
      errorMessage: state.collectionErrors['reactions'],
      onAdd: () => _showAdverseMedicationDialog(context),
      children: state.adverseMedications
          .map(
            (item) => _MedicalCard(
              leading: Icons.warning_amber_rounded,
              title: item.medicationName,
              badge: _BadgeData(item.severity, _severityColor(item.severity)),
              details: [
                'Reaction: ${item.reaction}',
                if (item.reactionDate != null)
                  'Date: ${_formatDate(item.reactionDate!)}',
                if (_hasText(item.notes)) item.notes!,
              ],
              onEdit: () => _showAdverseMedicationDialog(context, item),
              onDelete: () => _confirmDelete(
                context,
                title: 'Delete reaction?',
                message: 'This reaction will be removed from your records.',
                onConfirm: () => context
                    .read<MedicalBloc>()
                    .add(DeleteAdverseMedication(item.id)),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _ContactsTab extends StatelessWidget {
  const _ContactsTab({required this.state});

  final MedicalState state;

  @override
  Widget build(BuildContext context) {
    final emergency = state.emergencyContacts
        .where((contact) => contact.isEmergencyContact && !contact.isPrimary)
        .take(4)
        .toList();
    return _MedicalCollectionView(
      onRefresh: () => _refresh(context),
      emptyTitle: 'No contacts added yet',
      emptySubtitle: 'Add emergency contacts for quick access.',
      addLabel: 'Add Contact',
      errorMessage: state.collectionErrors['contacts'],
      header: emergency.isEmpty
          ? null
          : _QuickDial(contacts: emergency),
      onAdd: () => _showContactDialog(context),
      children: state.emergencyContacts
          .map(
            (item) => _MedicalCard(
              leading: item.isEmergencyContact
                  ? Icons.emergency_outlined
                  : Icons.phone_outlined,
              title: item.name,
              badge: item.isPrimary
                  ? const _BadgeData('Primary', Color(0xFF2563EB))
                  : item.isEmergencyContact
                      ? const _BadgeData('Emergency', Color(0xFFB91C1C))
                      : null,
              details: [
                if (_hasText(item.relationship)) item.relationship!,
                'Phone: ${item.phoneNumber}',
                if (_hasText(item.email)) 'Email: ${item.email}',
                if (_hasText(item.address)) item.address!,
                if (_hasText(item.notes)) item.notes!,
              ],
              onEdit: () => _showContactDialog(context, item),
              onDelete: () => _confirmDelete(
                context,
                title: 'Delete contact?',
                message: 'This contact will be removed from your records.',
                onConfirm: () => context
                    .read<MedicalBloc>()
                    .add(DeleteEmergencyContact(item.id)),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _ProvidersTab extends StatelessWidget {
  const _ProvidersTab({required this.state});

  final MedicalState state;

  @override
  Widget build(BuildContext context) {
    return _MedicalCollectionView(
      onRefresh: () => _refresh(context),
      emptyTitle: 'No healthcare contacts recorded',
      emptySubtitle: 'Add a healthcare contact to get started.',
      addLabel: 'Add Healthcare Contact',
      errorMessage: state.collectionErrors['providers'],
      onAdd: () => _showProviderDialog(context),
      children: state.primaryCareProviders
          .map(
            (item) => _MedicalCard(
              leading: Icons.local_hospital_outlined,
              title: item.name,
              badge: item.isPrimary
                  ? const _BadgeData('Primary', Color(0xFF16A34A))
                  : null,
              details: [
                item.specialty,
                if (_hasText(item.practiceName)) item.practiceName!,
                'Phone: ${item.phoneNumber}',
                if (_hasText(item.email)) 'Email: ${item.email}',
                if (_hasText(item.address)) item.address!,
                if (_hasText(item.notes)) item.notes!,
              ],
              onEdit: () => _showProviderDialog(context, item),
              onDelete: () => _confirmDelete(
                context,
                title: 'Delete healthcare contact?',
                message: 'This contact will be removed from your records.',
                onConfirm: () => context
                    .read<MedicalBloc>()
                    .add(DeletePrimaryCareProvider(item.id)),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _SymptomsTab extends StatelessWidget {
  const _SymptomsTab({required this.state});

  final MedicalState state;

  @override
  Widget build(BuildContext context) {
    return _MedicalCollectionView(
      onRefresh: () => _refresh(context),
      emptyTitle: 'No personal notes recorded',
      emptySubtitle: 'Log a symptom to identify patterns and triggers.',
      addLabel: 'Log Symptom',
      errorMessage: state.collectionErrors['symptoms'],
      onAdd: () => _showSymptomDialog(context),
      children: state.symptomEntries
          .map(
            (item) => _SymptomCard(
              entry: item,
              onEdit: () => _showSymptomDialog(context, item),
              onDelete: () => _confirmDelete(
                context,
                title: 'Delete personal note?',
                message: 'This symptom entry will be removed.',
                onConfirm: () => context
                    .read<MedicalBloc>()
                    .add(DeleteSymptomEntry(item.id)),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _MedicalCollectionView extends StatelessWidget {
  const _MedicalCollectionView({
    required this.onRefresh,
    required this.emptyTitle,
    required this.emptySubtitle,
    required this.addLabel,
    required this.onAdd,
    required this.children,
    this.errorMessage,
    this.header,
  });

  final Future<void> Function() onRefresh;
  final String emptyTitle;
  final String emptySubtitle;
  final String addLabel;
  final VoidCallback onAdd;
  final List<Widget> children;
  final String? errorMessage;
  final Widget? header;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: AppResponsive.pagePadding(context).add(
          const EdgeInsets.only(top: 16, bottom: 32),
        ),
        children: [
          Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 960),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (header != null) ...[header!, const SizedBox(height: 14)],
                  LayoutBuilder(
                    builder: (context, constraints) => constraints.maxWidth < 430
                        ? Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                emptyTitle.replaceFirst('No ', ''),
                                style: const TextStyle(
                                  fontSize: 19,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 10),
                              FilledButton.icon(
                                onPressed: onAdd,
                                icon: const Icon(Icons.add, size: 18),
                                label: Text(addLabel),
                              ),
                            ],
                          )
                        : Row(
                            children: [
                              Expanded(
                                child: Text(
                                  emptyTitle.replaceFirst('No ', ''),
                                  style: const TextStyle(
                                    fontSize: 19,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              FilledButton.icon(
                                onPressed: onAdd,
                                icon: const Icon(Icons.add, size: 18),
                                label: Text(addLabel),
                              ),
                            ],
                          ),
                  ),
                  const SizedBox(height: 14),
                  if (errorMessage != null)
                    _MedicalInlineError(
                      message: errorMessage!,
                      onRetry: onRefresh,
                    ),
                  if (errorMessage == null && children.isEmpty)
                    _MedicalEmpty(
                      title: emptyTitle,
                      subtitle: emptySubtitle,
                    )
                  else
                    ...children,
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SymptomCard extends StatelessWidget {
  const _SymptomCard({
    required this.entry,
    required this.onEdit,
    required this.onDelete,
  });

  final SymptomEntryModel entry;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    entry.symptomName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                _StatusBadge(
                  data: _BadgeData(
                    'Level ${entry.severity}',
                    _symptomSeverityColor(entry.severity),
                  ),
                ),
                PopupMenuButton<String>(
                  onSelected: (value) {
                    if (value == 'edit') onEdit();
                    if (value == 'delete') onDelete();
                  },
                  itemBuilder: (context) => const [
                    PopupMenuItem(value: 'edit', child: Text('Edit')),
                    PopupMenuItem(value: 'delete', child: Text('Delete')),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              _formatDateTime(entry.startTime),
              style: const TextStyle(color: Color(0xFF4B5563), fontSize: 13),
            ),
            if (entry.endTime != null)
              Text(
                'Ended: ${_formatDateTime(entry.endTime!)}',
                style: const TextStyle(color: Color(0xFF6B7280), fontSize: 13),
              ),
            if (_hasText(entry.location))
              Text(
                'Location: ${entry.location}',
                style: const TextStyle(color: Color(0xFF6B7280), fontSize: 13),
              ),
            if (_hasText(entry.description) ||
                _hasText(entry.triggers) ||
                _hasText(entry.notes)) ...[
              const Divider(height: 20),
              if (_hasText(entry.description)) Text(entry.description!),
              if (_hasText(entry.triggers))
                Text('Triggers: ${entry.triggers!}'),
              if (_hasText(entry.notes))
                Text(
                  entry.notes!,
                  style: const TextStyle(color: Color(0xFF6B7280)),
                ),
            ],
          ],
        ),
      ),
    );
  }
}

class _MedicalCard extends StatelessWidget {
  const _MedicalCard({
    required this.leading,
    required this.title,
    required this.details,
    required this.onEdit,
    required this.onDelete,
    this.badge,
  });

  final IconData leading;
  final String title;
  final _BadgeData? badge;
  final List<String> details;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              backgroundColor: const Color(0xFFEFF6FF),
              foregroundColor: const Color(0xFF2563EB),
              child: Icon(leading, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 5,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                      ),
                      if (badge != null) _StatusBadge(data: badge!),
                    ],
                  ),
                  ...details.map(
                    (detail) => Padding(
                      padding: const EdgeInsets.only(top: 5),
                      child: Text(
                        detail,
                        style: const TextStyle(
                          color: Color(0xFF6B7280),
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            PopupMenuButton<String>(
              onSelected: (value) {
                if (value == 'edit') onEdit();
                if (value == 'delete') onDelete();
              },
              itemBuilder: (context) => const [
                PopupMenuItem(value: 'edit', child: Text('Edit')),
                PopupMenuItem(value: 'delete', child: Text('Delete')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MedicationCard extends StatelessWidget {
  const _MedicationCard({
    required this.medication,
    required this.busy,
    required this.onEdit,
    required this.onDelete,
    required this.onSetReminder,
    required this.linkedPharmacy,
  });

  final MedicationModel medication;
  final bool busy;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onSetReminder;
  final PharmacyModel? linkedPharmacy;

  @override
  Widget build(BuildContext context) {
    final appearance = [
      medication.pillColor,
      medication.pillShape,
      medication.pillSize,
      medication.pillMarkings,
    ].where(_hasText).join(' • ');
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const CircleAvatar(
              backgroundColor: Color(0xFFEFF6FF),
              foregroundColor: Color(0xFF2563EB),
              child: Icon(Icons.medication_outlined),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    medication.medicationName,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                  if (_hasText(medication.dosage))
                    Text(
                      medication.dosage!,
                      style: const TextStyle(color: Color(0xFF6B7280)),
                    ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      _StatusBadge(
                        data: _BadgeData(
                          '${medication.refillsRemaining} refills left',
                          const Color(0xFF2563EB),
                        ),
                      ),
                      if (medication.nextRefillDate != null)
                        _StatusBadge(
                          data: _BadgeData(
                            'Next: ${_formatDate(medication.nextRefillDate!)}',
                            const Color(0xFF6B7280),
                          ),
                        ),
                    ],
                  ),
                  if (_hasText(appearance)) ...[
                    const SizedBox(height: 9),
                    Text(
                      'Pill appearance: $appearance',
                      style: const TextStyle(
                        color: Color(0xFF2563EB),
                        fontSize: 12,
                      ),
                    ),
                  ],
                  if (_hasText(medication.pillDescription))
                    Text(
                      medication.pillDescription!,
                      style: const TextStyle(
                        color: Color(0xFF6B7280),
                        fontSize: 12,
                      ),
                    ),
                  if (_hasText(medication.instructions))
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text(
                        medication.instructions!,
                        style: const TextStyle(
                          color: Color(0xFF4B5563),
                          fontSize: 13,
                        ),
                      ),
                    ),
                ],
              ),
            ),
             const SizedBox(width: 10),
             Column(
               crossAxisAlignment: CrossAxisAlignment.end,
               children: [
                 PopupMenuButton<String>(
                   onSelected: (value) {
                     if (value == 'edit') onEdit();
                     if (value == 'delete') onDelete();
                   },
                   itemBuilder: (context) => const [
                     PopupMenuItem(value: 'edit', child: Text('Edit')),
                     PopupMenuItem(value: 'delete', child: Text('Delete')),
                   ],
                 ),
                 FilledButton(
                    onPressed: busy || medication.refillsRemaining == 0
                       ? null
                       : onSetReminder,
                   child: Text(
                     medication.refillsRemaining == 0
                         ? 'No Refills'
                         : 'Set Refill Reminder',
                   ),
                 ),
                 if (linkedPharmacy?.refillUrl != null)
                   OutlinedButton.icon(
                     onPressed: () => _openExternalUrl(
                       context,
                       linkedPharmacy!.refillUrl!,
                     ),
                     icon: const Icon(Icons.refresh_rounded, size: 16),
                     label: const Text('Online'),
                   ),
                 if (busy)
                   const SizedBox(
                     width: 22,
                     height: 22,
                     child: CircularProgressIndicator(strokeWidth: 2),
                   ),
               ],
             ),
          ],
        ),
      ),
    );
  }
}

class _UserPharmacyCard extends StatelessWidget {
  const _UserPharmacyCard({required this.item});

  final UserPharmacyModel item;

  @override
  Widget build(BuildContext context) {
    final pharmacy = item.pharmacy;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.local_pharmacy_outlined,
                    color: Color(0xFF2563EB)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    pharmacy?.name ?? 'Pharmacy #${item.pharmacyId}',
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 16),
                  ),
                ),
                if (item.isPrimary)
                  const _StatusBadge(
                    data: _BadgeData('Primary', Color(0xFF16A34A)),
                  ),
              ],
            ),
            if (_hasText(pharmacy?.address))
              _PharmacyDetail(Icons.location_on_outlined, pharmacy!.address!),
            if (_hasText(pharmacy?.phoneNumber))
              _PharmacyDetail(Icons.phone_outlined, pharmacy!.phoneNumber!),
            if (_hasText(pharmacy?.hours))
              _PharmacyDetail(Icons.schedule_outlined, pharmacy!.hours!),
            if (_hasText(item.accountNumber))
              Text('Account: ${item.accountNumber}',
                  style: const TextStyle(color: Color(0xFF6B7280))),
            if (_hasText(item.insuranceProvider))
              Text('Insurance: ${item.insuranceProvider}',
                  style: const TextStyle(color: Color(0xFF6B7280))),
            if (pharmacy?.website != null || pharmacy?.refillUrl != null) ...[
              const Divider(height: 20),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (pharmacy?.website != null)
                    OutlinedButton.icon(
                      onPressed: () =>
                          _openExternalUrl(context, pharmacy!.website!),
                      icon: const Icon(Icons.public, size: 16),
                      label: const Text('Visit Website'),
                    ),
                  if (pharmacy?.refillUrl != null)
                    FilledButton.icon(
                      onPressed: () =>
                          _openExternalUrl(context, pharmacy!.refillUrl!),
                      icon: const Icon(Icons.refresh_rounded, size: 16),
                      label: const Text('Order Refills'),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PharmacyDetail extends StatelessWidget {
  const _PharmacyDetail(this.icon, this.value);

  final IconData icon;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 5),
        child: Row(
          children: [
            Icon(icon, size: 15, color: const Color(0xFF6B7280)),
            const SizedBox(width: 5),
            Expanded(
              child: Text(value,
                  style: const TextStyle(color: Color(0xFF6B7280))),
            ),
          ],
        ),
      );
}

class _QuickDial extends StatelessWidget {
  const _QuickDial({required this.contacts});

  final List<EmergencyContactModel> contacts;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: const Color(0xFFFFF1F2),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.warning_amber_rounded, color: Color(0xFFB91C1C)),
                SizedBox(width: 8),
                Text(
                  'Emergency Quick Dial',
                  style: TextStyle(
                    color: Color(0xFF991B1B),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: contacts
                  .map(
                    (contact) => OutlinedButton.icon(
                      onPressed: () => _showPhone(context, contact),
                      icon: const Icon(Icons.phone, size: 16),
                      label: Text(contact.name),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFB91C1C),
                        side: const BorderSide(color: Color(0xFFFCA5A5)),
                      ),
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

class _BadgeData {
  const _BadgeData(this.label, this.color);

  final String label;
  final Color color;
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.data});

  final _BadgeData data;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: data.color.withOpacity(.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        data.label,
        style: TextStyle(
          color: data.color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _MedicalEmpty extends StatelessWidget {
  const _MedicalEmpty({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          const Icon(
            Icons.folder_open_outlined,
            color: Color(0xFF9CA3AF),
            size: 48,
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              color: Color(0xFF4B5563),
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: const TextStyle(color: Color(0xFF6B7280)),
          ),
        ],
      ),
    );
  }
}

class _MedicalLoading extends StatelessWidget {
  const _MedicalLoading();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(height: 30, color: const Color(0xFFE5E7EB)),
        const SizedBox(height: 16),
        Container(height: 120, color: const Color(0xFFE5E7EB)),
        const SizedBox(height: 12),
        Container(height: 120, color: const Color(0xFFE5E7EB)),
      ],
    );
  }
}

class _MedicalError extends StatelessWidget {
  const _MedicalError({required this.message, required this.onRetry});

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
            const Icon(Icons.cloud_off_rounded,
                color: Color(0xFFB91C1C), size: 44),
            const SizedBox(height: 12),
            const Text(
              'We could not load your medical records.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF991B1B),
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            OutlinedButton.icon(
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

class _MedicalInlineError extends StatelessWidget {
  const _MedicalInlineError({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: const Color(0xFFFFF7ED),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(
              Icons.warning_amber_rounded,
              color: Color(0xFFC2410C),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'This section could not be loaded.',
                    style: TextStyle(
                      color: Color(0xFF9A3412),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message,
                    style: const TextStyle(color: Color(0xFF7C2D12)),
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: OutlinedButton.icon(
                      onPressed: () {
                        onRetry();
                      },
                      icon: const Icon(Icons.refresh_rounded, size: 16),
                      label: const Text('Try again'),
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
}

class _ResponsiveMedicalDialog extends StatelessWidget {
  const _ResponsiveMedicalDialog({
    required this.title,
    required this.content,
    required this.actions,
  });

  final Widget? title;
  final Widget? content;
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      insetPadding: EdgeInsets.symmetric(
        horizontal: AppResponsive.isCompact(context) ? 12 : 24,
        vertical: 24,
      ),
      title: title,
      content: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: AppResponsive.dialogWidth(context),
          maxHeight: AppResponsive.dialogMaxHeight(context),
        ),
        child: content,
      ),
      actions: actions,
    );
  }
}

class _MedicalDialogScope extends StatelessWidget {
  const _MedicalDialogScope({
    required this.bloc,
    required this.action,
    required this.successMessage,
    required this.builder,
  });

  final MedicalBloc bloc;
  final String action;
  final String successMessage;
  final Widget Function(BuildContext context, bool isSubmitting) builder;

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: bloc,
      child: BlocListener<MedicalBloc, MedicalState>(
        listenWhen: (previous, current) =>
            previous.actionMessage != current.actionMessage &&
            current.actionMessage == successMessage,
        listener: (dialogContext, state) {
          Future<void>.delayed(const Duration(milliseconds: 350), () {
            if (!dialogContext.mounted) return;
            Navigator.of(dialogContext).pop();
          });
        },
        child: BlocBuilder<MedicalBloc, MedicalState>(
          buildWhen: (previous, current) {
            if (previous.busySection == current.busySection) return false;
            if (current.busySection == action) return true;
            return current.busySection == null && current.errorMessage != null;
          },
          builder: (context, state) =>
              builder(context, state.busySection == action),
        ),
      ),
    );
  }
}

bool _medicalOverlayOpen = false;

Future<T?> _showMedicalDialog<T>({
  required BuildContext context,
  required WidgetBuilder builder,
}) async {
  if (_medicalOverlayOpen) return null;
  _medicalOverlayOpen = true;
  try {
    return await showDialog<T>(
      context: context,
      builder: builder,
    );
  } finally {
    _medicalOverlayOpen = false;
  }
}

Future<void> _showConditionDialog(
  BuildContext context, [
  MedicalConditionModel? existing,
]) async {
  final medicalBloc = context.read<MedicalBloc>();

  await _showMedicalDialog<void>(
    context: context,
    builder: (_) => _MedicalConditionDialog(
      bloc: medicalBloc,
      existing: existing,
    ),
  );
}

class _MedicalConditionDialog extends StatefulWidget {
  const _MedicalConditionDialog({
    required this.bloc,
    this.existing,
  });

  final MedicalBloc bloc;
  final MedicalConditionModel? existing;

  @override
  State<_MedicalConditionDialog> createState() =>
      _MedicalConditionDialogState();
}

class _MedicalConditionDialogState
    extends State<_MedicalConditionDialog> {
  late final TextEditingController _conditionController;
  late final TextEditingController _notesController;
  final _formKey = GlobalKey<FormState>();
  late String _status;
  late DateTime? _diagnosedDate;

  String get _successMessage => widget.existing == null
      ? 'Note added successfully.'
      : 'Note updated successfully.';

  @override
  void initState() {
    super.initState();
    _conditionController =
        TextEditingController(text: widget.existing?.condition ?? '');
    _notesController =
        TextEditingController(text: widget.existing?.notes ?? '');
    _status =
        _supportedValue(widget.existing?.status, _conditionStatuses) ?? '';
    _diagnosedDate = widget.existing?.diagnosedDate;
  }

  @override
  void dispose() {
    _conditionController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    final input = MedicalConditionInput(
      condition: _conditionController.text,
      status: _status,
      diagnosedDate: _diagnosedDate,
      notes: _notesController.text,
    );
    final existing = widget.existing;
    widget.bloc.add(
      existing == null
          ? AddCondition(input)
          : EditCondition(existing.id, input),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<MedicalBloc, MedicalState>(
      bloc: widget.bloc,
      listenWhen: (previous, current) =>
          previous.busySection == 'condition' &&
          current.busySection == null &&
          current.actionMessage == _successMessage,
      listener: (context, state) {
        if (mounted) Navigator.of(context).pop();
      },
      child: BlocBuilder<MedicalBloc, MedicalState>(
        bloc: widget.bloc,
        buildWhen: (previous, current) {
          if (previous.busySection == current.busySection) return false;
          if (current.busySection == 'condition') return true;
          return current.busySection == null && current.errorMessage != null;
        },
        builder: (context, state) {
          final isSubmitting = state.busySection == 'condition';
          final existing = widget.existing;
          return _ResponsiveMedicalDialog(
            title: Text(
              existing == null
                  ? 'Add Medical Condition'
                  : 'Edit Medical Condition',
            ),
            content: Form(
              key: _formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextFormField(
                      controller: _conditionController,
                      decoration: const InputDecoration(
                        labelText: 'Condition',
                        hintText: 'e.g., Diabetes, Asthma',
                      ),
                      validator: _requiredValidator,
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _status.isEmpty ? null : _status,
                      decoration: const InputDecoration(labelText: 'Status'),
                      items: _conditionStatuses
                          .map(
                            (value) => DropdownMenuItem(
                              value: value,
                              child: Text(_titleCase(value)),
                            ),
                          )
                          .toList(),
                      onChanged: (value) =>
                          setState(() => _status = value ?? ''),
                      validator: (value) =>
                          value == null ? 'Status is required' : null,
                    ),
                    const SizedBox(height: 12),
                    _DateField(
                      label: 'Diagnosed Date',
                      date: _diagnosedDate,
                      onPick: () async {
                        final date =
                            await _pickDate(context, _diagnosedDate);
                        if (!mounted || date == null) return;
                        setState(() => _diagnosedDate = date);
                      },
                      onClear: _diagnosedDate == null
                          ? null
                          : () => setState(() => _diagnosedDate = null),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _notesController,
                      minLines: 2,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        labelText: 'Notes',
                        hintText: 'Additional information',
                      ),
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: isSubmitting ? null : _submit,
                child: Text(
                  isSubmitting
                      ? (existing == null ? 'Adding...' : 'Updating...')
                      : (existing == null
                          ? 'Add Condition'
                          : 'Update Condition'),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

Future<void> _showAllergyDialog(
  BuildContext context, [
  AllergyModel? existing,
]) async {
  final medicalBloc = context.read<MedicalBloc>();
  final allergenController =
      TextEditingController(text: existing?.allergen ?? '');
  final reactionController =
      TextEditingController(text: existing?.reaction ?? '');
  final notesController = TextEditingController(text: existing?.notes ?? '');
  final formKey = GlobalKey<FormState>();
  var severity = _supportedValue(existing?.severity, _severities) ?? '';

  await _showMedicalDialog<void>(
    context: context,
    builder: (dialogContext) => _MedicalDialogScope(
      bloc: medicalBloc,
      action: 'allergy',
      successMessage: existing == null
          ? 'Sensitivity added successfully.'
          : 'Sensitivity updated successfully.',
      builder: (context, isSubmitting) => StatefulBuilder(
        builder: (context, setState) => _ResponsiveMedicalDialog(
        title: Text(existing == null ? 'Add New Allergy' : 'Edit Allergy'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: allergenController,
                  decoration: const InputDecoration(
                    labelText: 'Allergen',
                    hintText: 'e.g., Peanuts, Penicillin',
                  ),
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: severity.isEmpty ? null : severity,
                  decoration: const InputDecoration(labelText: 'Severity'),
                  items: _severities
                      .map((value) => DropdownMenuItem(
                            value: value,
                            child: Text(_titleCase(value)),
                          ))
                      .toList(),
                  onChanged: (value) => setState(() => severity = value ?? ''),
                  validator: (value) =>
                      value == null ? 'Severity is required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: reactionController,
                  decoration: const InputDecoration(
                    labelText: 'Reaction',
                    hintText: 'e.g., Hives, difficulty breathing',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: notesController,
                  minLines: 2,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    labelText: 'Notes',
                    hintText: 'Additional information',
                  ),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: isSubmitting
                ? null
                : () {
                    if (!formKey.currentState!.validate()) return;
                    final input = AllergyInput(
                      allergen: allergenController.text,
                      severity: severity,
                      reaction: reactionController.text,
                      notes: notesController.text,
                    );
                    medicalBloc.add(
                    existing == null
                        ? AddAllergy(input)
                        : EditAllergy(existing.id, input),
                  );
                  },
            child: Text(
              isSubmitting
                  ? (existing == null ? 'Adding...' : 'Updating...')
                  : (existing == null ? 'Add Allergy' : 'Update Allergy'),
            ),
          ),
        ],
      ),
      ),
    ),
  );
  allergenController.dispose();
  reactionController.dispose();
  notesController.dispose();
}

Future<void> _showAdverseMedicationDialog(
  BuildContext context, [
  AdverseMedicationModel? existing,
]) async {
  final medicalBloc = context.read<MedicalBloc>();
  final medicationController =
      TextEditingController(text: existing?.medicationName ?? '');
  final reactionController =
      TextEditingController(text: existing?.reaction ?? '');
  final notesController = TextEditingController(text: existing?.notes ?? '');
  final formKey = GlobalKey<FormState>();
  var severity = _supportedValue(existing?.severity, _severities) ?? '';
  var reactionDate = existing?.reactionDate;

  await _showMedicalDialog<void>(
    context: context,
    builder: (dialogContext) => _MedicalDialogScope(
      bloc: medicalBloc,
      action: 'reaction',
      successMessage: existing == null
          ? 'Reaction added successfully.'
          : 'Reaction updated successfully.',
      builder: (context, isSubmitting) => StatefulBuilder(
        builder: (context, setState) => _ResponsiveMedicalDialog(
        title: Text(
          existing == null ? 'Add Adverse Medication' : 'Edit Reaction',
        ),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: medicationController,
                  decoration: const InputDecoration(
                    labelText: 'Medication Name',
                    hintText: 'e.g., Amoxicillin, Aspirin',
                  ),
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: reactionController,
                  decoration: const InputDecoration(
                    labelText: 'Reaction',
                    hintText: 'e.g., Rash, nausea, dizziness',
                  ),
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: severity.isEmpty ? null : severity,
                  decoration: const InputDecoration(labelText: 'Severity'),
                  items: _severities
                      .map(
                        (value) => DropdownMenuItem(
                          value: value,
                          child: Text(_titleCase(value)),
                        ),
                      )
                      .toList(),
                  onChanged: (value) => setState(() => severity = value ?? ''),
                  validator: (value) =>
                      value == null ? 'Severity is required' : null,
                ),
                const SizedBox(height: 12),
                _DateField(
                  label: 'Reaction Date',
                  date: reactionDate,
                  onPick: () async {
                    final date = await _pickDate(context, reactionDate);
                    if (date != null) setState(() => reactionDate = date);
                  },
                  onClear: reactionDate == null
                      ? null
                      : () => setState(() => reactionDate = null),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: notesController,
                  minLines: 2,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    labelText: 'Notes',
                    hintText: 'Additional information',
                  ),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: isSubmitting
                ? null
                : () {
                    if (!formKey.currentState!.validate()) return;
                    final input = AdverseMedicationInput(
                      medicationName: medicationController.text,
                      reaction: reactionController.text,
                      severity: severity,
                      reactionDate: reactionDate,
                      notes: notesController.text,
                    );
                    medicalBloc.add(
                    existing == null
                        ? AddAdverseMedication(input)
                        : EditAdverseMedication(existing.id, input),
                  );
                  },
            child: Text(
              isSubmitting
                  ? (existing == null ? 'Adding...' : 'Updating...')
                  : (existing == null ? 'Add Reaction' : 'Update Reaction'),
            ),
          ),
        ],
      ),
      ),
    ),
  );
  medicationController.dispose();
  reactionController.dispose();
  notesController.dispose();
}

Future<void> _showProviderDialog(
  BuildContext context, [
  PrimaryCareProviderModel? existing,
]) async {
  final medicalBloc = context.read<MedicalBloc>();

  await _showMedicalDialog<void>(
    context: context,
    builder: (_) => _HealthcareContactDialog(
      bloc: medicalBloc,
      existing: existing,
    ),
  );
}

class _HealthcareContactDialog extends StatefulWidget {
  const _HealthcareContactDialog({
    required this.bloc,
    this.existing,
  });

  final MedicalBloc bloc;
  final PrimaryCareProviderModel? existing;

  @override
  State<_HealthcareContactDialog> createState() =>
      _HealthcareContactDialogState();
}

class _HealthcareContactDialogState
    extends State<_HealthcareContactDialog> {
  late final TextEditingController _nameController;
  late final TextEditingController _specialtyController;
  late final TextEditingController _practiceController;
  late final TextEditingController _phoneController;
  late final TextEditingController _emailController;
  late final TextEditingController _addressController;
  late final TextEditingController _notesController;
  final _formKey = GlobalKey<FormState>();
  late var _isPrimary = widget.existing?.isPrimary ?? false;

  String get _successMessage => widget.existing == null
      ? 'Healthcare contact added successfully.'
      : 'Healthcare contact updated successfully.';

  @override
  void initState() {
    super.initState();
    _nameController =
        TextEditingController(text: widget.existing?.name ?? '');
    _specialtyController =
        TextEditingController(text: widget.existing?.specialty ?? '');
    _practiceController =
        TextEditingController(text: widget.existing?.practiceName ?? '');
    _phoneController =
        TextEditingController(text: widget.existing?.phoneNumber ?? '');
    _emailController =
        TextEditingController(text: widget.existing?.email ?? '');
    _addressController =
        TextEditingController(text: widget.existing?.address ?? '');
    _notesController =
        TextEditingController(text: widget.existing?.notes ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _specialtyController.dispose();
    _practiceController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    final input = PrimaryCareProviderInput(
      name: _nameController.text,
      specialty: _specialtyController.text,
      practiceName: _practiceController.text,
      phoneNumber: _phoneController.text,
      email: _emailController.text,
      address: _addressController.text,
      isPrimary: _isPrimary,
      notes: _notesController.text,
    );
    final existing = widget.existing;
    widget.bloc.add(
      existing == null
          ? AddPrimaryCareProvider(input)
          : EditPrimaryCareProvider(existing.id, input),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<MedicalBloc, MedicalState>(
      bloc: widget.bloc,
      listenWhen: (previous, current) =>
          previous.busySection == 'provider' &&
          current.busySection == null &&
          current.actionMessage == _successMessage,
      listener: (context, state) {
        if (mounted) Navigator.of(context).pop();
      },
      child: BlocBuilder<MedicalBloc, MedicalState>(
        bloc: widget.bloc,
        buildWhen: (previous, current) {
          if (previous.busySection == current.busySection) return false;
          if (current.busySection == 'provider') return true;
          return current.busySection == null && current.errorMessage != null;
        },
        builder: (context, state) {
          final isSubmitting = state.busySection == 'provider';
          final existing = widget.existing;
          return _ResponsiveMedicalDialog(
            title: Text(
              existing == null
                  ? 'Add Primary Care Provider'
                  : 'Edit Healthcare Contact',
            ),
            content: Form(
              key: _formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Provider Name',
                        hintText: 'Dr. Smith',
                      ),
                      validator: _requiredValidator,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _specialtyController,
                      decoration: const InputDecoration(
                        labelText: 'Specialty',
                        hintText: 'e.g., Family Medicine, Cardiology',
                      ),
                      validator: _requiredValidator,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _practiceController,
                      decoration: const InputDecoration(
                        labelText: 'Practice Name',
                        hintText: 'Medical center or clinic name',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Phone Number',
                        hintText: 'Office phone number',
                      ),
                      validator: _providerPhoneValidator,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration:
                          const InputDecoration(labelText: 'Email'),
                      validator: _emailValidator,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _addressController,
                      minLines: 2,
                      maxLines: 3,
                      decoration:
                          const InputDecoration(labelText: 'Address'),
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Primary care provider'),
                      value: _isPrimary,
                      onChanged: (value) =>
                          setState(() => _isPrimary = value),
                    ),
                    TextFormField(
                      controller: _notesController,
                      minLines: 2,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        labelText: 'Notes',
                        hintText: 'Additional information',
                      ),
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: isSubmitting ? null : _submit,
                child: Text(
                  isSubmitting
                      ? (existing == null ? 'Adding...' : 'Updating...')
                      : (existing == null
                          ? 'Add Healthcare Contact'
                          : 'Update Contact'),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

Future<void> _showSymptomDialog(
  BuildContext context, [
  SymptomEntryModel? existing,
]) async {
  final medicalBloc = context.read<MedicalBloc>();

  await _showMedicalDialog<void>(
    context: context,
    builder: (_) => _SymptomDialog(
      bloc: medicalBloc,
      existing: existing,
    ),
  );
}

class _SymptomDialog extends StatefulWidget {
  const _SymptomDialog({
    required this.bloc,
    this.existing,
  });

  final MedicalBloc bloc;
  final SymptomEntryModel? existing;

  @override
  State<_SymptomDialog> createState() => _SymptomDialogState();
}

class _SymptomDialogState extends State<_SymptomDialog> {
  late final TextEditingController _nameController;
  late final TextEditingController _locationController;
  late final TextEditingController _triggersController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _notesController;
  final _formKey = GlobalKey<FormState>();
  late int _severity;
  late DateTime _startTime;
  late DateTime? _endTime;

  String get _successMessage => widget.existing == null
      ? 'Personal note added successfully.'
      : 'Personal note updated successfully.';

  @override
  void initState() {
    super.initState();
    _nameController =
        TextEditingController(text: widget.existing?.symptomName ?? '');
    _locationController =
        TextEditingController(text: widget.existing?.location ?? '');
    _triggersController =
        TextEditingController(text: widget.existing?.triggers ?? '');
    _descriptionController =
        TextEditingController(text: widget.existing?.description ?? '');
    _notesController =
        TextEditingController(text: widget.existing?.notes ?? '');
    _severity = (widget.existing?.severity ?? 1).clamp(1, 10).toInt();
    _startTime = widget.existing?.startTime ?? DateTime.now();
    _endTime = widget.existing?.endTime;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _locationController.dispose();
    _triggersController.dispose();
    _descriptionController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    final input = SymptomEntryInput(
      symptomName: _nameController.text,
      severity: _severity,
      startTime: _startTime,
      endTime: _endTime,
      triggers: _triggersController.text,
      location: _locationController.text,
      description: _descriptionController.text,
      notes: _notesController.text,
    );
    final existing = widget.existing;
    widget.bloc.add(
      existing == null
          ? AddSymptomEntry(input)
          : EditSymptomEntry(existing.id, input),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<MedicalBloc, MedicalState>(
      bloc: widget.bloc,
      listenWhen: (previous, current) =>
          previous.busySection == 'symptom' &&
          current.busySection == null &&
          current.actionMessage == _successMessage,
      listener: (context, state) {
        if (mounted) Navigator.of(context).pop();
      },
      child: BlocBuilder<MedicalBloc, MedicalState>(
        bloc: widget.bloc,
        buildWhen: (previous, current) {
          if (previous.busySection == current.busySection) return false;
          if (current.busySection == 'symptom') return true;
          return current.busySection == null && current.errorMessage != null;
        },
        builder: (context, state) {
          final isSubmitting = state.busySection == 'symptom';
          final existing = widget.existing;
          return _ResponsiveMedicalDialog(
            title: Text(
              existing == null ? 'Log New Symptom' : 'Edit Symptom Entry',
            ),
            content: Form(
              key: _formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Symptom Name',
                        hintText: 'e.g., Headache, Nausea, Pain',
                      ),
                      validator: _requiredValidator,
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<int>(
                      value: _severity,
                      decoration: const InputDecoration(
                        labelText: 'Severity (1-10)',
                      ),
                      items: List.generate(
                        10,
                        (index) => DropdownMenuItem(
                          value: index + 1,
                          child: Text(
                            '${index + 1} - '
                            '${_symptomSeverityLabel(index + 1)}',
                          ),
                        ),
                      ),
                      onChanged: (value) =>
                          setState(() => _severity = value ?? 1),
                    ),
                    const SizedBox(height: 12),
                    _DateTimeField(
                      label: 'Start Time',
                      value: _startTime,
                      onPick: () async {
                        final value =
                            await _pickDateTime(context, _startTime);
                        if (!mounted || value == null) return;
                        setState(() => _startTime = value);
                      },
                    ),
                    const SizedBox(height: 12),
                    _DateTimeField(
                      label: 'End Time (Optional)',
                      value: _endTime,
                      onPick: () async {
                        final value =
                            await _pickDateTime(context, _endTime);
                        if (!mounted || value == null) return;
                        setState(() => _endTime = value);
                      },
                      onClear: _endTime == null
                          ? null
                          : () => setState(() => _endTime = null),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _locationController,
                      decoration: const InputDecoration(
                        labelText: 'Location (Optional)',
                        hintText: 'e.g., Head, Stomach, Back',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _triggersController,
                      minLines: 2,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Possible Triggers (Optional)',
                        hintText: 'e.g., Stress, Food, Weather',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _descriptionController,
                      minLines: 2,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Description (Optional)',
                        hintText: 'Describe the symptom in detail',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _notesController,
                      minLines: 2,
                      maxLines: 3,
                      decoration: const InputDecoration(labelText: 'Notes'),
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: isSubmitting ? null : _submit,
                child: Text(
                  isSubmitting
                      ? (existing == null ? 'Adding...' : 'Updating...')
                      : (existing == null ? 'Add Entry' : 'Update Entry'),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

Future<void> _showContactDialog(
  BuildContext context, [
  EmergencyContactModel? existing,
]) async {
  final medicalBloc = context.read<MedicalBloc>();

  await _showMedicalDialog<void>(
    context: context,
    builder: (_) => _TrustedContactDialog(
      bloc: medicalBloc,
      existing: existing,
    ),
  );
}

class _TrustedContactDialog extends StatefulWidget {
  const _TrustedContactDialog({
    required this.bloc,
    this.existing,
  });

  final MedicalBloc bloc;
  final EmergencyContactModel? existing;

  @override
  State<_TrustedContactDialog> createState() => _TrustedContactDialogState();
}

class _TrustedContactDialogState extends State<_TrustedContactDialog> {
  late final TextEditingController _nameController;
  late final TextEditingController _relationshipController;
  late final TextEditingController _phoneController;
  late final TextEditingController _emailController;
  late final TextEditingController _addressController;
  late final TextEditingController _notesController;
  final _formKey = GlobalKey<FormState>();
  late var _isPrimary = widget.existing?.isPrimary ?? false;
  late var _isEmergency = widget.existing?.isEmergencyContact ?? true;

  String get _successMessage => widget.existing == null
      ? 'Trusted contact added successfully.'
      : 'Trusted contact updated successfully.';

  @override
  void initState() {
    super.initState();
    _nameController =
        TextEditingController(text: widget.existing?.name ?? '');
    _relationshipController =
        TextEditingController(text: widget.existing?.relationship ?? '');
    _phoneController =
        TextEditingController(text: widget.existing?.phoneNumber ?? '');
    _emailController =
        TextEditingController(text: widget.existing?.email ?? '');
    _addressController =
        TextEditingController(text: widget.existing?.address ?? '');
    _notesController =
        TextEditingController(text: widget.existing?.notes ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _relationshipController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    final input = EmergencyContactInput(
      name: _nameController.text,
      relationship: _relationshipController.text,
      phoneNumber: _phoneController.text,
      email: _emailController.text,
      address: _addressController.text,
      isPrimary: _isPrimary,
      isEmergencyContact: _isEmergency,
      notes: _notesController.text,
    );
    final existing = widget.existing;
    widget.bloc.add(
      existing == null
          ? AddEmergencyContact(input)
          : EditEmergencyContact(existing.id, input),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<MedicalBloc, MedicalState>(
      bloc: widget.bloc,
      listenWhen: (previous, current) =>
          previous.busySection == 'contact' &&
          current.busySection == null &&
          current.actionMessage == _successMessage,
      listener: (context, state) {
        if (mounted) Navigator.of(context).pop();
      },
      child: BlocBuilder<MedicalBloc, MedicalState>(
        bloc: widget.bloc,
        builder: (context, state) {
          final isSubmitting = state.busySection == 'contact';
          final existing = widget.existing;
          return _ResponsiveMedicalDialog(
            title: Text(existing == null ? 'Add Contact' : 'Edit Contact'),
            content: Form(
              key: _formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextFormField(
                      controller: _nameController,
                      enabled: !isSubmitting,
                      decoration: const InputDecoration(labelText: 'Name *'),
                      validator: _requiredValidator,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _relationshipController,
                      enabled: !isSubmitting,
                      decoration: const InputDecoration(
                        labelText: 'Relationship',
                        hintText: 'e.g., Parent, Sibling, Friend',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _phoneController,
                      enabled: !isSubmitting,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(10),
                      ],
                      decoration:
                          const InputDecoration(labelText: 'Phone Number *'),
                      validator: _phoneValidator,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _emailController,
                      enabled: !isSubmitting,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(labelText: 'Email'),
                      validator: _emailValidator,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _addressController,
                      enabled: !isSubmitting,
                      minLines: 2,
                      maxLines: 3,
                      decoration:
                          const InputDecoration(labelText: 'Address'),
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Primary contact'),
                      value: _isPrimary,
                      onChanged: isSubmitting
                          ? null
                          : (value) => setState(() => _isPrimary = value),
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Emergency contact'),
                      value: _isEmergency,
                      onChanged: isSubmitting
                          ? null
                          : (value) => setState(() => _isEmergency = value),
                    ),
                    TextFormField(
                      controller: _notesController,
                      enabled: !isSubmitting,
                      minLines: 2,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        labelText: 'Notes',
                        hintText: 'Special instructions or notes',
                      ),
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: isSubmitting
                    ? null
                    : () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: isSubmitting ? null : _submit,
                child: Text(
                  isSubmitting
                      ? (existing == null ? 'Adding...' : 'Updating...')
                      : (existing == null ? 'Save Contact' : 'Update Contact'),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

Future<void> _showMedicationDialog(
  BuildContext context,
  MedicalState state,
  [
  MedicationModel? existing,
  ]
) async {
  final medicalBloc = context.read<MedicalBloc>();

  await _showMedicalDialog<void>(
    context: context,
    builder: (_) => _MedicationDialog(
      bloc: medicalBloc,
      existing: existing,
      userPharmacies: state.userPharmacies,
    ),
  );
}

class _MedicationDialog extends StatefulWidget {
  const _MedicationDialog({
    required this.bloc,
    required this.userPharmacies,
    this.existing,
  });

  final MedicalBloc bloc;
  final List<UserPharmacyModel> userPharmacies;
  final MedicationModel? existing;

  @override
  State<_MedicationDialog> createState() => _MedicationDialogState();
}

class _MedicationDialogState extends State<_MedicationDialog> {
  late final TextEditingController _nameController;
  late final TextEditingController _dosageController;
  late final TextEditingController _prescriptionController;
  late final TextEditingController _quantityController;
  late final TextEditingController _refillsController;
  late final TextEditingController _prescribedByController;
  late final TextEditingController _instructionsController;
  late final TextEditingController _colorController;
  late final TextEditingController _markingsController;
  late final TextEditingController _descriptionController;
  final _formKey = GlobalKey<FormState>();
  late String _shape;
  late String _size;
  late int? _pharmacyId;
  late DateTime? _nextRefillDate;

  bool get _isEditing => widget.existing != null;

  String get _successMessage => _isEditing
      ? 'Medication updated successfully.'
      : 'Medication added successfully.';

  @override
  void initState() {
    super.initState();
    final existing = widget.existing;
    _nameController =
        TextEditingController(text: existing?.medicationName ?? '');
    _dosageController = TextEditingController(text: existing?.dosage ?? '');
    _prescriptionController =
        TextEditingController(text: existing?.prescriptionNumber ?? '');
    _quantityController = TextEditingController(
      text: existing?.quantity?.toString() ?? '',
    );
    _refillsController = TextEditingController(
      text: existing?.refillsRemaining.toString() ?? '',
    );
    _prescribedByController =
        TextEditingController(text: existing?.prescribedBy ?? '');
    _instructionsController =
        TextEditingController(text: existing?.instructions ?? '');
    _colorController =
        TextEditingController(text: existing?.pillColor ?? '');
    _markingsController =
        TextEditingController(text: existing?.pillMarkings ?? '');
    _descriptionController =
        TextEditingController(text: existing?.pillDescription ?? '');
    _shape = _supportedValue(existing?.pillShape, _pillShapes) ?? '';
    _size = _supportedValue(existing?.pillSize, _pillSizes) ?? '';
    final primaryPharmacies =
        widget.userPharmacies.where((item) => item.isPrimary).toList();
    _pharmacyId = existing?.pharmacyId ??
        (primaryPharmacies.isEmpty ? null : primaryPharmacies.first.pharmacyId);
    _nextRefillDate = existing?.nextRefillDate;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _dosageController.dispose();
    _prescriptionController.dispose();
    _quantityController.dispose();
    _refillsController.dispose();
    _prescribedByController.dispose();
    _instructionsController.dispose();
    _colorController.dispose();
    _markingsController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    final input = MedicationInput(
      medicationName: _nameController.text,
      dosage: _dosageController.text,
      prescriptionNumber: _prescriptionController.text,
      quantity: _parseInt(_quantityController.text),
      refillsRemaining: _parseInt(_refillsController.text),
      prescribedBy: _prescribedByController.text,
      pharmacyId: _pharmacyId,
      nextRefillDate: _nextRefillDate,
      instructions: _instructionsController.text,
      pillColor: _colorController.text,
      pillShape: _shape,
      pillSize: _size,
      pillMarkings: _markingsController.text,
      pillDescription: _descriptionController.text,
    );
    final existing = widget.existing;
    widget.bloc.add(
      existing == null
          ? AddMedication(input)
          : EditMedication(existing.id, input),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<MedicalBloc, MedicalState>(
      bloc: widget.bloc,
      listenWhen: (previous, current) =>
          previous.actionMessage != current.actionMessage &&
          current.actionMessage == _successMessage,
      listener: (context, state) {
        Future<void>.delayed(const Duration(milliseconds: 350), () {
          if (!mounted) return;
          Navigator.of(context).pop();
        });
      },
      child: BlocBuilder<MedicalBloc, MedicalState>(
        bloc: widget.bloc,
        buildWhen: (previous, current) {
          if (previous.busySection == current.busySection) return false;
          if (current.busySection == 'medication') return true;
          return current.busySection == null && current.errorMessage != null;
        },
        builder: (context, state) {
          final isSubmitting = state.busySection == 'medication';
          final existing = widget.existing;
          return _ResponsiveMedicalDialog(
            title: Text(existing == null
                ? 'Add New Medication'
                : 'Edit Medication'),
            content: Form(
              key: _formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextFormField(
                      controller: _nameController,
                      enabled: !isSubmitting,
                      decoration:
                          const InputDecoration(labelText: 'Medication Name'),
                      validator: _requiredValidator,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _dosageController,
                      enabled: !isSubmitting,
                      decoration: const InputDecoration(
                        labelText: 'Dosage',
                        hintText: 'e.g., 10mg',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _prescriptionController,
                      enabled: !isSubmitting,
                      decoration: const InputDecoration(
                          labelText: 'Prescription Number'),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _quantityController,
                            enabled: !isSubmitting,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                                labelText: 'Quantity'),
                            validator: _optionalNonNegativeIntValidator,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextFormField(
                            controller: _refillsController,
                            enabled: !isSubmitting,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                                labelText: 'Refills Left'),
                            validator: _optionalNonNegativeIntValidator,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _prescribedByController,
                      enabled: !isSubmitting,
                      decoration: const InputDecoration(
                        labelText: 'Prescribed By',
                        hintText: 'e.g., Dr. Smith',
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<int>(
                      value: _pharmacyId,
                      decoration: const InputDecoration(labelText: 'Pharmacy'),
                      items: widget.userPharmacies
                          .map(
                            (item) => DropdownMenuItem<int>(
                              value: item.pharmacyId,
                              child: Text(
                                item.pharmacy?.name ??
                                    'Pharmacy #${item.pharmacyId}',
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: isSubmitting
                          ? null
                          : (value) => setState(() => _pharmacyId = value),
                    ),
                    const SizedBox(height: 12),
                    _DateField(
                      label: 'Next Refill Date',
                      date: _nextRefillDate,
                      onPick: isSubmitting ? () {} : _pickNextRefillDate,
                      onClear: isSubmitting || _nextRefillDate == null
                          ? null
                          : () => setState(() => _nextRefillDate = null),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _instructionsController,
                      enabled: !isSubmitting,
                      decoration: const InputDecoration(
                        labelText: 'Instructions',
                        hintText: 'Take with food',
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Pill Appearance (Optional)',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _colorController,
                      enabled: !isSubmitting,
                      decoration: const InputDecoration(
                        labelText: 'Color',
                        hintText: 'e.g., White, Blue',
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _shape.isEmpty ? null : _shape,
                      decoration: const InputDecoration(labelText: 'Shape'),
                      items: _pillShapes
                          .map(
                            (value) => DropdownMenuItem(
                              value: value,
                              child: Text(_titleCase(value)),
                            ),
                          )
                          .toList(),
                      onChanged: isSubmitting
                          ? null
                          : (value) => setState(() => _shape = value ?? ''),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _size.isEmpty ? null : _size,
                      decoration: const InputDecoration(labelText: 'Size'),
                      items: _pillSizes
                          .map(
                            (value) => DropdownMenuItem(
                              value: value,
                              child: Text(_titleCase(value)),
                            ),
                          )
                          .toList(),
                      onChanged: isSubmitting
                          ? null
                          : (value) => setState(() => _size = value ?? ''),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _markingsController,
                      enabled: !isSubmitting,
                      decoration: const InputDecoration(
                        labelText: 'Markings/Imprint',
                        hintText: 'e.g., TYLENOL 500',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _descriptionController,
                      enabled: !isSubmitting,
                      decoration: const InputDecoration(
                        labelText: 'Additional Description',
                        hintText: 'e.g., Scored tablet, film-coated',
                      ),
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: isSubmitting
                    ? null
                    : () {
                        if (mounted) Navigator.of(context).pop();
                      },
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: isSubmitting ? null : _submit,
                child: Text(
                  isSubmitting
                      ? (existing == null ? 'Adding...' : 'Updating...')
                      : (existing == null
                          ? 'Add Medication'
                          : 'Update Medication'),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _pickNextRefillDate() async {
    final date = await _pickDate(
      context,
      _nextRefillDate,
      allowFuture: true,
    );
    if (!mounted || date == null) return;
    setState(() => _nextRefillDate = date);
  }
}

PharmacyModel? _pharmacyForMedication(
  MedicationModel medication,
  MedicalState state,
) {
  final linked = state.userPharmacies.where(
    (item) => item.pharmacyId == medication.pharmacyId,
  );
  if (linked.isNotEmpty) return linked.first.pharmacy;
  return null;
}

Future<void> _setRefillReminder(
  BuildContext context,
  MedicationModel medication,
  MedicalState state,
) async {
  if (medication.refillsRemaining == 0) return;
  final linked = state.userPharmacies.where(
    (item) => item.pharmacyId == medication.pharmacyId,
  );
  final primary = state.userPharmacies.where((item) => item.isPrimary);
  final pharmacyId = primary.isNotEmpty
      ? primary.first.pharmacyId
      : medication.pharmacyId ??
          (linked.isNotEmpty
              ? linked.first.pharmacyId
              : state.userPharmacies.isNotEmpty
                  ? state.userPharmacies.first.pharmacyId
                  : null);
  if (pharmacyId == null) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        const SnackBar(
          content: Text('Link a pharmacy before setting a refill reminder.'),
        ),
      );
    return;
  }
  context.read<MedicalBloc>().add(
        CreateRefillReminder(
          RefillOrderInput(
            medicationId: medication.id,
            pharmacyId: pharmacyId,
          ),
        ),
      );
}

Color _refillStatusColor(String status) {
  switch (status.toLowerCase()) {
    case 'ready':
      return const Color(0xFF16A34A);
    case 'processing':
      return const Color(0xFF2563EB);
    case 'pending':
      return const Color(0xFFD97706);
    default:
      return const Color(0xFF6B7280);
  }
}

Future<void> _openExternalUrl(BuildContext context, String value) async {
  final uri = Uri.tryParse(value);
  if (uri == null || !(await canLaunchUrl(uri))) {
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Unable to open this pharmacy link.')),
    );
    return;
  }
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}

Future<void> _showCreatePharmacyDialog(BuildContext context) async {
  final medicalBloc = context.read<MedicalBloc>();
  final nameController = TextEditingController();
  final addressController = TextEditingController();
  final phoneController = TextEditingController();
  final websiteController = TextEditingController();
  final refillUrlController = TextEditingController();
  final hoursController = TextEditingController();
  final formKey = GlobalKey<FormState>();

  await _showMedicalDialog<void>(
    context: context,
    builder: (dialogContext) => _MedicalDialogScope(
      bloc: medicalBloc,
      action: 'pharmacy',
      successMessage: 'Custom pharmacy created successfully.',
      builder: (context, isSubmitting) => _ResponsiveMedicalDialog(
        title: const Text('Add Custom Pharmacy'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Pharmacy Name'),
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: addressController,
                  decoration: const InputDecoration(labelText: 'Address'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: phoneController,
                  decoration: const InputDecoration(labelText: 'Phone Number'),
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: websiteController,
                  decoration: const InputDecoration(labelText: 'Website'),
                  keyboardType: TextInputType.url,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: refillUrlController,
                  decoration:
                      const InputDecoration(labelText: 'Online Refill URL'),
                  keyboardType: TextInputType.url,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: hoursController,
                  decoration: const InputDecoration(labelText: 'Hours'),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: isSubmitting
                ? null
                : () {
                    if (!formKey.currentState!.validate()) return;
                    medicalBloc.add(
                      AddCustomPharmacy(
                        PharmacyInput(
                          name: nameController.text,
                          address: addressController.text,
                          phoneNumber: phoneController.text,
                          website: websiteController.text,
                          refillUrl: refillUrlController.text,
                          hours: hoursController.text,
                        ),
                      ),
                    );
                  },
            child: Text(isSubmitting ? 'Creating...' : 'Create Pharmacy'),
          ),
        ],
      ),
    ),
  );

  for (final controller in [
    nameController,
    addressController,
    phoneController,
    websiteController,
    refillUrlController,
    hoursController,
  ]) {
    controller.dispose();
  }
}

Future<void> _showLinkPharmacyDialog(
  BuildContext context,
  MedicalState state,
) async {
  if (state.pharmacies.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('No available pharmacies were found to link.'),
      ),
    );
    return;
  }

  final medicalBloc = context.read<MedicalBloc>();
  final accountController = TextEditingController();
  final membershipController = TextEditingController();
  final insuranceController = TextEditingController();
  final formKey = GlobalKey<FormState>();
  int? pharmacyId;
  var isPrimary = false;
  var autoRefillEnabled = false;

  await _showMedicalDialog<void>(
    context: context,
    builder: (dialogContext) => _MedicalDialogScope(
      bloc: medicalBloc,
      action: 'userPharmacy',
      successMessage: 'Pharmacy added to your account.',
      builder: (context, isSubmitting) => StatefulBuilder(
        builder: (context, setState) => _ResponsiveMedicalDialog(
          title: const Text('Add Pharmacy to Your Account'),
          content: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<int>(
                    value: pharmacyId,
                    decoration: const InputDecoration(
                      labelText: 'Select Pharmacy',
                    ),
                    items: state.pharmacies
                        .where((item) => item.isActive)
                        .map(
                          (item) => DropdownMenuItem<int>(
                            value: item.id,
                            child: Text(item.name),
                          ),
                        )
                        .toList(),
                    validator: (value) =>
                        value == null ? 'Select a pharmacy' : null,
                    onChanged: (value) => setState(() => pharmacyId = value),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: accountController,
                    decoration:
                        const InputDecoration(labelText: 'Account Number'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: membershipController,
                    decoration: const InputDecoration(
                      labelText: 'Membership/Insurance ID',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: insuranceController,
                    decoration:
                        const InputDecoration(labelText: 'Insurance Provider'),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Set as primary pharmacy'),
                    value: isPrimary,
                    onChanged: (value) => setState(() => isPrimary = value),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Enable automatic refills'),
                    value: autoRefillEnabled,
                    onChanged: (value) =>
                        setState(() => autoRefillEnabled = value),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: isSubmitting
                  ? null
                  : () {
                      if (!formKey.currentState!.validate() ||
                          pharmacyId == null) {
                        return;
                      }
                      medicalBloc.add(
                        LinkPharmacy(
                          UserPharmacyInput(
                            pharmacyId: pharmacyId!,
                            isPrimary: isPrimary,
                            accountNumber: accountController.text,
                            membershipId: membershipController.text,
                            insuranceProvider: insuranceController.text,
                            autoRefillEnabled: autoRefillEnabled,
                          ),
                        ),
                      );
                    },
              child: Text(isSubmitting ? 'Adding...' : 'Add Pharmacy'),
            ),
          ],
        ),
      ),
    ),
  );

  for (final controller in [
    accountController,
    membershipController,
    insuranceController,
  ]) {
    controller.dispose();
  }
}

Future<void> _refresh(BuildContext context) async {
  final bloc = context.read<MedicalBloc>();
  final completion = bloc.stream.firstWhere(
    (state) =>
        (state.status == MedicalStatus.loaded ||
            state.status == MedicalStatus.failure) &&
        state.busySection == null,
  );
  bloc.add(const RefreshMedical());
  await completion;
}

Future<void> _confirmDelete(
  BuildContext context, {
  required String title,
  required String message,
  required VoidCallback onConfirm,
}) async {
  final confirmed = await _showMedicalDialog<bool>(
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

Future<void> _showPhone(
  BuildContext context,
  EmergencyContactModel contact,
) async {
  final phoneUri = Uri(
    scheme: 'tel',
    path: contact.phoneNumber,
  );
  if (await canLaunchUrl(phoneUri)) {
    await launchUrl(phoneUri);
    return;
  }
  await _showMedicalDialog<void>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: Text(contact.name),
      content: Text('Phone: ${contact.phoneNumber}'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(dialogContext),
          child: const Text('Close'),
        ),
      ],
    ),
  );
}

class _DateField extends StatelessWidget {
  const _DateField({
    required this.label,
    required this.date,
    required this.onPick,
    this.onClear,
  });

  final String label;
  final DateTime? date;
  final VoidCallback onPick;
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPick,
      borderRadius: BorderRadius.circular(4),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: onClear == null
              ? const Icon(Icons.calendar_today_outlined, size: 18)
              : IconButton(
                  onPressed: onClear,
                  icon: const Icon(Icons.clear, size: 18),
                ),
          border: const OutlineInputBorder(),
        ),
        child: Text(
          date == null ? 'Select date' : _formatDate(date!),
          style: TextStyle(
            color: date == null
                ? const Color(0xFF6B7280)
                : const Color(0xFF111827),
          ),
        ),
      ),
    );
  }
}

class _DateTimeField extends StatelessWidget {
  const _DateTimeField({
    required this.label,
    required this.value,
    required this.onPick,
    this.onClear,
  });

  final String label;
  final DateTime? value;
  final VoidCallback onPick;
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPick,
      borderRadius: BorderRadius.circular(4),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: onClear == null
              ? const Icon(Icons.schedule_outlined, size: 18)
              : IconButton(
                  onPressed: onClear,
                  icon: const Icon(Icons.clear, size: 18),
                ),
          border: const OutlineInputBorder(),
        ),
        child: Text(
          value == null ? 'Select date and time' : _formatDateTime(value!),
          style: TextStyle(
            color: value == null
                ? const Color(0xFF6B7280)
                : const Color(0xFF111827),
          ),
        ),
      ),
    );
  }
}

Future<DateTime?> _pickDate(
  BuildContext context,
  DateTime? current, {
  bool allowFuture = false,
}) {
  final now = DateTime.now();
  final firstDate = DateTime(1900);
  final lastDate = allowFuture ? DateTime(now.year + 20) : now;
  final initialDate = _clampDate(
    current?.toLocal() ?? now,
    firstDate,
    lastDate,
  );
  return showDatePicker(
    context: context,
    initialDate: initialDate,
    firstDate: firstDate,
    lastDate: lastDate,
  );
}

Future<DateTime?> _pickDateTime(BuildContext context, DateTime? current) async {
  final now = DateTime.now();
  final firstDate = DateTime(1900);
  final lastDate = DateTime(now.year + 20);
  final initialDate = _clampDate(
    current?.toLocal() ?? now,
    firstDate,
    lastDate,
  );
  final date = await showDatePicker(
    context: context,
    initialDate: initialDate,
    firstDate: firstDate,
    lastDate: lastDate,
  );
  if (date == null || !context.mounted) return null;
  final time = await showTimePicker(
    context: context,
    initialTime: current == null
        ? TimeOfDay.fromDateTime(now)
        : TimeOfDay.fromDateTime(current),
  );
  if (time == null) return null;
  return DateTime(date.year, date.month, date.day, time.hour, time.minute);
}

String? _requiredValidator(String? value) {
  if (value == null || value.trim().isEmpty) return 'This field is required';
  return null;
}

String? _phoneValidator(String? value) {
  if (value == null || value.trim().isEmpty) return 'Phone number is required';
  if (!RegExp(r'^\d{10}$').hasMatch(value.trim())) {
    return 'Enter a valid 10-digit phone number';
  }
  return null;
}

String? _providerPhoneValidator(String? value) {
  if (value == null || value.trim().isEmpty) return 'Phone number is required';
  final trimmed = value.trim();
  if (!RegExp(r'^[0-9+\-()\s]+$').hasMatch(trimmed) ||
      !RegExp(r'\d').hasMatch(trimmed)) {
    return 'Enter a valid phone number';
  }
  return null;
}

String? _emailValidator(String? value) {
  if (value == null || value.trim().isEmpty) return null;
  if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value.trim())) {
    return 'Enter a valid email address';
  }
  return null;
}

String? _optionalNonNegativeIntValidator(String? value) {
  if (value == null || value.trim().isEmpty) return null;
  final parsed = int.tryParse(value.trim());
  if (parsed == null || parsed < 0) return 'Enter a whole number of 0 or more';
  return null;
}

int? _parseInt(String value) {
  if (value.trim().isEmpty) return null;
  return int.tryParse(value.trim());
}

bool _hasText(String? value) => value != null && value.trim().isNotEmpty;

String? _supportedValue(String? value, List<String> supported) {
  final normalized = value?.trim().toLowerCase();
  if (normalized == null || !supported.contains(normalized)) return null;
  return normalized;
}

DateTime _clampDate(DateTime value, DateTime first, DateTime last) {
  if (value.isBefore(first)) return first;
  if (value.isAfter(last)) return last;
  return value;
}

String _formatDate(DateTime date) {
  final local = date.toLocal();
  return '${local.month}/${local.day}/${local.year}';
}

String _formatDateTime(DateTime date) {
  final local = date.toLocal();
  final hour = local.hour == 0
      ? 12
      : local.hour > 12
          ? local.hour - 12
          : local.hour;
  final minute = local.minute.toString().padLeft(2, '0');
  final period = local.hour >= 12 ? 'PM' : 'AM';
  return '${_formatDate(local)} at $hour:$minute $period';
}

String _symptomSeverityLabel(int severity) {
  const labels = [
    'Very Mild',
    'Mild',
    'Mild-Moderate',
    'Moderate',
    'Moderate',
    'Moderate-Severe',
    'Severe',
    'Severe',
    'Very Severe',
    'Extreme',
  ];
  final index = severity.clamp(1, 10).toInt() - 1;
  return labels[index];
}

Color _symptomSeverityColor(int severity) {
  if (severity <= 2) return const Color(0xFF16A34A);
  if (severity <= 4) return const Color(0xFFCA8A04);
  if (severity <= 6) return const Color(0xFFEA580C);
  return const Color(0xFFB91C1C);
}

String _titleCase(String value) {
  return value
      .split('-')
      .map(
        (part) => part.isEmpty
            ? part
            : '${part[0].toUpperCase()}${part.substring(1)}',
      )
      .join(' ');
}

Color _statusColor(String status) {
  switch (status) {
    case 'active':
      return const Color(0xFFB91C1C);
    case 'resolved':
      return const Color(0xFF16A34A);
    default:
      return const Color(0xFF4B5563);
  }
}

Color _severityColor(String severity) {
  switch (severity) {
    case 'mild':
      return const Color(0xFFCA8A04);
    case 'moderate':
      return const Color(0xFFEA580C);
    case 'severe':
    case 'life-threatening':
      return const Color(0xFFB91C1C);
    default:
      return const Color(0xFF4B5563);
  }
}

const _conditionStatuses = ['active', 'inactive', 'resolved'];
const _severities = ['mild', 'moderate', 'severe', 'life-threatening'];
const _pillShapes = [
  'round',
  'oval',
  'oblong',
  'capsule',
  'square',
  'triangle',
  'diamond',
  'other',
];
const _pillSizes = ['small', 'medium', 'large', 'extra-large'];