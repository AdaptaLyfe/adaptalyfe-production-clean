import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../../auth/bloc/auth_state.dart';
import '../../../core/layout/responsive.dart';
import '../bloc/caregiver_bloc.dart';
import '../bloc/caregiver_event.dart';
import '../bloc/caregiver_state.dart';
import '../models/caregiver_models.dart';

const _relationshipTypes = <Map<String, String>>[
  {'value': 'parent', 'label': 'Parent / Guardian'},
  {'value': 'therapist', 'label': 'Therapist / Counselor'},
  {'value': 'case_worker', 'label': 'Case worker'},
  {'value': 'teacher', 'label': 'Teacher / Aide'},
  {'value': 'mentor', 'label': 'Life skills mentor'},
  {'value': 'family_friend', 'label': 'Family friend'},
];

const _permissionTypes = <Map<String, String>>[
  {'value': 'view_progress', 'label': 'View progress'},
  {'value': 'view_mood', 'label': 'Mood tracking'},
  {'value': 'view_medical', 'label': 'Medical information'},
  {'value': 'view_financial', 'label': 'Financial management'},
  {'value': 'emergency_access', 'label': 'Emergency access'},
  {'value': 'schedule_appointments', 'label': 'Schedule appointments'},
  {'value': 'modify_tasks', 'label': 'Modify daily tasks'},
];

class CaregiverSetupScreen extends StatefulWidget {
  const CaregiverSetupScreen({super.key});

  @override
  State<CaregiverSetupScreen> createState() => _CaregiverSetupScreenState();
}

