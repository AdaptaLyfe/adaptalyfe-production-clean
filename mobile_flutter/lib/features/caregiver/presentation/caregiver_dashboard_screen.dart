import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../core/layout/responsive.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../bloc/caregiver_bloc.dart';
import '../bloc/caregiver_event.dart';
import '../bloc/caregiver_state.dart';
import '../models/caregiver_models.dart';

class CaregiverDashboardScreen extends StatelessWidget {
  const CaregiverDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<CaregiverBloc, CaregiverState>(
      listener: (context, state) {
        if (state.sessionInvalid) {
          context.read<AuthBloc>().add(const CheckAuthentication());
          return;
        }
        final message = state.errorMessage;
        if (message != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(message)),
          );
        }
      },
      builder: (context, state) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Caregiver Dashboard'),
            backgroundColor: Colors.white,
            foregroundColor: const Color(0xFF111827),
          ),
          body: RefreshIndicator(
            onRefresh: () async {
              final bloc = context.read<CaregiverBloc>();
              final completed = bloc.stream.firstWhere(
                (next) =>
                    next.status == CaregiverStatus.loaded ||
                    next.status == CaregiverStatus.failure,
              );
              bloc.add(const LoadCareRecipients());
              await completed;
            },
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: AppResponsive.pagePadding(context).copyWith(top: 16, bottom: 16),
              children: [
                Card(
                  color: const Color(0xFFF0FDFA),
                  child: const ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Color(0xFFCCFBF1),
                      child: Icon(
                        Icons.volunteer_activism_outlined,
                        color: Color(0xFF0F766E),
                      ),
                    ),
                    title: Text(
                      'People in your care',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    subtitle: Text(
                      'Select a recipient to continue with the caregiver tools available to your account.',
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                if (state.isLoading && state.recipients.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(40),
                      child: CircularProgressIndicator(),
                    ),
                  )
                else if (state.recipients.isEmpty)
                  _EmptyRecipients(
                    onAcceptInvitation: () =>
                        context.push('/accept-invitation'),
                  )
                else
                  ...state.recipients.map(
                    (recipient) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _RecipientCard(recipient: recipient),
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

class _RecipientCard extends StatelessWidget {
  const _RecipientCard({required this.recipient});

  final CareRecipientSummaryModel recipient;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        contentPadding: AppResponsive.pagePadding(context).copyWith(top: 16, bottom: 16),
        leading: const CircleAvatar(
          radius: 26,
          backgroundColor: Color(0xFFEDE9FE),
          child: Icon(Icons.person_rounded, color: Color(0xFF6D28D9)),
        ),
        title: Text(
          recipient.userName,
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            '${recipient.relationship.replaceAll('_', ' ')}'
            '${recipient.isPrimary ? ' • Primary relationship' : ''}',
          ),
        ),
        trailing: const Icon(Icons.chevron_right_rounded),
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Recipient selection is ready; detailed caregiver modules use the existing web routes.',
              ),
            ),
          );
        },
      ),
    );
  }
}

class _EmptyRecipients extends StatelessWidget {
  const _EmptyRecipients({required this.onAcceptInvitation});

  final VoidCallback onAcceptInvitation;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Icon(Icons.people_outline_rounded,
                size: 42, color: Color(0xFF9CA3AF)),
            const SizedBox(height: 10),
            const Text(
              'No care recipients linked yet',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            const Text(
              'Accept an invitation from a care recipient to see them here.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF6B7280)),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onAcceptInvitation,
              icon: const Icon(Icons.key_rounded),
              label: const Text('Accept an invitation'),
            ),
          ],
        ),
      ),
    );
  }
}