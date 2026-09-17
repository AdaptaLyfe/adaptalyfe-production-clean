import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter/services.dart';

import '../../../core/layout/responsive.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../bloc/meal_shopping_bloc.dart';
import '../bloc/meal_shopping_event.dart';
import '../bloc/meal_shopping_state.dart';
import '../models/meal_shopping_models.dart';

class MealShoppingScreen extends StatelessWidget {
  const MealShoppingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<MealShoppingBloc, MealShoppingState>(
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
              backgroundColor: state.errorMessage == null
                  ? null
                  : const Color(0xFFB91C1C),
            ),
          );
      },
      builder: (context, state) {
        if (state.status == MealShoppingStatus.initial ||
            (state.isLoading && !state.hasData)) {
          return const Scaffold(
            appBar: _MealShoppingAppBar(),
            body: _MealShoppingLoading(),
          );
        }
        if (state.status == MealShoppingStatus.failure && !state.hasData) {
          return Scaffold(
            appBar: const _MealShoppingAppBar(),
            body: _MealShoppingError(
              message: state.errorMessage ??
                  'Unable to load meal plans and shopping lists.',
              onRetry: () => context
                  .read<MealShoppingBloc>()
                  .add(const RefreshMealShopping()),
            ),
          );
        }

        return DefaultTabController(
          length: 2,
          child: Scaffold(
            appBar: AppBar(
              title: const Text('Meal Planning & Shopping'),
              actions: [
                IconButton(
                  tooltip: 'Refresh meal and shopping data',
                  onPressed: () => context
                      .read<MealShoppingBloc>()
                      .add(const RefreshMealShopping()),
                  icon: const Icon(Icons.refresh_rounded),
                ),
              ],
              bottom: const TabBar(
                tabs: [
                  Tab(
                    icon: Icon(Icons.restaurant_menu_rounded),
                    text: 'Meal Planning',
                  ),
                  Tab(
                    icon: Icon(Icons.shopping_cart_outlined),
                    text: 'Shopping List',
                  ),
                ],
              ),
            ),
            body: Column(
              children: [
                if (state.isLoading) const LinearProgressIndicator(minHeight: 2),
                Expanded(
                  child: TabBarView(
                    children: [
                      _MealPlansTab(state: state),
                      _ShoppingListTab(state: state),
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

class _MealShoppingAppBar extends StatelessWidget
    implements PreferredSizeWidget {
  const _MealShoppingAppBar();

  @override
  Widget build(BuildContext context) =>
      AppBar(title: const Text('Meal Planning & Shopping'));

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

class _MealPlansTab extends StatelessWidget {
  const _MealPlansTab({required this.state});

  final MealShoppingState state;

  @override
  Widget build(BuildContext context) {
    final grouped = <String, List<MealPlanModel>>{};
    for (final meal in state.mealPlans) {
      grouped.putIfAbsent(meal.plannedDate, () => []).add(meal);
    }
    final dates = grouped.keys.toList()
      ..sort((a, b) => _dateValue(a).compareTo(_dateValue(b)));
    for (final meals in grouped.values) {
      meals.sort(
        (a, b) => _mealTypeOrder(a.mealType).compareTo(
          _mealTypeOrder(b.mealType),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _refresh(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
         padding: AppResponsive.pagePadding(context).add(
           const EdgeInsets.only(top: 16, bottom: 32),
         ),
        children: [
          _IntroCard(
            icon: Icons.restaurant_menu_rounded,
            title: 'Plan your meals',
            description:
                'Schedule nutritious meals, recipes, and cooking time in one place.',
            color: const Color(0xFFF97316),
            actionLabel: 'Add Meal Plan',
            onAction: () => _showMealPlanDialog(context),
          ),
          const SizedBox(height: 18),
          const _SectionHeading(
            icon: Icons.calendar_month_outlined,
            title: 'Meal Schedule',
          ),
          const SizedBox(height: 10),
          if (dates.isEmpty)
            const _EmptyState(
              icon: Icons.restaurant_outlined,
              title: 'No meals planned yet',
              subtitle: 'Add your first meal plan above.',
            )
          else
            ...dates.map(
              (date) => _MealDateSection(
                date: date,
                meals: grouped[date]!,
                busyId: state.action == MealShoppingAction.completingMeal
                    ? state.activeId
                    : null,
              ),
            ),
        ],
      ),
    );
  }
}

class _MealDateSection extends StatelessWidget {
  const _MealDateSection({
    required this.date,
    required this.meals,
    required this.busyId,
  });

  final String date;
  final List<MealPlanModel> meals;
  final int? busyId;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              _friendlyDate(date),
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          ...meals.map(
            (meal) => _MealPlanCard(
              meal: meal,
              isBusy: busyId == meal.id,
              onDelete: () => _confirmDeleteMeal(context, meal),
            ),
          ),
        ],
      ),
    );
  }
}

class _MealPlanCard extends StatelessWidget {
  const _MealPlanCard({
    required this.meal,
    required this.isBusy,
    required this.onDelete,
  });

  final MealPlanModel meal;
  final bool isBusy;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final color = _mealTypeColor(meal.mealType);
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Checkbox(
              value: meal.isCompleted,
              onChanged: isBusy
                  ? null
                  : (value) {
                      context.read<MealShoppingBloc>().add(
                            ToggleMealCompletion(
                              meal.id,
                              value ?? false,
                            ),
                          );
                    },
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 5),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 5,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(
                          meal.mealName,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            decoration: meal.isCompleted
                                ? TextDecoration.lineThrough
                                : null,
                            color: meal.isCompleted
                                ? const Color(0xFF6B7280)
                                : const Color(0xFF111827),
                          ),
                        ),
                        _ColorBadge(
                          label: _titleCase(meal.mealType),
                          color: color,
                        ),
                      ],
                    ),
                    if (meal.cookingTime != null && meal.cookingTime! > 0)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.schedule_rounded,
                              size: 15,
                              color: Color(0xFF6B7280),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${meal.cookingTime} minutes',
                              style: const TextStyle(
                                color: Color(0xFF6B7280),
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    if (_hasText(meal.recipe))
                      Padding(
                        padding: const EdgeInsets.only(top: 7),
                        child: Text(
                          meal.recipe!,
                          style: const TextStyle(
                            color: Color(0xFF4B5563),
                            fontSize: 13,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            if (isBusy)
              const Padding(
                padding: EdgeInsets.only(top: 6, left: 8),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              )
            else if (meal.isCompleted)
              const Padding(
                padding: EdgeInsets.only(top: 4, left: 8),
                child: Icon(
                  Icons.check_circle_rounded,
                  color: Color(0xFF16A34A),
                ),
              ),
            IconButton(
              tooltip: 'Delete meal plan',
              onPressed: isBusy ? null : onDelete,
              icon: const Icon(Icons.delete_outline_rounded),
            ),
          ],
        ),
      ),
    );
  }
}

Future<void> _confirmDeleteMeal(
  BuildContext context,
  MealPlanModel meal,
) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: const Text('Delete meal plan?'),
      content: Text('Remove “${meal.mealName}” from your meal schedule?'),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(dialogContext).pop(true),
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFFDC2626),
          ),
          child: const Text('Delete'),
        ),
      ],
    ),
  );
  if (confirmed == true && context.mounted) {
    context.read<MealShoppingBloc>().add(DeleteMealPlan(meal.id));
  }
}

