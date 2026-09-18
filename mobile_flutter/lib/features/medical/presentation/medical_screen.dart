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
              bottom: const TabBar(
                isScrollable: true,
                tabs: [
                  Tab(text: 'Sensitivities'),
                  Tab(text: 'Notes'),
                  Tab(text: 'Reactions'),
                  Tab(text: 'Trusted Contacts'),
                  Tab(text: 'Healthcare Contacts'),
                  Tab(text: 'Personal Notes'),
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
  const _MedicalPremiumPrompt();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Health Records')),
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
                  const Text(
                    'Health Records',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Store personal health-related details such as sensitivities and trusted contacts for reference.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Color(0xFF4B5563)),
                  ),
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    onPressed: () => context.push('/subscription'),
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
  const _MedicalAppBar();

  @override
  Widget build(BuildContext context) =>
      AppBar(title: const Text('Health Records'));

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
    return _MedicalCollectionView(
      onRefresh: () => _refresh(context),
      emptyTitle: 'No medications added yet',
      emptySubtitle: 'Add medications to keep your list available.',
      addLabel: 'Add Medication',
      onAdd: () => _showMedicationDialog(context),
      children: state.medications
          .map(
            (item) => _MedicationCard(
              medication: item,
              busy: state.busySection == 'medication',
            ),
          )
          .toList(),
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
  });

  final MedicationModel medication;
  final bool busy;

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
            if (busy)
              const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
          ],
        ),
      ),
    );
  }
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
    final mediaQuery = MediaQuery.of(context);
    final availableHeight =
        mediaQuery.size.height - mediaQuery.viewInsets.bottom;

    return AlertDialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      title: title,
      content: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: (mediaQuery.size.width - 32)
              .clamp(0.0, 560.0)
              .toDouble(),
          maxHeight: (availableHeight - 180)
              .clamp(120.0, 600.0)
              .toDouble(),
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
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (dialogContext.mounted) {
              Navigator.of(dialogContext).pop();
            }
          });
        },
        child: BlocBuilder<MedicalBloc, MedicalState>(
          buildWhen: (previous, current) =>
              previous.busySection != current.busySection &&
              (previous.busySection == action || current.busySection == action),
          builder: (context, state) =>
              builder(context, state.busySection == action),
        ),
      ),
    );
  }
}

