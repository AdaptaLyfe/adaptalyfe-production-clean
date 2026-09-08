import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../bloc/financial_bloc.dart';
import '../bloc/financial_event.dart';
import '../bloc/financial_state.dart';
import '../models/financial_models.dart';

class FinancialScreen extends StatefulWidget {
  const FinancialScreen({super.key});

  @override
  State<FinancialScreen> createState() => _FinancialScreenState();
}

class _FinancialScreenState extends State<FinancialScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_onTabChanged);
  }

  @override
  void dispose() {
    _tabController
      ..removeListener(_onTabChanged)
      ..dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<FinancialBloc, FinancialState>(
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
        return Scaffold(
          appBar: AppBar(
            title: const Text('Financial Management'),
            actions: [
              IconButton(
                tooltip: 'Refresh financial data',
                onPressed: () => context
                    .read<FinancialBloc>()
                    .add(const RefreshFinancial()),
                icon: const Icon(Icons.refresh_rounded),
              ),
            ],
            bottom: TabBar(
              controller: _tabController,
              tabs: const [
                Tab(text: 'Overview'),
                Tab(text: 'Bills'),
                Tab(text: 'Budget'),
              ],
            ),
          ),
          body: _FinancialBody(
            state: state,
            tabIndex: _tabController.index,
          ),
        );
      },
    );
  }
}

class _FinancialBody extends StatelessWidget {
  const _FinancialBody({
    required this.state,
    required this.tabIndex,
  });

  final FinancialState state;
  final int tabIndex;

  @override
  Widget build(BuildContext context) {
    if (state.isLoading && !state.hasData) {
      return const _FinancialLoading();
    }

    if (state.status == FinancialStatus.failure && !state.hasData) {
      return _FinancialError(
        message: state.errorMessage ?? 'Unable to load financial data.',
        onRetry: () {
          context.read<FinancialBloc>().add(const RefreshFinancial());
        },
      );
    }

    final content = switch (tabIndex) {
      1 => _BillsTab(state: state),
      2 => _BudgetTab(state: state),
      _ => _OverviewTab(state: state),
    };

    return RefreshIndicator(
      onRefresh: () => _refresh(context),
      child: content,
    );
  }

  Future<void> _refresh(BuildContext context) async {
    final bloc = context.read<FinancialBloc>();
    bloc.add(const RefreshFinancial());
    await bloc.stream.firstWhere(
      (nextState) =>
          (nextState.status == FinancialStatus.loaded ||
              nextState.status == FinancialStatus.failure) &&
          nextState.activeOperation == null,
    );
  }
}

class _OverviewTab extends StatelessWidget {
  const _OverviewTab({required this.state});

  final FinancialState state;