class _ShoppingListTab extends StatelessWidget {
  const _ShoppingListTab({required this.state});

  final MealShoppingState state;

  @override
  Widget build(BuildContext context) {
    final grouped = <String, List<ShoppingItemModel>>{};
    for (final item in state.activeShoppingItems) {
      grouped.putIfAbsent(item.category, () => []).add(item);
    }
    final categories = grouped.keys.toList()..sort();
    final estimatedTotal = state.activeShoppingItems.fold<double>(
      0,
      (sum, item) => sum + (item.estimatedCost ?? 0),
    );
    final actualTotal = state.shoppingItems
        .where((item) => item.isPurchased)
        .fold<double>(0, (sum, item) => sum + (item.actualCost ?? 0));

    return RefreshIndicator(
      onRefresh: () => _refresh(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
         padding: AppResponsive.pagePadding(context).add(
           const EdgeInsets.only(top: 16, bottom: 32),
         ),
        children: [
          _ShoppingStats(
            activeCount: state.activeShoppingItems.length,
            estimatedTotal: estimatedTotal,
            actualTotal: actualTotal,
          ),
          const SizedBox(height: 16),
          _IntroCard(
            icon: Icons.add_shopping_cart_rounded,
            title: 'Build your shopping list',
            description: 'Track items and grocery spending as you shop.',
            color: const Color(0xFF2563EB),
            actionLabel: 'Add Shopping Item',
            onAction: () => _showShoppingItemDialog(context),
          ),
          const SizedBox(height: 18),
          const _SectionHeading(
            icon: Icons.shopping_cart_outlined,
            title: 'Shopping List',
          ),
          const SizedBox(height: 10),
          if (categories.isEmpty)
            const _EmptyState(
              icon: Icons.shopping_cart_outlined,
              title: 'Your shopping list is empty',
              subtitle: 'Add some items above to get started.',
            )
          else
            ...categories.map(
              (category) => _ShoppingCategory(
                category: category,
                items: grouped[category]!,
                busyId:
                    state.action == MealShoppingAction.completingShoppingItem
                        ? state.activeId
                        : null,
              ),
            ),
        ],
      ),
    );
  }
}