Future<void> _showConditionDialog(
  BuildContext context, [
  MedicalConditionModel? existing,
]) async {
  final medicalBloc = context.read<MedicalBloc>();
  final conditionController =
      TextEditingController(text: existing?.condition ?? '');
  final notesController = TextEditingController(text: existing?.notes ?? '');
  final formKey = GlobalKey<FormState>();
  var status = _supportedValue(existing?.status, _conditionStatuses) ?? '';
  var diagnosedDate = existing?.diagnosedDate;

  await showDialog<void>(
    context: context,
    builder: (dialogContext) => _MedicalDialogScope(
      bloc: medicalBloc,
      action: 'condition',
      successMessage: existing == null
          ? 'Note added successfully.'
          : 'Note updated successfully.',
      builder: (context, isSubmitting) => StatefulBuilder(
        builder: (context, setState) => _ResponsiveMedicalDialog(
        title: Text(existing == null ? 'Add Medical Condition' : 'Edit Medical Condition'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: conditionController,
                  decoration: const InputDecoration(
                    labelText: 'Condition',
                    hintText: 'e.g., Diabetes, Asthma',
                  ),
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: status.isEmpty ? null : status,
                  decoration: const InputDecoration(labelText: 'Status'),
                  items: _conditionStatuses
                      .map((value) => DropdownMenuItem(
                            value: value,
                            child: Text(_titleCase(value)),
                          ))
                      .toList(),
                  onChanged: (value) => setState(() => status = value ?? ''),
                  validator: (value) =>
                      value == null ? 'Status is required' : null,
                ),
                const SizedBox(height: 12),
                _DateField(
                  label: 'Diagnosed Date',
                  date: diagnosedDate,
                  onPick: () async {
                    final date = await _pickDate(context, diagnosedDate);
                    if (date != null) setState(() => diagnosedDate = date);
                  },
                  onClear: diagnosedDate == null
                      ? null
                      : () => setState(() => diagnosedDate = null),
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
              final input = MedicalConditionInput(
                condition: conditionController.text,
                status: status,
                diagnosedDate: diagnosedDate,
                notes: notesController.text,
              );
              medicalBloc.add(
                existing == null
                    ? AddCondition(input)
                    : EditCondition(existing.id, input),
              );
            },
            child: Text(
              isSubmitting
                  ? (existing == null ? 'Adding...' : 'Updating...')
                  : (existing == null ? 'Add Condition' : 'Update Condition'),
            ),
          ),
        ],
      ),
      ),
    ),
  );
  conditionController.dispose();
  notesController.dispose();
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

  await showDialog<void>(
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

  await showDialog<void>(
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
  final nameController = TextEditingController(text: existing?.name ?? '');
  final specialtyController =
      TextEditingController(text: existing?.specialty ?? '');
  final practiceController =
      TextEditingController(text: existing?.practiceName ?? '');
  final phoneController =
      TextEditingController(text: existing?.phoneNumber ?? '');
  final emailController = TextEditingController(text: existing?.email ?? '');
  final addressController =
      TextEditingController(text: existing?.address ?? '');
  final notesController = TextEditingController(text: existing?.notes ?? '');
  final formKey = GlobalKey<FormState>();
  var isPrimary = existing?.isPrimary ?? false;

  await showDialog<void>(
    context: context,
    builder: (dialogContext) => _MedicalDialogScope(
      bloc: medicalBloc,
      action: 'provider',
      successMessage: existing == null
          ? 'Healthcare contact added successfully.'
          : 'Healthcare contact updated successfully.',
      builder: (context, isSubmitting) => StatefulBuilder(
        builder: (context, setState) => _ResponsiveMedicalDialog(
        title: Text(
          existing == null
              ? 'Add Primary Care Provider'
              : 'Edit Healthcare Contact',
        ),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: nameController,
                  decoration: const InputDecoration(
                    labelText: 'Provider Name',
                    hintText: 'Dr. Smith',
                  ),
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: specialtyController,
                  decoration: const InputDecoration(
                    labelText: 'Specialty',
                    hintText: 'e.g., Family Medicine, Cardiology',
                  ),
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: practiceController,
                  decoration: const InputDecoration(
                    labelText: 'Practice Name',
                    hintText: 'Medical center or clinic name',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone Number',
                    hintText: 'Office phone number',
                  ),
                  validator: _providerPhoneValidator,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email'),
                  validator: _emailValidator,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: addressController,
                  minLines: 2,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Address'),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Primary care provider'),
                  value: isPrimary,
                  onChanged: (value) => setState(() => isPrimary = value),
                ),
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
                    final input = PrimaryCareProviderInput(
                      name: nameController.text,
                      specialty: specialtyController.text,
                      practiceName: practiceController.text,
                      phoneNumber: phoneController.text,
                      email: emailController.text,
                      address: addressController.text,
                      isPrimary: isPrimary,
                      notes: notesController.text,
                    );
                    medicalBloc.add(
                    existing == null
                        ? AddPrimaryCareProvider(input)
                        : EditPrimaryCareProvider(existing.id, input),
                  );
                  },
            child: Text(
              isSubmitting
                  ? (existing == null ? 'Adding...' : 'Updating...')
                  : (existing == null
                      ? 'Add Healthcare Contact'
                      : 'Update Contact'),
            ),
          ),
        ],
      ),
      ),
    ),
  );
  for (final controller in [
    nameController,
    specialtyController,
    practiceController,
    phoneController,
    emailController,
    addressController,
    notesController,
  ]) {
    controller.dispose();
  }
}

