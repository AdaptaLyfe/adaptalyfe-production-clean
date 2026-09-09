import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../bloc/resources_bloc.dart';
import '../bloc/resources_event.dart';
import '../bloc/resources_state.dart';
import '../models/resource_models.dart';

class ResourcesScreen extends StatelessWidget {
  const ResourcesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ResourcesBloc, ResourcesState>(
      listener: (context, state) {
        if (state.sessionInvalid) {
          context.read<AuthBloc>().add(const CheckAuthentication());
          return;
        }

        final message = state.actionMessage ?? state.errorMessage;
        if (message != null && message.isNotEmpty) {
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
        }
      },
      builder: (context, state) {
        return DefaultTabController(
          length: 3,
          child: Scaffold(
            appBar: AppBar(
              title: const Text('Resources'),
              bottom: const TabBar(
                tabs: [
                  Tab(text: 'My resources', icon: Icon(Icons.bookmark_outline)),
                  Tab(text: 'Emergency', icon: Icon(Icons.emergency_outlined)),
                  Tab(text: 'Wellbeing', icon: Icon(Icons.self_improvement)),
                ],
              ),
              actions: [
                IconButton(
                  tooltip: 'Refresh resources',
                  onPressed: () => context
                      .read<ResourcesBloc>()
                      .add(const RefreshResources()),
                  icon: const Icon(Icons.refresh_rounded),
                ),
              ],
            ),
            body: _ResourcesBody(state: state),
          ),
        );
      },
    );
  }
}

class _ResourcesBody extends StatelessWidget {
  const _ResourcesBody({required this.state});

  final ResourcesState state;

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
      child: TabBarView(
        children: [
          _PersonalResourcesTab(state: state),
          _EmergencyResourcesTab(state: state),
          const _WellbeingTab(),
        ],
      ),
    );
  }
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
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 32),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
        onTap: () => _showPersonalDetails(context, resource),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 14, 8, 14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ResourceIcon(
                icon: Icons.link_rounded,
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
                    Text(
                      resource.description?.trim().isNotEmpty == true
                          ? resource.description!
                          : resource.url,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF6B7280),
                        fontSize: 13,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 9),
                    Wrap(
                      spacing: 8,
                      runSpacing: 5,
                      children: [
                        _Tag(text: _displayCategory(resource.category)),
                        _Tag(
                          text:
                              '${resource.accessCount} ${resource.accessCount == 1 ? 'visit' : 'visits'}',
                          color: const Color(0xFFF3F4F6),
                          textColor: const Color(0xFF6B7280),
                        ),
                      ],
                    ),
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
                  PopupMenuItem(value: 'edit', child: Text('Edit')),
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
    } else if (action == 'edit') {
      await _showPersonalEditor(context, resource: resource);
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
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 32),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
  const _EmergencyResourceCard({required this.resource});

  final EmergencyResourceModel resource;

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
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 32),
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
            if (resource.description != null)
              _DetailLine(label: 'Description', value: resource.description!),
            _DetailLine(
              label: 'Availability',
              value: resource.isAvailable24_7 ? 'Available 24/7' : 'As listed',
            ),
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
  if (value == 'all') return 'All';
  return value
      .split(RegExp(r'[_-]'))
      .where((part) => part.isNotEmpty)
      .map(
        (part) => '${part[0].toUpperCase()}${part.substring(1).toLowerCase()}',
      )
      .join(' ');
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
  late final TextEditingController _categoryController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _tagsController;
  late bool _isFavorite;

  @override
  void initState() {
    super.initState();
    final resource = widget.resource;
    _titleController = TextEditingController(text: resource?.title);
    _urlController = TextEditingController(text: resource?.url);
    _categoryController =
        TextEditingController(text: resource?.category ?? 'other');
    _descriptionController =
        TextEditingController(text: resource?.description);
    _tagsController = TextEditingController(text: resource?.tags);
    _isFavorite = resource?.isFavorite ?? false;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _urlController.dispose();
    _categoryController.dispose();
    _descriptionController.dispose();
    _tagsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.resource != null;
    return AlertDialog(
      title: Text(isEditing ? 'Edit personal resource' : 'Add personal resource'),
      content: Form(
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
              _formField(
                controller: _categoryController,
                label: 'Category',
                helperText: 'For example: mental health, education, or support',
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Enter a category'
                    : null,
              ),
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
      category: _categoryController.text,
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
  late final TextEditingController _descriptionController;
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
    _descriptionController =
        TextEditingController(text: resource?.description);
    _isAvailable24_7 = resource?.isAvailable24_7 ?? false;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _typeController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.resource != null;
    return AlertDialog(
      title: Text(
        isEditing ? 'Edit emergency resource' : 'Add emergency resource',
      ),
      content: Form(
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
                controller: _descriptionController,
                label: 'Description',
                maxLines: 3,
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
        description: _descriptionController.text,
        isAvailable24_7: _isAvailable24_7,
      ),
    );
  }
}