class _ShoppingStats extends StatelessWidget {
  const _ShoppingStats({
    required this.activeCount,
    required this.estimatedTotal,
    required this.actualTotal,
  });

  final int activeCount;
  final double estimatedTotal;
  final double actualTotal;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cardWidth = constraints.maxWidth < 380
            ? constraints.maxWidth
            : (constraints.maxWidth - 16) / 3;
        return Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            SizedBox(
              width: cardWidth,
              child: _StatCard(
            icon: Icons.inventory_2_outlined,
            label: 'Active Items',
            value: '$activeCount',
            color: const Color(0xFFF97316),
          ),
        ),
            SizedBox(
              width: cardWidth,
              child: _StatCard(
            icon: Icons.attach_money_rounded,
            label: 'Estimated Total',
            value: _currency(estimatedTotal),
            color: const Color(0xFF16A34A),
          ),
        ),
            SizedBox(
              width: cardWidth,
              child: _StatCard(
            icon: Icons.check_circle_outline_rounded,
            label: 'Spent',
            value: _currency(actualTotal),
            color: const Color(0xFF2563EB),
          ),
        ),
          ],
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 7),
            Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF6B7280),
                fontSize: 11,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 17,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ShoppingCategory extends StatelessWidget {
  const _ShoppingCategory({
    required this.category,
    required this.items,
    required this.busyId,
  });

  final String category;
  final List<ShoppingItemModel> items;
  final int? busyId;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 17),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _ColorBadge(
                label: _titleCase(category),
                color: _categoryColor(category),
              ),
              const SizedBox(width: 8),
              Text(
                '(${items.length} ${items.length == 1 ? 'item' : 'items'})',
                style: const TextStyle(
                  color: Color(0xFF6B7280),
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...items.map(
            (item) => _ShoppingItemCard(
              item: item,
              isBusy: busyId == item.id,
              onDelete: () => _confirmDeleteShoppingItem(context, item),
            ),
          ),
        ],
      ),
    );
  }
}

class _ShoppingItemCard extends StatelessWidget {
  const _ShoppingItemCard({
    required this.item,
    required this.isBusy,
    required this.onDelete,
  });