Future<void> _showSymptomDialog(
  BuildContext context, [
  SymptomEntryModel? existing,
]) async {
  final medicalBloc = context.read<MedicalBloc>();
  final nameController =
      TextEditingController(text: existing?.symptomName ?? '');
  final locationController =
      TextEditingController(text: existing?.location ?? '');
  final triggersController =
      TextEditingController(text: existing?.triggers ?? '');
  final descriptionController =
      TextEditingController(text: existing?.description ?? '');
  final notesController = TextEditingController(text: existing?.notes ?? '');
  final formKey = GlobalKey<FormState>();
  var severity = (existing?.severity ?? 1).clamp(1, 10).toInt();
  var startTime = existing?.startTime ?? DateTime.now();
  var endTime = existing?.endTime;

  await showDialog<void>(
    context: context,
    builder: (dialogContext) => _MedicalDialogScope(
      bloc: medicalBloc,
      action: 'symptom',
      successMessage: existing == null
          ? 'Personal note added successfully.'
          : 'Personal note updated successfully.',
      builder: (context, isSubmitting) => StatefulBuilder(
        builder: (context, setState) => _ResponsiveMedicalDialog(
        title: Text(existing == null ? 'Log New Symptom' : 'Edit Symptom Entry'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: nameController,
                  decoration: const InputDecoration(
                    labelText: 'Symptom Name',
                    hintText: 'e.g., Headache, Nausea, Pain',
                  ),
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<int>(
                  value: severity,
                  decoration: const InputDecoration(
                    labelText: 'Severity (1-10)',
                  ),
                  items: List.generate(
                    10,
                    (index) => DropdownMenuItem(
                      value: index + 1,
                      child: Text('${index + 1} - ${_symptomSeverityLabel(index + 1)}'),
                    ),
                  ),
                  onChanged: (value) => setState(() => severity = value ?? 1),
                ),
                const SizedBox(height: 12),
                _DateTimeField(
                  label: 'Start Time',
                  value: startTime,
                  onPick: () async {
                    final value = await _pickDateTime(context, startTime);
                    if (value != null) setState(() => startTime = value);
                  },
                ),
                const SizedBox(height: 12),
                _DateTimeField(
                  label: 'End Time (Optional)',
                  value: endTime,
                  onPick: () async {
                    final value = await _pickDateTime(context, endTime);
                    if (value != null) setState(() => endTime = value);
                  },
                  onClear: endTime == null
                      ? null
                      : () => setState(() => endTime = null),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: locationController,
                  decoration: const InputDecoration(
                    labelText: 'Location (Optional)',
                    hintText: 'e.g., Head, Stomach, Back',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: triggersController,
                  minLines: 2,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Possible Triggers (Optional)',
                    hintText: 'e.g., Stress, Food, Weather',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: descriptionController,
                  minLines: 2,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Description (Optional)',
                    hintText: 'Describe the symptom in detail',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: notesController,
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
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: isSubmitting
                ? null
                : () {
                    if (!formKey.currentState!.validate()) return;
                    final input = SymptomEntryInput(
                      symptomName: nameController.text,
                      severity: severity,
                      startTime: startTime,
                      endTime: endTime,
                      triggers: triggersController.text,
                      location: locationController.text,
                      description: descriptionController.text,
                      notes: notesController.text,
                    );
                    medicalBloc.add(
                    existing == null
                        ? AddSymptomEntry(input)
                        : EditSymptomEntry(existing.id, input),
                  );
                  },
            child: Text(
              isSubmitting
                  ? (existing == null ? 'Adding...' : 'Updating...')
                  : (existing == null ? 'Add Entry' : 'Update Entry'),
            ),
          ),
        ],
      ),
      ),
    ),
  );
  for (final controller in [
    nameController,
    locationController,
    triggersController,
    descriptionController,
    notesController,
  ]) {
    controller.dispose();
  }
}

Future<void> _showContactDialog(
  BuildContext context, [
  EmergencyContactModel? existing,
]) async {
  final medicalBloc = context.read<MedicalBloc>();
  final nameController = TextEditingController(text: existing?.name ?? '');
  final phoneController =
      TextEditingController(text: existing?.phoneNumber ?? '');
  final emailController = TextEditingController(text: existing?.email ?? '');
  final addressController =
      TextEditingController(text: existing?.address ?? '');
  final notesController = TextEditingController(text: existing?.notes ?? '');
  final relationshipController =
      TextEditingController(text: existing?.relationship ?? '');
  final formKey = GlobalKey<FormState>();
  var isPrimary = existing?.isPrimary ?? false;
  var isEmergency = existing?.isEmergencyContact ?? true;

  await showDialog<void>(
    context: context,
    builder: (dialogContext) => _MedicalDialogScope(
      bloc: medicalBloc,
      action: 'contact',
      successMessage: existing == null
          ? 'Trusted contact added successfully.'
          : 'Trusted contact updated successfully.',
      builder: (context, isSubmitting) => StatefulBuilder(
        builder: (context, setState) => _ResponsiveMedicalDialog(
        title: Text(existing == null ? 'Add Contact' : 'Edit Contact'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Name *'),
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: relationshipController,
                  decoration: const InputDecoration(
                    labelText: 'Relationship',
                    hintText: 'e.g., Parent, Sibling, Friend',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: phoneController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(10),
                  ],
                  decoration: const InputDecoration(labelText: 'Phone Number *'),
                  validator: _phoneValidator,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email'),
                  validator: _emailValidator,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: addressController,
                  minLines: 2,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Address'),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Primary contact'),
                  value: isPrimary,
                  onChanged: (value) => setState(() => isPrimary = value),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Emergency contact'),
                  value: isEmergency,
                  onChanged: (value) => setState(() => isEmergency = value),
                ),
                TextFormField(
                  controller: notesController,
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
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: isSubmitting
                ? null
                : () {
                    if (!formKey.currentState!.validate()) return;
                    final input = EmergencyContactInput(
                      name: nameController.text,
                      relationship: relationshipController.text,
                      phoneNumber: phoneController.text,
                      email: emailController.text,
                      address: addressController.text,
                      isPrimary: isPrimary,
                      isEmergencyContact: isEmergency,
                      notes: notesController.text,
                    );
                    medicalBloc.add(
                    existing == null
                        ? AddEmergencyContact(input)
                        : EditEmergencyContact(existing.id, input),
                  );
                  },
            child: Text(
              isSubmitting
                  ? (existing == null ? 'Adding...' : 'Updating...')
                  : (existing == null ? 'Save Contact' : 'Update Contact'),
            ),
          ),
        ],
      ),
      ),
    ),
  );
  for (final controller in [
    nameController,
    relationshipController,
    phoneController,
    emailController,
    addressController,
    notesController,
  ]) {
    controller.dispose();
  }
}