  @override
  Widget build(BuildContext context) {
    final categoryTotals = <String, double>{};
    for (final entry
        in state.budgetEntries.where((entry) => entry.type == 'expense')) {
      categoryTotals[entry.category] =
          (categoryTotals[entry.category] ?? 0) + entry.amount;
    }

    final recentEntries = state.budgetEntries.reversed.toList();
    final upcomingBills = state.bills
        .where((bill) => !bill.isPaid)
        .toList()
      ..sort(
        (a, b) => _daysUntilDue(a.dueDate).compareTo(_daysUntilDue(b.dueDate)),
      );

    return _FinancialListView(
      state: state,
      children: [
        const _SectionHeader(
          title: 'Financial dashboard',
          subtitle: 'Track your budget, bills, and payments in one place.',
        ),
        _SummaryGrid(state: state),
        _BudgetUsageCard(state: state),
        _UpcomingBillsCard(bills: upcomingBills.take(1).toList()),
        _TransactionsCard(
          entries: recentEntries.take(5).toList(),
          categoryTotals: categoryTotals,
          onDelete: (entry) => _confirmDeleteEntry(context, entry),
        ),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _showBudgetDialog(context, 'expense'),
                icon: const Icon(Icons.remove_circle_outline),
                label: const Text('Add Expense'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: FilledButton.icon(
                onPressed: () => _showBudgetDialog(context, 'income'),
                icon: const Icon(Icons.add_circle_outline),
                label: const Text('Add Income'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _BillsTab extends StatelessWidget {
  const _BillsTab({required this.state});

  final FinancialState state;

  @override
  Widget build(BuildContext context) {
    return _FinancialListView(
      state: state,
      children: [
        const _SectionHeader(
          title: 'Bills',
          subtitle: 'Track recurring bills and payment status.',
        ),
        Align(
          alignment: Alignment.centerRight,
          child: FilledButton.icon(
            onPressed: () => _showBillDialog(context),
            icon: const Icon(Icons.add),
            label: const Text('Add Bill'),
          ),
        ),
        const SizedBox(height: 14),
        if (state.bills.isEmpty)
          const _EmptyCard(
            icon: Icons.event_note_outlined,
            title: 'No bills added yet',
            message: 'Add your recurring bills to track due dates.',
          )
        else
          ...state.bills.map(
            (bill) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _BillCard(
                bill: bill,
                isUpdating:
                    state.activeOperation == 'pay-bill-${bill.id}',
                onEdit: () => _showBillDialog(context, bill: bill),
                onPaymentStatusChanged: (isPaid) {
                  context.read<FinancialBloc>().add(
                        SetBillPaymentStatus(
                          billId: bill.id,
                          isPaid: isPaid,
                        ),
                      );
                },
              ),
            ),
          ),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _BudgetTab extends StatelessWidget {
  const _BudgetTab({required this.state});

  final FinancialState state;

  @override
  Widget build(BuildContext context) {
    final entries = state.budgetEntries.reversed.toList();
    return _FinancialListView(
      state: state,
      children: [
        const _SectionHeader(
          title: 'Budget and income',
          subtitle: 'Add income or expenses and review your financial records.',
        ),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _showBudgetDialog(context, 'expense'),
                icon: const Icon(Icons.remove_circle_outline),
                label: const Text('Expense'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: FilledButton.icon(
                onPressed: () => _showBudgetDialog(context, 'income'),
                icon: const Icon(Icons.add_circle_outline),
                label: const Text('Income'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),
        _BudgetTotalsCard(state: state),
        const SizedBox(height: 16),
        if (entries.isEmpty)
          const _EmptyCard(
            icon: Icons.receipt_long_outlined,
            title: 'No transactions yet',
            message: 'Add income or an expense to start tracking your budget.',
          )
        else
          ...entries.map(
            (entry) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _BudgetEntryCard(
                entry: entry,
                isDeleting:
                    state.activeOperation == 'delete-budget-entry-${entry.id}',
                onDelete: () => _confirmDeleteEntry(context, entry),
              ),
            ),
          ),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _FinancialListView extends StatelessWidget {
  const _FinancialListView({
    required this.state,
    required this.children,
  });

  final FinancialState state;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
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
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
        children: [
          if (state.isLoading) const LinearProgressIndicator(),
          if (state.isLoading) const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }
}

class _SummaryGrid extends StatelessWidget {
  const _SummaryGrid({required this.state});

  final FinancialState state;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      childAspectRatio: 1.65,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        _SummaryCard(
          label: 'Monthly income',
          value: _currency(state.totalIncome),
          color: const Color(0xFF16A34A),
          icon: Icons.attach_money_rounded,
        ),
        _SummaryCard(
          label: 'Total expenses',
          value: _currency(state.totalExpenses),
          color: const Color(0xFFEA580C),
          icon: Icons.credit_card_rounded,
        ),
        _SummaryCard(
          label: 'Budget used',
          value: '${state.budgetUsed.round()}%',
          color: _budgetColor(state.budgetUsed),
          icon: Icons.check_circle_outline_rounded,
        ),
        _SummaryCard(
          label: 'Remaining',
          value: _currency(state.remaining),
          color: state.remaining >= 0
              ? const Color(0xFF2563EB)
              : const Color(0xFFB91C1C),
          icon: Icons.account_balance_wallet_outlined,
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
  });

  final String label;
  final String value;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(13),
        border: Border(top: BorderSide(color: color, width: 4)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x10000000),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF6B7280),
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: color,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BudgetUsageCard extends StatelessWidget {
  const _BudgetUsageCard({required this.state});

  final FinancialState state;

  @override
  Widget build(BuildContext context) {
    final color = _budgetColor(state.budgetUsed);
    final status = state.budgetUsed < 80
        ? 'On track'
        : state.budgetUsed < 100
            ? 'Watch spending'
            : 'Over budget';
    final progress = (state.budgetUsed / 100).clamp(0.0, 1.0).toDouble();

    return _SectionCard(
      title: 'Monthly budget overview',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Budget usage',
                style: TextStyle(
                  color: Color(0xFF374151),
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                status,
                style: TextStyle(color: color, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              minHeight: 12,
              value: progress,
              backgroundColor: const Color(0xFFE5E7EB),
              color: color,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${_currency(state.totalExpenses)} spent'),
              Text('${_currency(state.totalIncome)} budget'),
            ],
          ),
          const SizedBox(height: 8),
          Center(
            child: _Pill(
              label:
                  '${state.budgetUsed.round()}% Used • ${_currency(state.remaining)} Remaining',
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _BudgetTotalsCard extends StatelessWidget {
  const _BudgetTotalsCard({required this.state});

  final FinancialState state;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _MiniTotal(
            label: 'Income',
            value: _currency(state.totalIncome),
            color: const Color(0xFF16A34A),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _MiniTotal(
            label: 'Expenses',
            value: _currency(state.totalExpenses),
            color: const Color(0xFFDC2626),
          ),
        ),
      ],
    );
  }
}

class _MiniTotal extends StatelessWidget {
  const _MiniTotal({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFF6B7280))),
          const SizedBox(height: 5),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _UpcomingBillsCard extends StatelessWidget {
  const _UpcomingBillsCard({required this.bills});

  final List<BillModel> bills;

  @override
  Widget build(BuildContext context) {
    if (bills.isEmpty) return const SizedBox.shrink();
    final bill = bills.first;
    final days = _daysUntilDue(bill.dueDate);
    final isUrgent = days <= 3;

    return _SectionCard(
      title: 'Upcoming bill',
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor:
                isUrgent ? const Color(0xFFDC2626) : const Color(0xFFF59E0B),
            child: Icon(
              isUrgent ? Icons.warning_amber_rounded : Icons.calendar_month,
              color: Colors.white,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  bill.name,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${_currency(bill.amount)} • ${_dueLabel(days)}',
                  style: const TextStyle(color: Color(0xFF6B7280)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TransactionsCard extends StatelessWidget {
  const _TransactionsCard({
    required this.entries,
    required this.categoryTotals,
    required this.onDelete,
  });

  final List<BudgetEntryModel> entries;
  final Map<String, double> categoryTotals;
  final ValueChanged<BudgetEntryModel> onDelete;

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: 'Recent transactions',
      child: Column(
        children: [
          if (entries.isEmpty)
            const Text(
              'No transactions yet',
              style: TextStyle(color: Color(0xFF6B7280)),
            )
          else
            ...entries.map(
              (entry) => _TransactionRow(
                entry: entry,
                onDelete: () => onDelete(entry),
              ),
            ),
          const SizedBox(height: 14),
          const Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'Expense categories',
              style: TextStyle(
                color: Color(0xFF374151),
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(height: 8),
          if (categoryTotals.isEmpty)
            const Text(
              'No expenses tracked yet',
              style: TextStyle(color: Color(0xFF6B7280)),
            )
          else
            ...categoryTotals.entries.map(
              (item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 5),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      item.key,
                      style: const TextStyle(
                        color: Color(0xFF374151),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      _currency(item.value),
                      style: const TextStyle(
                        color: Color(0xFFDC2626),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _TransactionRow extends StatelessWidget {
  const _TransactionRow({
    required this.entry,
    required this.onDelete,
  });

  final BudgetEntryModel entry;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final isIncome = entry.type == 'income';
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(9),
      ),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isIncome
                  ? const Color(0xFF16A34A)
                  : const Color(0xFFDC2626),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.category,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  entry.description?.isNotEmpty == true
                      ? entry.description!
                      : 'No description',
                  style: const TextStyle(
                    color: Color(0xFF6B7280),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Text(
            '${isIncome ? '+' : '-'}${_currency(entry.amount)}',
            style: TextStyle(
              color: isIncome
                  ? const Color(0xFF16A34A)
                  : const Color(0xFFDC2626),
              fontWeight: FontWeight.w700,
            ),
          ),
          IconButton(
            tooltip: 'Delete record',
            onPressed: onDelete,
            icon: const Icon(Icons.delete_outline_rounded, size: 19),
            color: const Color(0xFFB91C1C),
          ),
        ],
      ),
    );
  }
}

class _BillCard extends StatelessWidget {
  const _BillCard({
    required this.bill,
    required this.isUpdating,
    required this.onEdit,
    required this.onPaymentStatusChanged,
  });

  final BillModel bill;
  final bool isUpdating;
  final VoidCallback onEdit;
  final ValueChanged<bool> onPaymentStatusChanged;

  @override
  Widget build(BuildContext context) {
    final days = _daysUntilDue(bill.dueDate);
    final isUrgent = !bill.isPaid && days <= 3;
    final borderColor = bill.isPaid
        ? const Color(0xFF16A34A)
        : isUrgent
            ? const Color(0xFFDC2626)
            : const Color(0xFF2563EB);

    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(13),
        side: BorderSide(color: borderColor.withOpacity(0.35)),
      ),
      child: Container(
        decoration: BoxDecoration(
          border: Border(left: BorderSide(color: borderColor, width: 4)),
          borderRadius: BorderRadius.circular(13),
        ),
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        bill.name,
                        style: const TextStyle(
                          color: Color(0xFF111827),
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        bill.category,
                        style: const TextStyle(color: Color(0xFF6B7280)),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      _currency(bill.amount),
                      style: const TextStyle(
                        color: Color(0xFF111827),
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      bill.isPaid ? 'Paid' : _dueLabel(days),
                      style: TextStyle(
                        color: bill.isPaid
                            ? const Color(0xFF16A34A)
                            : isUrgent
                                ? const Color(0xFFDC2626)
                                : const Color(0xFF6B7280),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                OutlinedButton(
                  onPressed: onEdit,
                  child: const Text('Edit'),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: isUpdating
                        ? null
                        : () => onPaymentStatusChanged(!bill.isPaid),
                    icon: isUpdating
                        ? const SizedBox(
                            width: 15,
                            height: 15,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Icon(
                            bill.isPaid
                                ? Icons.undo_rounded
                                : Icons.check_rounded,
                            size: 18,
                          ),
                    label: Text(bill.isPaid ? 'Mark unpaid' : 'Mark paid'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _BudgetEntryCard extends StatelessWidget {
  const _BudgetEntryCard({
    required this.entry,
    required this.isDeleting,
    required this.onDelete,
  });

  final BudgetEntryModel entry;
  final bool isDeleting;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final isIncome = entry.type == 'income';
    return Card(
      elevation: 0,
      color: Colors.white,
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: (isIncome
                  ? const Color(0xFF16A34A)
                  : const Color(0xFFDC2626))
              .withOpacity(0.12),
          child: Icon(
            isIncome ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
            color: isIncome
                ? const Color(0xFF16A34A)
                : const Color(0xFFDC2626),
          ),
        ),
        title: Text(
          entry.category,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(entry.description?.isNotEmpty == true
            ? entry.description!
            : 'No description'),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '${isIncome ? '+' : '-'}${_currency(entry.amount)}',
              style: TextStyle(
                color: isIncome
                    ? const Color(0xFF16A34A)
                    : const Color(0xFFDC2626),
                fontWeight: FontWeight.w700,
              ),
            ),
            IconButton(
              tooltip: 'Delete record',
              onPressed: isDeleting ? null : onDelete,
              icon: isDeleting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.delete_outline_rounded),
              color: const Color(0xFFB91C1C),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Color(0xFF111827),
              fontSize: 24,
              fontWeight: FontWeight.w800,
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

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.child,
  });

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: Colors.white,
      margin: const EdgeInsets.only(top: 14),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                color: Color(0xFF111827),
                fontSize: 17,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 13),
            child,
          ],
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({
    required this.label,
    required this.color,
  });

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w700,
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
    return Card(
      elevation: 0,
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(26),
        child: Column(
          children: [
            Icon(icon, size: 48, color: const Color(0xFF9CA3AF)),
            const SizedBox(height: 10),
            Text(
              title,
              style: const TextStyle(
                color: Color(0xFF374151),
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 5),
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

class _FinancialLoading extends StatelessWidget {
  const _FinancialLoading();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          height: 34,
          width: 220,
          margin: const EdgeInsets.only(bottom: 16),
          color: const Color(0xFFE5E7EB),
        ),
        GridView.count(
          crossAxisCount: 2,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: List.generate(
            4,
            (index) => Container(color: const Color(0xFFE5E7EB)),
          ),
        ),
        const SizedBox(height: 16),
        Container(height: 180, color: const Color(0xFFE5E7EB)),
      ],
    );
  }
}

class _FinancialError extends StatelessWidget {
  const _FinancialError({
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
              'We could not load your financial data.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF991B1B),
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

class _BillDialog extends StatefulWidget {
  const _BillDialog({this.bill});

  final BillModel? bill;

  @override
  State<_BillDialog> createState() => _BillDialogState();
}

class _BillDialogState extends State<_BillDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _amountController;
  late final TextEditingController _dueDateController;
  late final TextEditingController _categoryController;
  late bool _isRecurring;

  @override
  void initState() {
    super.initState();
    final bill = widget.bill;
    _nameController = TextEditingController(text: bill?.name ?? '');
    _amountController = TextEditingController(
      text: bill == null ? '' : bill.amount.toStringAsFixed(2),
    );
    _dueDateController = TextEditingController(
      text: bill == null ? '' : bill.dueDate.toString(),
    );
    _categoryController = TextEditingController(text: bill?.category ?? '');
    _isRecurring = bill?.isRecurring ?? true;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _amountController.dispose();
    _dueDateController.dispose();
    _categoryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.bill == null ? 'Add New Bill' : 'Edit Bill'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Bill name'),
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Bill name is required'
                    : null,
              ),
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(labelText: 'Amount'),
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                validator: (value) {
                  final amount = double.tryParse(value ?? '');
                  return amount == null || amount < 0.01
                      ? 'Amount must be greater than 0'
                      : null;
                },
              ),
              TextFormField(
                controller: _dueDateController,
                decoration:
                    const InputDecoration(labelText: 'Due date (day 1-31)'),
                keyboardType: TextInputType.number,
                validator: (value) {
                  final day = int.tryParse(value ?? '');
                  return day == null || day < 1 || day > 31
                      ? 'Enter a day from 1 to 31'
                      : null;
                },
              ),
              TextFormField(
                controller: _categoryController,
                decoration: const InputDecoration(labelText: 'Category'),
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Category is required'
                    : null,
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Recurring bill'),
                value: _isRecurring,
                onChanged: (value) => setState(() => _isRecurring = value),
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
          onPressed: _submit,
          child: Text(widget.bill == null ? 'Add bill' : 'Update bill'),
        ),
      ],
    );
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    Navigator.of(context).pop(
      BillInput(
        name: _nameController.text.trim(),
        amount: double.parse(_amountController.text),
        dueDate: int.parse(_dueDateController.text),
        category: _categoryController.text.trim(),
        isRecurring: _isRecurring,
      ),
    );
  }
}

class _BudgetDialog extends StatefulWidget {
  const _BudgetDialog({required this.initialType});

  final String initialType;

  @override
  State<_BudgetDialog> createState() => _BudgetDialogState();
}

class _BudgetDialogState extends State<_BudgetDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _categoryController;
  late final TextEditingController _amountController;
  late final TextEditingController _descriptionController;
  late String _type;

  @override
  void initState() {
    super.initState();
    _type = widget.initialType;
    _categoryController = TextEditingController();
    _amountController = TextEditingController();
    _descriptionController = TextEditingController();
  }

  @override
  void dispose() {
    _categoryController.dispose();
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(_type == 'income' ? 'Add Income' : 'Add Expense'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: _type,
                decoration: const InputDecoration(labelText: 'Entry type'),
                items: const [
                  DropdownMenuItem(value: 'income', child: Text('Income')),
                  DropdownMenuItem(value: 'expense', child: Text('Expense')),
                ],
                onChanged: (value) {
                  if (value != null) setState(() => _type = value);
                },
              ),
              TextFormField(
                controller: _categoryController,
                decoration: const InputDecoration(
                  labelText: 'Category',
                  hintText: 'e.g. Groceries, salary',
                ),
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Category is required'
                    : null,
              ),
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(labelText: 'Amount'),
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                validator: (value) {
                  final amount = double.tryParse(value ?? '');
                  return amount == null || amount < 0.01
                      ? 'Amount must be greater than 0'
                      : null;
                },
              ),
              TextFormField(
                controller: _descriptionController,
                decoration:
                    const InputDecoration(labelText: 'Description (optional)'),
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
          onPressed: _submit,
          child: const Text('Add entry'),
        ),
      ],
    );
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    Navigator.of(context).pop(
      BudgetEntryInput(
        category: _categoryController.text.trim(),
        amount: double.parse(_amountController.text),
        type: _type,
        description: _descriptionController.text.trim(),
      ),
    );
  }
}

Future<void> _showBillDialog(
  BuildContext context, {
  BillModel? bill,
}) async {
  final input = await showDialog<BillInput>(
    context: context,
    builder: (_) => _BillDialog(bill: bill),
  );
  if (input == null || !context.mounted) return;

  final bloc = context.read<FinancialBloc>();
  if (bill == null) {
    bloc.add(AddBill(input));
  } else {
    bloc.add(EditBill(billId: bill.id, input: input));
  }
}

Future<void> _showBudgetDialog(
  BuildContext context,
  String type,
) async {
  final input = await showDialog<BudgetEntryInput>(
    context: context,
    builder: (_) => _BudgetDialog(initialType: type),
  );
  if (input == null || !context.mounted) return;
  context.read<FinancialBloc>().add(AddBudgetEntry(input));
}

Future<void> _confirmDeleteEntry(
  BuildContext context,
  BudgetEntryModel entry,
) async {
  final shouldDelete = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: const Text('Delete this record?'),
      content: Text(
        'Delete the ${entry.type} record for ${entry.category}?',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFFB91C1C),
          ),
          onPressed: () => Navigator.of(dialogContext).pop(true),
          child: const Text('Delete'),
        ),
      ],
    ),
  );

  if (shouldDelete == true && context.mounted) {
    context.read<FinancialBloc>().add(DeleteBudgetEntry(entry.id));
  }
}

String _currency(double amount) => '\$${amount.toStringAsFixed(2)}';

Color _budgetColor(double usage) {
  if (usage < 80) return const Color(0xFF16A34A);
  if (usage < 100) return const Color(0xFFD97706);
  return const Color(0xFFDC2626);
}

int _daysUntilDue(int dueDay) {
  final today = DateTime.now();
  var target = DateTime(today.year, today.month, dueDay);
  if (dueDay < today.day) {
    target = DateTime(today.year, today.month + 1, dueDay);
  }
  return math.max(
    0,
    ((target.millisecondsSinceEpoch - today.millisecondsSinceEpoch) /
            Duration.millisecondsPerDay)
        .ceil(),
  );
}

String _dueLabel(int days) {
  if (days == 0) return 'Due today';
  return 'Due in $days day${days == 1 ? '' : 's'}';
}