  final ShoppingItemModel item;
  final bool isBusy;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        child: Row(
          children: [
            Checkbox(
              value: item.isPurchased,
              onChanged: isBusy
                  ? null
                  : (value) => context.read<MealShoppingBloc>().add(
                        ToggleShoppingItem(
                          item.id,
                          value ?? false,
                        ),
                      ),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.itemName,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                  if (_hasText(item.quantity))
                    Text(
                      item.quantity!,
                      style: const TextStyle(
                        color: Color(0xFF6B7280),
                        fontSize: 13,
                      ),
                    ),
                  if (item.estimatedCost != null ||
                      item.actualCost != null) ...[
                    const SizedBox(height: 3),
                    Wrap(
                      spacing: 12,
                      children: [
                        if (item.estimatedCost != null)
                          Text(
                            'Est: ${_currency(item.estimatedCost!)}',
                            style: const TextStyle(
                              color: Color(0xFF6B7280),
                              fontSize: 12,
                            ),
                          ),
                        if (item.actualCost != null)
                          Text(
                            'Actual: ${_currency(item.actualCost!)}',
                            style: const TextStyle(
                              color: Color(0xFF16A34A),
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            if (isBusy)
              const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            else if (item.isPurchased)
              const Icon(
                Icons.check_circle_rounded,
                color: Color(0xFF16A34A),
              ),
            IconButton(
              tooltip: 'Remove shopping item',
              onPressed: isBusy ? null : onDelete,
              icon: const Icon(Icons.delete_outline_rounded),
            ),
          ],
        ),
      ),
    );
  }
}

class _IntroCard extends StatelessWidget {
  const _IntroCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
    required this.actionLabel,
    required this.onAction,
  });

  final IconData icon;
  final String title;
  final String description;
  final Color color;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color),
                const SizedBox(width: 9),
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 18,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 7),
            Text(
              description,
              style: const TextStyle(color: Color(0xFF6B7280)),
            ),
            const SizedBox(height: 14),
            FilledButton.icon(
              onPressed: onAction,
              icon: const Icon(Icons.add, size: 18),
              label: Text(actionLabel),
            ),
          ],
        ),
      ),
    );
  }
}

Future<void> _confirmDeleteShoppingItem(
  BuildContext context,
  ShoppingItemModel item,
) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: const Text('Remove shopping item?'),
      content: Text('Remove “${item.itemName}” from your shopping list?'),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(dialogContext).pop(true),
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFFDC2626),
          ),
          child: const Text('Remove'),
        ),
      ],
    ),
  );
  if (confirmed == true && context.mounted) {
    context.read<MealShoppingBloc>().add(DeleteShoppingItem(item.id));
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF2563EB), size: 22),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}