Future<void> _showMedicationDialog(BuildContext context) async {
  final medicalBloc = context.read<MedicalBloc>();
  final nameController = TextEditingController();
  final dosageController = TextEditingController();
  final prescriptionController = TextEditingController();
  final quantityController = TextEditingController();
  final refillsController = TextEditingController();
  final prescribedByController = TextEditingController();
  final pharmacyController = TextEditingController();
  final instructionsController = TextEditingController();
  final colorController = TextEditingController();
  final markingsController = TextEditingController();
  final descriptionController = TextEditingController();
  final formKey = GlobalKey<FormState>();
  var shape = '';
  var size = '';
  DateTime? nextRefillDate;

  await showDialog<void>(
    context: context,
    builder: (dialogContext) => _MedicalDialogScope(
      bloc: medicalBloc,
      action: 'medication',
      successMessage: 'Medication added successfully.',
      builder: (context, isSubmitting) => StatefulBuilder(
        builder: (context, setState) => _ResponsiveMedicalDialog(
        title: const Text('Add New Medication'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Medication Name'),
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: dosageController,
                  decoration: const InputDecoration(
                    labelText: 'Dosage',
                    hintText: 'e.g., 10mg',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: prescriptionController,
                  decoration:
                      const InputDecoration(labelText: 'Prescription Number'),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: quantityController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Quantity'),
                        validator: _optionalNonNegativeIntValidator,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextFormField(
                        controller: refillsController,
                        keyboardType: TextInputType.number,
                        decoration:
                            const InputDecoration(labelText: 'Refills Left'),
                        validator: _optionalNonNegativeIntValidator,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: prescribedByController,
                  decoration: const InputDecoration(
                    labelText: 'Prescribed By',
                    hintText: 'e.g., Dr. Smith',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: pharmacyController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Pharmacy ID',
                    hintText: 'Optional',
                  ),
                  validator: _optionalNonNegativeIntValidator,
                ),
                const SizedBox(height: 12),
                _DateField(
                  label: 'Next Refill Date',
                  date: nextRefillDate,
                  onPick: () async {
                    final date = await _pickDate(context, nextRefillDate);
                    if (date != null) setState(() => nextRefillDate = date);
                  },
                  onClear: nextRefillDate == null
                      ? null
                      : () => setState(() => nextRefillDate = null),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: instructionsController,
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
                  controller: colorController,
                  decoration: const InputDecoration(
                    labelText: 'Color',
                    hintText: 'e.g., White, Blue',
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: shape.isEmpty ? null : shape,
                  decoration: const InputDecoration(labelText: 'Shape'),
                  items: _pillShapes
                      .map((value) => DropdownMenuItem(
                            value: value,
                            child: Text(_titleCase(value)),
                          ))
                      .toList(),
                  onChanged: (value) => setState(() => shape = value ?? ''),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: size.isEmpty ? null : size,
                  decoration: const InputDecoration(labelText: 'Size'),
                  items: _pillSizes
                      .map((value) => DropdownMenuItem(
                            value: value,
                            child: Text(_titleCase(value)),
                          ))
                      .toList(),
                  onChanged: (value) => setState(() => size = value ?? ''),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: markingsController,
                  decoration: const InputDecoration(
                    labelText: 'Markings/Imprint',
                    hintText: 'e.g., TYLENOL 500',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: descriptionController,
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
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: isSubmitting
                ? null
                : () {
                    if (!formKey.currentState!.validate()) return;
                    final input = MedicationInput(
                      medicationName: nameController.text,
                      dosage: dosageController.text,
                      prescriptionNumber: prescriptionController.text,
                      quantity: _parseInt(quantityController.text),
                      refillsRemaining: _parseInt(refillsController.text),
                      prescribedBy: prescribedByController.text,
                      pharmacyId: _parseInt(pharmacyController.text),
                      nextRefillDate: nextRefillDate,
                      instructions: instructionsController.text,
                      pillColor: colorController.text,
                      pillShape: shape,
                      pillSize: size,
                      pillMarkings: markingsController.text,
                      pillDescription: descriptionController.text,
                    );
                    medicalBloc.add(AddMedication(input));
                  },
            child: Text(isSubmitting ? 'Adding...' : 'Add Medication'),
          ),
        ],
      ),
      ),
    ),
  );
  for (final controller in [
    nameController,
    dosageController,
    prescriptionController,
    quantityController,
    refillsController,
    prescribedByController,
    pharmacyController,
    instructionsController,
    colorController,
    markingsController,
    descriptionController,
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
  await showDialog<void>(
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

Future<DateTime?> _pickDate(BuildContext context, DateTime? current) {
  final now = DateTime.now();
  final firstDate = DateTime(1900);
  final initialDate = _clampDate(
    current?.toLocal() ?? now,
    firstDate,
    now,
  );
  return showDatePicker(
    context: context,
    initialDate: initialDate,
    firstDate: firstDate,
    lastDate: now,
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