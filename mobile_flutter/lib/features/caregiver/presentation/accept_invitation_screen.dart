import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../core/layout/responsive.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../../auth/bloc/auth_state.dart';
import '../bloc/caregiver_bloc.dart';
import '../bloc/caregiver_event.dart';
import '../bloc/caregiver_state.dart';
import '../models/caregiver_models.dart';

class AcceptInvitationScreen extends StatefulWidget {
  const AcceptInvitationScreen({
    super.key,
    this.initialCode,
  });

  final String? initialCode;

  @override
  State<AcceptInvitationScreen> createState() => _AcceptInvitationScreenState();
}

class _AcceptInvitationScreenState extends State<AcceptInvitationScreen> {
  late final TextEditingController _codeController;

  @override
  void initState() {
    super.initState();
    _codeController = TextEditingController(
      text: widget.initialCode?.trim().toUpperCase() ?? '',
    );
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  void _verify(BuildContext context) {
    FocusScope.of(context).unfocus();
    context
        .read<CaregiverBloc>()
        .add(ValidateCaregiverInvitation(_codeController.text));
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<CaregiverBloc, CaregiverState>(
      listener: (context, state) {
        if (state.sessionInvalid) {
          context.read<AuthBloc>().add(const CheckAuthentication());
          return;
        }
        final message = state.actionMessage;
        if (message != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(message)),
          );
          if (message.startsWith('Invitation accepted')) {
            context.go('/caregiver-dashboard');
          }
        }
      },
      builder: (context, state) {
        final authState = context.read<AuthBloc>().state;
        final userId = authState is Authenticated ? authState.user.id : null;
        final canAccept =
            state.validatedInvitation != null && userId != null;

        return Scaffold(
          appBar: AppBar(
            title: const Text('Accept Invitation'),
            backgroundColor: Colors.white,
            foregroundColor: const Color(0xFF111827),
          ),
          body: ListView(
            padding: AppResponsive.pagePadding(context).copyWith(top: 16, bottom: 16),
            children: [
              const _AcceptHeader(),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: AppResponsive.pagePadding(context).copyWith(top: 16, bottom: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Invitation code',
                        style: TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Paste the code you received, then verify it before accepting.',
                        style: TextStyle(color: Color(0xFF6B7280)),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _codeController,
                        textCapitalization: TextCapitalization.characters,
                        autocorrect: false,
                        maxLength: 8,
                        onChanged: (_) {
                          if (state.validatedInvitation != null) {
                            context
                                .read<CaregiverBloc>()
                                .add(
                                  const ClearCaregiverInvitationValidation(),
                                );
                          }
                        },
                        decoration: const InputDecoration(
                          labelText: 'Enter code',
                          hintText: '6-character code',
                          prefixIcon: Icon(Icons.key_rounded),
                        ),
                      ),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          onPressed: state.busyKey == 'validate'
                              ? null
                              : () => _verify(context),
                          icon: const Icon(Icons.verified_outlined),
                          label: Text(
                            state.busyKey == 'validate'
                                ? 'Verifying…'
                                : 'Verify invitation',
                          ),
                        ),
                      ),
                      if (state.validationError != null) ...[
                        const SizedBox(height: 12),
                        _MessageBox(
                          message: state.validationError!,
                          color: const Color(0xFFFEF2F2),
                          foreground: const Color(0xFFB91C1C),
                        ),
                      ],
                      if (state.validatedInvitation != null) ...[
                        const SizedBox(height: 16),
                        _VerifiedInvitationCard(
                          invitation: state.validatedInvitation!,
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed: !canAccept || state.busyKey == 'accept'
                                ? null
                                : () => context.read<CaregiverBloc>().add(
                                      AcceptCaregiverInvitation(
                                        code: _codeController.text,
                                        userId: userId,
                                      ),
                                    ),
                            icon: const Icon(Icons.handshake_outlined),
                            label: Text(
                              state.busyKey == 'accept'
                                  ? 'Accepting…'
                                  : 'Accept invitation',
                            ),
                          ),
                        ),
                      ],
                      if (state.errorMessage != null) ...[
                        const SizedBox(height: 12),
                        _MessageBox(
                          message: state.errorMessage!,
                          color: const Color(0xFFFEF2F2),
                          foreground: const Color(0xFFB91C1C),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _AcceptHeader extends StatelessWidget {
  const _AcceptHeader();

  @override
  Widget build(BuildContext context) {
    return Card(
      color: const Color(0xFFEFF6FF),
      child: const ListTile(
        leading: CircleAvatar(
          backgroundColor: Color(0xFFDBEAFE),
          child: Icon(Icons.people_alt_outlined, color: Color(0xFF1D4ED8)),
        ),
        title: Text(
          'Join a care team',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          'Once accepted, you will be connected as the caregiver for the person who sent the invitation.',
        ),
      ),
    );
  }
}

class _VerifiedInvitationCard extends StatelessWidget {
  const _VerifiedInvitationCard({required this.invitation});

  final CaregiverInvitationModel invitation;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF86EFAC)),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_rounded, color: Color(0xFF15803D)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Verified for ${invitation.userName}. Relationship: ${invitation.relationship.replaceAll('_', ' ')}.',
              style: const TextStyle(color: Color(0xFF166534)),
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBox extends StatelessWidget {
  const _MessageBox({
    required this.message,
    required this.color,
    required this.foreground,
  });

  final String message;
  final Color color;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(message, style: TextStyle(color: foreground)),
    );
  }
}