class _ColorBadge extends StatelessWidget {
  const _ColorBadge({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 50),
      child: Column(
        children: [
          Icon(icon, size: 48, color: const Color(0xFF9CA3AF)),
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

class _MealShoppingLoading extends StatelessWidget {
  const _MealShoppingLoading();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(height: 112, color: const Color(0xFFE5E7EB)),
        const SizedBox(height: 16),
        Container(height: 34, color: const Color(0xFFE5E7EB)),
        const SizedBox(height: 12),
        Container(height: 100, color: const Color(0xFFE5E7EB)),
        const SizedBox(height: 12),
        Container(height: 100, color: const Color(0xFFE5E7EB)),
      ],
    );
  }
}

class _MealShoppingError extends StatelessWidget {
  const _MealShoppingError({
    required this.message,
    required this.onRetry,
  });

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
              color: Color(0xFFB91C1C),
              size: 44,
            ),
            const SizedBox(height: 12),
            const Text(
              'We could not load your meal and shopping data.',
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

Future<void> _showMealPlanDialog(BuildContext context) async {
  final mealShoppingBloc = context.read<MealShoppingBloc>();
  final nameController = TextEditingController();
  final cookingTimeController = TextEditingController(text: '30');
  final recipeController = TextEditingController();
  final formKey = GlobalKey<FormState>();
  var mealType = 'breakfast';
  var plannedDate = _dateOnly(DateTime.now());

  await showDialog<void>(
    context: context,
    builder: (dialogContext) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: const Text('Add New Meal'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: nameController,
                  decoration: const InputDecoration(
                    labelText: 'Meal Name',
                    hintText: 'e.g., Scrambled eggs and toast',
                  ),
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: mealType,
                  decoration: const InputDecoration(labelText: 'Meal Type'),
                  items: _mealTypes
                      .map(
                        (value) => DropdownMenuItem(
                          value: value,
                          child: Text(_titleCase(value)),
                        ),
                      )
                      .toList(),
                  onChanged: (value) =>
                      setState(() => mealType = value ?? mealType),
                  validator: (value) =>
                      value == null ? 'Meal type is required' : null,
                ),
                const SizedBox(height: 12),
                _DatePickerField(
                  label: 'Planned Date',
                  value: plannedDate,
                  onTap: () async {
                    final picked = await _pickDate(
                      context,
                      DateTime.tryParse(plannedDate) ?? DateTime.now(),
                      firstDate: DateTime.now(),
                    );
                    if (picked != null) {
                      setState(() => plannedDate = _dateOnly(picked));
                    }
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: cookingTimeController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Cooking Time (minutes)',
                    hintText: '30',
                  ),
                  validator: _positiveIntValidator,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: recipeController,
                  minLines: 3,
                  maxLines: 5,
                  decoration: const InputDecoration(
                    labelText: 'Recipe/Instructions (Optional)',
                    hintText: 'Write simple cooking instructions or notes...',
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
            onPressed: () {
              if (!formKey.currentState!.validate()) return;
              mealShoppingBloc.add(
                    AddMealPlan(
                      MealPlanInput(
                        mealType: mealType,
                        mealName: nameController.text,
                        plannedDate: plannedDate,
                        recipe: recipeController.text,
                        cookingTime:
                            int.tryParse(cookingTimeController.text.trim()) ??
                                0,
                      ),
                    ),
                  );
              Navigator.pop(dialogContext);
            },
            child: const Text('Add Meal Plan'),
          ),
        ],
      ),
    ),
  );
  nameController.dispose();
  cookingTimeController.dispose();
  recipeController.dispose();
}

Future<void> _showShoppingItemDialog(BuildContext context) async {
  final mealShoppingBloc = context.read<MealShoppingBloc>();
  final nameController = TextEditingController();
  final quantityController = TextEditingController();
  final estimatedCostController = TextEditingController();
  final formKey = GlobalKey<FormState>();
  var category = 'produce';

  await showDialog<void>(
    context: context,
    builder: (dialogContext) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: const Text('Add Shopping Item'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: nameController,
                  decoration: const InputDecoration(
                    labelText: 'Item Name',
                    hintText: 'e.g., Bananas',
                  ),
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: category,
                  decoration: const InputDecoration(labelText: 'Category'),
                  items: _shoppingCategories
                      .map(
                        (value) => DropdownMenuItem(
                          value: value,
                          child: Text(_categoryLabel(value)),
                        ),
                      )
                      .toList(),
                  onChanged: (value) =>
                      setState(() => category = value ?? category),
                  validator: (value) =>
                      value == null ? 'Category is required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: quantityController,
                  decoration: const InputDecoration(
                    labelText: 'Quantity',
                    hintText: 'e.g., 2 lbs, 1 gallon',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: estimatedCostController,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  inputFormatters: [_nonNegativeMoneyFormatter],
                  decoration: const InputDecoration(
                    labelText: 'Estimated Cost (\$)',
                    hintText: '5.99',
                  ),
                  validator: _optionalMoneyValidator,
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
            onPressed: () {
              if (!formKey.currentState!.validate()) return;
              mealShoppingBloc.add(
                    AddShoppingItem(
                      ShoppingItemInput(
                        itemName: nameController.text,
                        category: category,
                        quantity: quantityController.text,
                        estimatedCost: double.tryParse(
                          estimatedCostController.text.trim(),
                        ),
                      ),
                    ),
                  );
              Navigator.pop(dialogContext);
            },
            child: const Text('Add to Shopping List'),
          ),
        ],
      ),
    ),
  );
  nameController.dispose();
  quantityController.dispose();
  estimatedCostController.dispose();
}