class _CaregiverSetupScreenState extends State<CaregiverSetupScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _ageController = TextEditingController();
  String? _relationship;
  final _permissions = <String>{};

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _ageController.dispose();
    super.dispose();
  }

  void _createInvitation(BuildContext context) {
    final name = _nameController.text.trim();
    if (name.isEmpty || _relationship == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Enter the caregiver name and relationship first.'),
        ),
      );
      return;
    }

    final age = int.tryParse(_ageController.text.trim());
    context.read<CaregiverBloc>().add(
          CreateCaregiverInvitation(
            CaregiverInvitationInput(
              userName: name,
              userEmail: _emailController.text,
              userAge: age,
              relationship: _relationship!,
              permissionsGranted: _permissions.toList(),
            ),
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<CaregiverBloc, CaregiverState>(
      listener: (context, state) {
        if (state.sessionInvalid) {
          context.read<AuthBloc>().add(const CheckAuthentication());
          return;
        }
        final message = state.actionMessage ?? state.errorMessage;
        if (message != null) {
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(
              SnackBar(
                content: Text(message),
                backgroundColor:
                    state.errorMessage == null ? null : Colors.red.shade700,
              ),
            );
          if (state.actionMessage != null &&
              state.busyKey == null &&
              state.actionMessage!.startsWith('Invitation created')) {
            _nameController.clear();
            _emailController.clear();
            _ageController.clear();
            setState(() {
              _relationship = null;
              _permissions.clear();
            });
          }
        }
      },
      builder: (context, state) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Caregiver Setup'),
            backgroundColor: Colors.white,
            foregroundColor: const Color(0xFF111827),
          ),
          body: RefreshIndicator(
            onRefresh: () async {
              final authState = context.read<AuthBloc>().state;
              if (authState is! Authenticated) return;
              final bloc = context.read<CaregiverBloc>();
              final completed = bloc.stream.firstWhere(
                (next) =>
                    next.status == CaregiverStatus.loaded ||
                    next.status == CaregiverStatus.failure,
              );
              bloc.add(RefreshCaregiver(authState.user.id));
              await completed;
            },
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: AppResponsive.pagePadding(context).copyWith(top: 16, bottom: 16),
              children: [
                _IntroCard(
                  title: 'Build your care team',
                  message:
                      'Create an invitation for someone you trust. You stay in control and can remove access later.',
                ),
                const SizedBox(height: 16),
                _CreateInvitationCard(
                  nameController: _nameController,
                  emailController: _emailController,
                  ageController: _ageController,
                  relationship: _relationship,
                  permissions: _permissions,
                  isBusy: state.busyKey == 'create',
                  onRelationshipChanged: (value) =>
                      setState(() => _relationship = value),
                  onPermissionChanged: (value, selected) {
                    setState(() {
                      if (selected) {
                        _permissions.add(value);
                      } else {
                        _permissions.remove(value);
                      }
                    });
                  },
                  onCreate: () => _createInvitation(context),
                ),
                const SizedBox(height: 20),
                _SectionHeading(
                  title: 'Invitations',
                  subtitle: 'Share a pending code with your caregiver.',
                ),
                const SizedBox(height: 8),
                if (state.isLoading && state.invitations.isEmpty)
                  const _LoadingCard()
                else if (state.invitations.isEmpty)
                  const _EmptyCard(
                    icon: Icons.mail_outline_rounded,
                    title: 'No invitations yet',
                    message: 'Create an invitation above to get started.',
                  )
                else
                  ...state.invitations.map(
                    (invitation) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _InvitationCard(invitation: invitation),
                    ),
                  ),
                const SizedBox(height: 12),
                _SectionHeading(
                  title: 'Active caregivers',
                  subtitle: 'Only the care recipient can remove this access.',
                ),
                const SizedBox(height: 8),
                if (state.relationships.isEmpty)
                  const _EmptyCard(
                    icon: Icons.people_outline_rounded,
                    title: 'No active caregivers',
                    message:
                        'Accepted invitations will appear here for management.',
                  )
                else
                  ...state.relationships.map(
                    (relationship) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _RelationshipCard(
                        relationship: relationship,
                        isBusy: state.busyKey ==
                            'relationship-${relationship.id}',
                        onRemove: () => _confirmRemove(context, relationship),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _confirmRemove(
    BuildContext context,
    CareRelationshipModel relationship,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Remove caregiver access?'),
        content: const Text(
          'This will deactivate the relationship. You can send a new invitation later.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Remove access'),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      context
          .read<CaregiverBloc>()
          .add(RemoveCareRelationship(relationship.id));
    }
  }
}

class _CreateInvitationCard extends StatelessWidget {
  const _CreateInvitationCard({
    required this.nameController,
    required this.emailController,
    required this.ageController,
    required this.relationship,
    required this.permissions,
    required this.isBusy,
    required this.onRelationshipChanged,
    required this.onPermissionChanged,
    required this.onCreate,
  });

  final TextEditingController nameController;
  final TextEditingController emailController;
  final TextEditingController ageController;
  final String? relationship;
  final Set<String> permissions;
  final bool isBusy;
  final ValueChanged<String?> onRelationshipChanged;
  final void Function(String value, bool selected) onPermissionChanged;
  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: AppResponsive.pagePadding(context).copyWith(top: 16, bottom: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Create invitation',
              style: TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            const Text(
              'The invitation creator is the care recipient. The person who accepts becomes the caregiver.',
              style: TextStyle(color: Color(0xFF4B5563)),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: nameController,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Caregiver name',
                prefixIcon: Icon(Icons.person_outline_rounded),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Email (optional)',
                prefixIcon: Icon(Icons.email_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: ageController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Age (optional)',
                prefixIcon: Icon(Icons.cake_outlined),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: relationship,
              decoration: const InputDecoration(
                labelText: 'Relationship',
                prefixIcon: Icon(Icons.people_outline_rounded),
              ),
              items: _relationshipTypes
                  .map(
                    (item) => DropdownMenuItem(
                      value: item['value'],
                      child: Text(item['label']!),
                    ),
                  )
                  .toList(),
              onChanged: onRelationshipChanged,
            ),
            const SizedBox(height: 16),
            const Text(
              'Access permissions',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            const Text(
              'These are stored with the invitation for the existing caregiver workflow.',
              style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _permissionTypes
                  .map(
                    (item) => FilterChip(
                      label: Text(item['label']!),
                      selected: permissions.contains(item['value']),
                      onSelected: (selected) =>
                          onPermissionChanged(item['value']!, selected),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: isBusy ? null : onCreate,
                icon: const Icon(Icons.add_link_rounded),
                label: Text(isBusy ? 'Creating…' : 'Create invitation'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InvitationCard extends StatelessWidget {
  const _InvitationCard({required this.invitation});

  final CaregiverInvitationModel invitation;

  @override
  Widget build(BuildContext context) {
    final isPending = invitation.isPending;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
              Row(
              children: [
                const Icon(Icons.mail_rounded, color: Color(0xFF7C3AED)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    invitation.userName,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
                Chip(
                  label: Text(invitation.status.toUpperCase()),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
            const SizedBox(height: 8),
            SelectableText(
              invitation.invitationCode,
              style: const TextStyle(
                fontSize: 23,
                letterSpacing: 2,
                fontWeight: FontWeight.w800,
                color: Color(0xFF4F46E5),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${_relationshipLabel(invitation.relationship)}'
              '${invitation.expiresAt == null ? '' : ' • Expires ${_date(invitation.expiresAt!)}'}',
              style: const TextStyle(color: Color(0xFF6B7280)),
            ),
            if (isPending)
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () => context
                      .read<CaregiverBloc>()
                      .add(DeleteCaregiverInvitation(invitation.id)),
                  icon: const Icon(Icons.delete_outline_rounded),
                  label: const Text('Delete'),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _RelationshipCard extends StatelessWidget {
  const _RelationshipCard({
    required this.relationship,
    required this.isBusy,
    required this.onRemove,
  });

  final CareRelationshipModel relationship;
  final bool isBusy;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const CircleAvatar(
          backgroundColor: Color(0xFFD1FAE5),
          child: Icon(Icons.volunteer_activism_rounded, color: Color(0xFF047857)),
        ),
        title: Text(
          relationship.caregiverName ?? 'Caregiver',
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          '${_relationshipLabel(relationship.relationship)} • Relationship #${relationship.id}'
          '${relationship.isPrimary ? ' • Primary' : ''}'
          '${relationship.establishedAt == null ? '' : ' • ${_date(relationship.establishedAt!)}'}',
        ),
        trailing: IconButton(
          tooltip: 'Remove access',
          onPressed: isBusy ? null : onRemove,
          icon: isBusy
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.remove_circle_outline_rounded),
        ),
      ),
    );
  }
}

class _IntroCard extends StatelessWidget {
  const _IntroCard({required this.title, required this.message});

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: const Color(0xFFF5F3FF),
      child: ListTile(
        leading: const CircleAvatar(
          backgroundColor: Color(0xFFEDE9FE),
          child: Icon(Icons.shield_outlined, color: Color(0xFF6D28D9)),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(message),
      ),
    );
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700)),
        Text(subtitle, style: const TextStyle(color: Color(0xFF6B7280))),
      ],
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
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Icon(icon, size: 38, color: const Color(0xFF9CA3AF)),
            const SizedBox(height: 8),
            Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF6B7280)),
            ),
          ],
        ),
      ),
    );
  }
}

class _LoadingCard extends StatelessWidget {
  const _LoadingCard();

  @override
  Widget build(BuildContext context) {
    return const Card(
      child: Padding(
        padding: EdgeInsets.all(28),
        child: Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

String _relationshipLabel(String value) {
  for (final item in _relationshipTypes) {
    if (item['value'] == value) return item['label']!;
  }
  return value.replaceAll('_', ' ');
}

String _date(DateTime value) {
  return '${value.month}/${value.day}/${value.year}';
}