class _DatePickerField extends StatelessWidget {
  const _DatePickerField({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: const Icon(Icons.calendar_today_outlined, size: 18),
          border: const OutlineInputBorder(),
        ),
        child: Text(_friendlyDate(value)),
      ),
    );
  }
}

Future<DateTime?> _pickDate(
  BuildContext context,
  DateTime initialDate, {
  required DateTime firstDate,
}) {
  final today = DateTime.now();
  return showDatePicker(
    context: context,
    initialDate: initialDate.isBefore(firstDate) ? firstDate : initialDate,
    firstDate: firstDate,
    lastDate: DateTime(today.year + 5),
  );
}

Future<void> _refresh(BuildContext context) async {
  final bloc = context.read<MealShoppingBloc>();
  final completion = bloc.stream.firstWhere(
    (state) =>
        (state.status == MealShoppingStatus.loaded ||
            state.status == MealShoppingStatus.failure) &&
        state.action == MealShoppingAction.none &&
        state.isLoading == false,
  );
  bloc.add(const RefreshMealShopping());
  await completion;
}

String? _requiredValidator(String? value) {
  if (value == null || value.trim().isEmpty) return 'This field is required';
  return null;
}

String? _positiveIntValidator(String? value) {
  if (value == null || value.trim().isEmpty) return null;
  final parsed = int.tryParse(value.trim());
  if (parsed == null || parsed < 0) return 'Enter a whole number';
  return null;
}

String? _optionalMoneyValidator(String? value) {
  if (value == null || value.trim().isEmpty) return null;
  final parsed = double.tryParse(value.trim());
  if (parsed == null || parsed < 0) return 'Enter a valid non-negative amount';
  return null;
}

final _nonNegativeMoneyFormatter = TextInputFormatter.withFunction(
  (oldValue, newValue) {
    final text = newValue.text;
    return text.isEmpty || RegExp(r'^\d*\.?\d*$').hasMatch(text)
        ? newValue
        : oldValue;
  },
);

bool _hasText(String? value) => value != null && value.trim().isNotEmpty;

String _dateOnly(DateTime date) {
  final local = date.toLocal();
  return '${local.year}-${local.month.toString().padLeft(2, '0')}-'
      '${local.day.toString().padLeft(2, '0')}';
}

int _dateValue(String value) =>
    int.tryParse(value.replaceAll('-', '')) ?? 99999999;

String _friendlyDate(String value) {
  final date = DateTime.tryParse(value);
  if (date == null) return value;
  const weekdays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return '${weekdays[date.weekday - 1]}, ${months[date.month - 1]} '
      '${date.day}, ${date.year}';
}

String _currency(double value) => '\$${value.toStringAsFixed(2)}';

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

String _categoryLabel(String value) =>
    value == 'meat' ? 'Meat & Seafood' : _titleCase(value);

int _mealTypeOrder(String value) {
  const order = {
    'breakfast': 1,
    'lunch': 2,
    'dinner': 3,
    'snack': 4,
  };
  return order[value] ?? 99;
}

Color _mealTypeColor(String value) {
  switch (value) {
    case 'breakfast':
      return const Color(0xFFF97316);
    case 'lunch':
      return const Color(0xFF16A34A);
    case 'dinner':
      return const Color(0xFF2563EB);
    case 'snack':
      return const Color(0xFFDB2777);
    default:
      return const Color(0xFF6B7280);
  }
}

Color _categoryColor(String value) {
  switch (value) {
    case 'produce':
      return const Color(0xFF16A34A);
    case 'dairy':
      return const Color(0xFF2563EB);
    case 'meat':
      return const Color(0xFFDB2777);
    case 'pantry':
      return const Color(0xFFF97316);
    case 'frozen':
      return const Color(0xFF0D9488);
    case 'household':
      return const Color(0xFF9333EA);
    default:
      return const Color(0xFF4B5563);
  }
}

const _mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
const _shoppingCategories = [
  'produce',
  'dairy',
  'meat',
  'pantry',
  'frozen',
  'household',
];